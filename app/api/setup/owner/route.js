// One-time owner bootstrap.
//
// Creates the first owner account from environment variables when no owner
// exists yet. This is deliberately NOT a public signup path:
//   - it refuses to run unless x-setup-secret matches OWNER_SETUP_SECRET
//   - it refuses to run once any owner already exists
//   - the password is read from the environment, never from the request body
//   - the password is bcrypt-hashed before storage and never returned or logged
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  safeErrorResponse,
  successResponse,
  badRequestResponse,
  forbiddenResponse,
} from "@/lib/errors";

const BCRYPT_COST = 12;

function serializeOwner(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    authenticatedEmail: user.authenticatedEmail,
    authenticatedByOwner: user.authenticatedByOwner,
    createdAt: user.createdAt,
  };
}

// GET reports whether bootstrap is still required, without exposing anything
// about the owner account itself.
export async function GET() {
  try {
    await connectDB();
    const ownerCount = await User.countDocuments({ role: "owner" });
    return successResponse({
      ownerExists: ownerCount > 0,
      setupRequired: ownerCount === 0,
    });
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const rate = await checkRateLimit(request, "ownerBootstrap", {
      windowMs: 60 * 60 * 1000,
      maxAttempts: 5,
    });
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfter);
    }

    const setupSecret = process.env.OWNER_SETUP_SECRET;
    if (!setupSecret) {
      return badRequestResponse(
        "Owner bootstrap is not configured. Set OWNER_SETUP_SECRET in the environment."
      );
    }

    // Compare against the header rather than anything in the body, so the
    // secret is never part of a form post or a logged payload.
    const provided = request.headers.get("x-setup-secret") || "";
    if (provided !== setupSecret) {
      return forbiddenResponse("Invalid setup secret.");
    }

    await connectDB();

    // Idempotent: never create a second owner, and never overwrite one.
    const existingOwner = await User.findOne({ role: "owner" });
    if (existingOwner) {
      return NextResponse.json(
        {
          success: true,
          created: false,
          message: "An owner account already exists. No action taken.",
          data: serializeOwner(existingOwner),
        },
        { status: 200 }
      );
    }

    const email = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
    const username = (process.env.OWNER_USERNAME || "").trim();
    const password = process.env.OWNER_PASSWORD || "";

    const missing = [];
    if (!email) missing.push("OWNER_EMAIL");
    if (!username) missing.push("OWNER_USERNAME");
    if (!password) missing.push("OWNER_PASSWORD");
    if (missing.length) {
      return badRequestResponse(
        `Owner bootstrap is missing required environment values: ${missing.join(", ")}.`
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequestResponse("OWNER_EMAIL is not a valid email address.");
    }
    if (password.length < 8) {
      return badRequestResponse("OWNER_PASSWORD must be at least 8 characters.");
    }

    // The email column is unique across all roles, so a clashing non-owner
    // account must be surfaced rather than silently upgraded to owner.
    const emailTaken = await User.findOne({ email });
    if (emailTaken) {
      return badRequestResponse(
        "OWNER_EMAIL is already in use by another account."
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const owner = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "owner",
      status: "active",
      // The bootstrap owner is trusted by construction: there is no earlier
      // account that could approve it.
      authenticatedEmail: true,
      authenticatedByOwner: true,
    });

    await writeAuditLog({
      action: "owner_bootstrap",
      // Must match the AuditLog entityType enum: user | organization | admin | activation
      entityType: "user",
      entityId: owner._id,
      performedByUserId: owner._id,
      performedByRole: "owner",
      // Records that bootstrap happened and for which address, but never the
      // password or the setup secret.
      details: { email: owner.email, source: "environment" },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(
      {
        success: true,
        created: true,
        message: "Owner account created successfully.",
        data: serializeOwner(owner),
      },
      { status: 201 }
    );
  } catch (error) {
    return safeErrorResponse(error);
  }
}
