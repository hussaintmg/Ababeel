// Owner-initiated password reset for an admin or organization account.
//
// Generates an 8-character password, stores only its bcrypt hash, and emails
// the plaintext to the account holder. The owner may not target another owner.
import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { requireOwner } from "@/lib/auth";
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
  generateAccountPassword,
  hashPassword,
  sendNewPasswordEmail,
} from "@/lib/accountPassword";

export async function POST(request, { params }) {
  try {
    const { user: owner, error: authError } = await requireOwner(request);
    if (authError) return authError;

    const { id } = await params;
    const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
    if (!idValidation.success) {
      return badRequestResponse("Invalid user ID format");
    }

    const rateLimitResult = await checkRateLimit(request, "ownerAdminCreation", {
      userId: owner._id.toString(),
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }

    await connectDB();

    const target = await User.findById(id);
    if (!target) return notFoundResponse("Account not found");

    // Only admin and organization accounts can be reset this way. Owners are
    // excluded so this endpoint cannot be used to take over another owner.
    if (!["admin", "organization"].includes(target.role)) {
      return forbiddenResponse(
        "Only admin and organization accounts can be reset here"
      );
    }

    if (!target.email) {
      return badRequestResponse("This account has no email address to send to");
    }

    const newPassword = generateAccountPassword(8);
    target.password = await hashPassword(newPassword);
    // The account can sign in immediately with the emailed password.
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
      entityType: target.role === "admin" ? "admin" : "organization",
      entityId: target._id,
      performedByUserId: owner._id,
      performedByRole: "owner",
      // Records that a reset happened and whether the mail went out. The
      // password itself is never logged.
      details: { email: target.email, emailSent: mail.sent },
      ipAddress: getClientIp(request),
    });

    return successResponse({
      // Returned so the owner can pass the password on if the email bounces.
      password: newPassword,
      emailSent: mail.sent,
      emailError: mail.error,
      message: mail.sent
        ? `New password generated and emailed to ${target.email}.`
        : `New password generated, but the email could not be sent (${mail.error}). Share it securely.`,
    });
  } catch (error) {
    console.error("Error resetting account password:", error);
    return safeErrorResponse(error, 500);
  }
}
