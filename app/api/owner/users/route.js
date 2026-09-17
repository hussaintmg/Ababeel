import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse } from "@/lib/errors";
import { ORG_ROLE, serializeOrganization } from "@/lib/organizations";
import "@/models/CourseReference";

// Never send credential material to the client. Applied to every user query
// below — the previous implementation spread raw documents, which included the
// bcrypt password hash and the reset/auth tokens.
const SAFE_USER_FIELDS = "-password -resetCode -resetToken -authToken";

export async function GET(request) {
  try {
    const { user: owner, error: authError } = await requireOwner(request);
    if (authError) return authError;

    await connectDB();

    // Organizations are Users with role "organization", so there is a single
    // source here rather than the previous merge of an Organization collection
    // with legacy organization users.
    const [organizationUsers, admins, users] = await Promise.all([
      User.find({ role: ORG_ROLE })
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: "admin" })
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: "user" })
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const allOrganizations = organizationUsers.map(serializeOrganization);

    const usersWithInvoiceData = users.map((user) => {
      return {
        ...user,
        totalPurchases: 0,
        invoiceCount: 0,
        paidCount: 0,
      };
    });

    // `password` is excluded by SAFE_USER_FIELDS, so activation state is
    // derived from authenticatedEmail rather than from the hash itself.
    const adminsWithData = admins.map((admin) => ({
      ...admin,
      hasPassword: admin.authenticatedEmail === true,
      activationPending: admin.authenticatedEmail === false,
    }));

    return successResponse({
      data: {
        organizations: allOrganizations,
        admins: adminsWithData,
        users: usersWithInvoiceData,
        invoices,
      },
    });
  } catch (error) {
    console.error("Error fetching owner dashboard data:", error);
    return safeErrorResponse(error, 500);
  }
}
