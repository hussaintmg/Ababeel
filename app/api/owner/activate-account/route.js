import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/utils/db";
import User from "@/models/User";
import ActivationToken from "@/models/ActivationToken";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse } from "@/lib/errors";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await connectDB();

    const activationRecord = await ActivationToken.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate("userId", "username email role");

    if (!activationRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired activation token" },
        { status: 400 }
      );
    }

    return successResponse({
      valid: true,
      user: {
        username: activationRecord.userId.username,
        email: activationRecord.userId.email,
        role: activationRecord.userId.role,
      },
    });
  } catch (error) {
    console.error("Error validating activation token:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request) {
  try {
    const rateLimitResult = await checkRateLimit(request, "accountActivation");
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
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

    const validation = validateAndSanitize(schemas.activateAccount, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { token, password } = validation.data;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await connectDB();

    const activationRecord = await ActivationToken.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!activationRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired activation token" },
        { status: 400 }
      );
    }

    const user = await User.findById(activationRecord.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    const { default: bcrypt } = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.authenticatedEmail = true;
    user.authenticatedByOwner = true;
    await user.save();

    activationRecord.used = true;
    await activationRecord.save();

    await writeAuditLog({
      action: "account_activated",
      entityType: "activation",
      entityId: user._id,
      performedByUserId: user._id,
      performedByRole: "admin",
      details: {
        activatedEmail: user.email,
        activatedRole: user.role,
      },
      ipAddress: getClientIp(request),
    });

    return successResponse({
      message: "Account activated successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Error activating account:", error);
    return safeErrorResponse(error, 500);
  }
}
