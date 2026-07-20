import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import { requireOwner } from "@/lib/auth";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  safeErrorResponse,
  successResponse,
  notFoundResponse,
  badRequestResponse,
} from "@/lib/errors";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import {
  ORG_ROLE,
  serializeOrganization,
  findOrganizationConflict,
  applyOrganizationUpdate,
} from "@/lib/organizations";

// Only ever load organization accounts through this route, so an owner cannot
// reach an admin or another owner's user record by pasting its ID here.
async function findOrganizationById(id) {
  return User.findOne({ _id: id, role: ORG_ROLE });
}

export async function GET(request, { params }) {
  try {
    const { error: authError } = await requireOwner(request);
    if (authError) return authError;

    const { id } = await params;
    const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
    if (!idValidation.success) {
      return badRequestResponse("Invalid organization ID format");
    }

    await connectDB();

    const organization = await findOrganizationById(id);
    if (!organization) return notFoundResponse("Organization not found");

    return successResponse({ data: serializeOrganization(organization) });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return safeErrorResponse(error, 500);
  }
}

async function handleUpdate(request, params) {
  const { user: owner, error: authError } = await requireOwner(request);
  if (authError) return authError;

  const { id } = await params;
  const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
  if (!idValidation.success) {
    return badRequestResponse("Invalid organization ID format");
  }

  const rateLimitResult = await checkRateLimit(request, "orgMutation", {
    userId: owner._id.toString(),
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult.retryAfter);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 20480) {
    return NextResponse.json(
      { success: false, error: "Payload too large" },
      { status: 413 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("Invalid request body");
  }

  const validation = validateAndSanitize(schemas.updateOrganization, body);
  if (!validation.success) {
    return badRequestResponse(validation.error);
  }

  // Only organization fields are writable. role, password, accountBalance and
  // every other User field are not in this list, so a crafted body cannot
  // escalate an organization into an admin or alter its balance.
  const allowedFields = [
    "name",
    "slug",
    "contactPerson",
    "contactEmail",
    "phone",
    "address",
    "website",
    "registrationNumber",
    "status",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (validation.data[field] !== undefined) {
      updates[field] = validation.data[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    return badRequestResponse("No valid fields to update");
  }

  await connectDB();

  const organization = await findOrganizationById(id);
  if (!organization) return notFoundResponse("Organization not found");

  const conflict = await findOrganizationConflict({
    name: updates.name,
    slug: updates.slug,
    email: updates.contactEmail,
    excludeId: organization._id,
  });
  if (conflict) {
    return NextResponse.json({ success: false, error: conflict }, { status: 409 });
  }

  applyOrganizationUpdate(organization, updates);
  await organization.save();

  await writeAuditLog({
    action: "organization_updated",
    entityType: "organization",
    entityId: organization._id,
    performedByUserId: owner._id,
    performedByRole: "owner",
    details: { organizationName: organization.username, fields: Object.keys(updates) },
    ipAddress: getClientIp(request),
  });

  return successResponse({ data: serializeOrganization(organization) });
}

export async function PUT(request, { params }) {
  try {
    return await handleUpdate(request, params);
  } catch (error) {
    console.error("Error updating organization:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    return await handleUpdate(request, params);
  } catch (error) {
    console.error("Error updating organization:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: owner, error: authError } = await requireOwner(request);
    if (authError) return authError;

    const { id } = await params;
    const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
    if (!idValidation.success) {
      return badRequestResponse("Invalid organization ID format");
    }

    const rateLimitResult = await checkRateLimit(request, "orgMutation", {
      userId: owner._id.toString(),
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }

    await connectDB();

    const organization = await findOrganizationById(id);
    if (!organization) return notFoundResponse("Organization not found");

    // An organization is now the identity that course references, candidates,
    // and invoices hang off. Hard-deleting one that owns records would orphan
    // them, so that case is deactivated instead and reported to the caller.
    const [courseCount, invoiceCount] = await Promise.all([
      CourseReference.countDocuments({ userId: organization._id }),
      Invoice.countDocuments({ userId: organization._id }),
    ]);

    if (courseCount > 0 || invoiceCount > 0) {
      organization.status = "inactive";
      await organization.save();

      await writeAuditLog({
        action: "organization_deactivated",
        entityType: "organization",
        entityId: organization._id,
        performedByUserId: owner._id,
        performedByRole: "owner",
        details: {
          organizationName: organization.username,
          reason: "has linked records",
          courseReferences: courseCount,
          invoices: invoiceCount,
        },
        ipAddress: getClientIp(request),
      });

      return successResponse({
        deleted: false,
        deactivated: true,
        message:
          "Organization has linked course references or invoices, so it was deactivated instead of deleted.",
        data: serializeOrganization(organization),
      });
    }

    await User.deleteOne({ _id: organization._id, role: ORG_ROLE });

    await writeAuditLog({
      action: "organization_deleted",
      entityType: "organization",
      entityId: organization._id,
      performedByUserId: owner._id,
      performedByRole: "owner",
      details: {
        organizationName: organization.username,
        organizationSlug: organization.organizationDetails?.slug || "",
      },
      ipAddress: getClientIp(request),
    });

    return successResponse({
      deleted: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return safeErrorResponse(error, 500);
  }
}
