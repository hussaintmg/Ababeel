import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import { requireRole } from "@/lib/auth";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  safeErrorResponse,
  successResponse,
  notFoundResponse,
  badRequestResponse,
  forbiddenResponse,
} from "@/lib/errors";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import {
  ORG_ROLE,
  serializeOrganization,
  findOrganizationConflict,
  applyOrganizationUpdate,
} from "@/lib/organizations";

/**
 * Load an organization and enforce the admin's creator scope.
 *
 * Both conditions matter: `role` keeps an admin from pulling up an admin or
 * owner account by ID, and the ownership comparison keeps it from reaching
 * another admin's organization. Returns a response to send, or the document.
 */
async function loadOwnedOrganization(id, admin) {
  const organization = await User.findOne({ _id: id, role: ORG_ROLE });
  if (!organization) {
    return { error: notFoundResponse("Organization not found") };
  }
  if (
    !organization.createdByUserId ||
    organization.createdByUserId.toString() !== admin._id.toString()
  ) {
    return { error: forbiddenResponse("You do not have access to this organization") };
  }
  return { organization };
}

export async function GET(request, { params }) {
  try {
    const { user: admin, error: authError } = await requireRole(request, "admin");
    if (authError) return authError;

    const { id } = await params;
    const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
    if (!idValidation.success) {
      return badRequestResponse("Invalid organization ID format");
    }

    await connectDB();

    const { organization, error } = await loadOwnedOrganization(id, admin);
    if (error) return error;

    return successResponse({ data: serializeOrganization(organization) });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return safeErrorResponse(error, 500);
  }
}

async function handleUpdate(request, params) {
  const { user: admin, error: authError } = await requireRole(request, "admin");
  if (authError) return authError;

  const { id } = await params;
  const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
  if (!idValidation.success) {
    return badRequestResponse("Invalid organization ID format");
  }

  const rateLimitResult = await checkRateLimit(request, "adminOrgMutation", {
    userId: admin._id.toString(),
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

  // Only organization fields are writable — role, password, accountBalance and
  // createdByUserId are absent, so a crafted body cannot escalate privileges
  // or reassign an organization to a different admin.
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

  const { organization, error } = await loadOwnedOrganization(id, admin);
  if (error) return error;

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
    performedByUserId: admin._id,
    performedByRole: "admin",
    details: {
      organizationName: organization.username,
      fields: Object.keys(updates),
    },
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
    const { user: admin, error: authError } = await requireRole(request, "admin");
    if (authError) return authError;

    const { id } = await params;
    const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
    if (!idValidation.success) {
      return badRequestResponse("Invalid organization ID format");
    }

    const rateLimitResult = await checkRateLimit(request, "adminOrgMutation", {
      userId: admin._id.toString(),
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }

    await connectDB();

    const { organization, error } = await loadOwnedOrganization(id, admin);
    if (error) return error;

    // Deactivate rather than delete when the organization owns records, so
    // course references and invoices are never orphaned.
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
        performedByUserId: admin._id,
        performedByRole: "admin",
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
      performedByUserId: admin._id,
      performedByRole: "admin",
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
