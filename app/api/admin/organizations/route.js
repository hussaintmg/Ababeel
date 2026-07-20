import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse } from "@/lib/errors";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import {
  ALLOWED_SORT_FIELDS,
  ALLOWED_STATUSES,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  normalizeSearch,
  generateSlug,
  serializeOrganization,
  buildOrganizationQuery,
  findOrganizationConflict,
  createOrganizationUser,
} from "@/lib/organizations";

export async function GET(request) {
  try {
    const { user: admin, error: authError } = await requireRole(request, "admin");
    if (authError) return authError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = normalizeSearch(searchParams.get("search") || "");

    const status = searchParams.get("status") || "";
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status filter" },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10)
      )
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortField = ALLOWED_SORT_FIELDS[sortBy] || "createdAt";

    // The authorization boundary: scopeToCreatorId comes from the session, not
    // the query string, so an admin cannot widen its own scope. Legacy records
    // with no creator match no admin and stay owner-visible only.
    const query = buildOrganizationQuery({
      search,
      status,
      scopeToCreatorId: admin._id,
    });

    const skip = (page - 1) * limit;

    const [organizations, totalCount] = await Promise.all([
      User.find(query)
        .select("-password -resetCode -resetToken -authToken")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return successResponse({
      data: {
        organizations: organizations.map(serializeOrganization),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin organizations:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request) {
  try {
    const { user: admin, error: authError } = await requireRole(request, "admin");
    if (authError) return authError;

    const rateLimitResult = await checkRateLimit(request, "adminOrgCreate", {
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
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const validation = validateAndSanitize(schemas.createOrganization, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const data = validation.data;
    await connectDB();

    if (!data.contactEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact email is required — it is the organization's login identity",
        },
        { status: 400 }
      );
    }

    const slug = data.slug || generateSlug(data.name);

    const conflict = await findOrganizationConflict({
      name: data.name,
      slug,
      email: data.contactEmail,
    });
    if (conflict) {
      return NextResponse.json({ success: false, error: conflict }, { status: 409 });
    }

    // Creator is always the authenticated admin; any createdByUserId supplied
    // in the body is dropped by the schema and ignored here regardless.
    const { organization, activationToken } = await createOrganizationUser({
      data: { ...data, slug },
      creator: admin,
      creatorRole: "admin",
    });

    await writeAuditLog({
      action: "organization_created",
      entityType: "organization",
      entityId: organization._id,
      performedByUserId: admin._id,
      performedByRole: "admin",
      details: {
        organizationName: organization.username,
        organizationSlug: slug,
      },
      ipAddress: getClientIp(request),
    });

    return successResponse(
      {
        data: serializeOrganization(organization),
        activationUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/activate-account?token=${activationToken}`,
        message:
          "Organization created. Share the activation link securely so it can set its password.",
        status: "awaiting_activation",
      },
      201
    );
  } catch (error) {
    console.error("Error creating organization:", error);
    return safeErrorResponse(error, 500);
  }
}
