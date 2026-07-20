// Admin-initiated password reset, restricted to organizations that admin
// created. Same mechanics as the owner endpoint: an 8-character password is
// generated, only its bcrypt hash is stored, and the plaintext is emailed.
import connectDB from "@/utils/db";
import User from "@/models/User";
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
import { ORG_ROLE } from "@/lib/organizations";
import {
  generateAccountPassword,
  hashPassword,
  sendNewPasswordEmail,
} from "@/lib/accountPassword";

export async function POST(request, { params }) {
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

    // Role filter stops an admin reaching a staff account by ID; the ownership
    // check stops it reaching another admin's organization.
    const target = await User.findOne({ _id: id, role: ORG_ROLE });
    if (!target) return notFoundResponse("Organization not found");

    if (
      !target.createdByUserId ||
      target.createdByUserId.toString() !== admin._id.toString()
    ) {
      return forbiddenResponse("You do not have access to this organization");
    }

    if (!target.email) {
      return badRequestResponse("This organization has no email address to send to");
    }

    const newPassword = generateAccountPassword(8);
    target.password = await hashPassword(newPassword);
    target.authenticatedEmail = true;
    await target.save();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const mail = await sendNewPasswordEmail({
      to: target.email,
      username: target.username,
      password: newPassword,
      loginUrl: baseUrl ? `${baseUrl}/login` : "",
    });

    await writeAuditLog({
      action: "account_password_reset",
      entityType: "organization",
      entityId: target._id,
      performedByUserId: admin._id,
      performedByRole: "admin",
      details: { email: target.email, emailSent: mail.sent },
      ipAddress: getClientIp(request),
    });

    return successResponse({
      password: newPassword,
      emailSent: mail.sent,
      emailError: mail.error,
      message: mail.sent
        ? `New password generated and emailed to ${target.email}.`
        : `New password generated, but the email could not be sent (${mail.error}). Share it securely.`,
    });
  } catch (error) {
    console.error("Error resetting organization password:", error);
    return safeErrorResponse(error, 500);
  }
}
