import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/utils/db";
import User from "@/models/User";
import ActivationToken from "@/models/ActivationToken";
import { requireOwner } from "@/lib/auth";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse } from "@/lib/errors";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const ACTIVATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  try {
    const { user: owner, error: authError } = await requireOwner(request);
    if (authError) return authError;

    const rateLimitResult = await checkRateLimit(request, "ownerAdminCreation", {
      userId: owner._id.toString(),
    });
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

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10240) {
      return NextResponse.json(
        { success: false, error: "Payload too large" },
        { status: 413 }
      );
    }

    const validation = validateAndSanitize(schemas.createAdmin, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { fullName, email, phone } = validation.data;
    const username = fullName;

    await connectDB();

    const existingEmail = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({
      username: username.trim(),
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "An account with this name already exists" },
        { status: 409 }
      );
    }

    const placeholderPassword = crypto.randomBytes(32).toString("hex");

    const { default: bcrypt } = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(placeholderPassword, 12);

    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      authenticatedByOwner: true,
      authenticatedEmail: true,
      contact: phone || "",
    });

    const activationTokenValue = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(activationTokenValue)
      .digest("hex");

    const activationToken = await ActivationToken.create({
      userId: newUser._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_EXPIRY_MS),
      createdByUserId: owner._id,
    });

    await writeAuditLog({
      action: "admin_created",
      entityType: "admin",
      entityId: newUser._id,
      performedByUserId: owner._id,
      performedByRole: "owner",
      details: {
        adminEmail: email.toLowerCase().trim(),
        adminUsername: username.trim(),
      },
      ipAddress: getClientIp(request),
    });

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return successResponse(
      {
        data: userWithoutPassword,
        activationToken: activationTokenValue,
        activationUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/activate-account?token=${activationTokenValue}`,
        message:
          "Admin account created. Share the activation link securely with the admin to set their password.",
        status: "awaiting_activation",
      },
      201
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return safeErrorResponse(error, 500);
  }
}
