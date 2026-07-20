import mongoose from "mongoose";
import connectDB from "@/utils/db";

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, index: true },
  attempts: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now, expires: 0 },
});

rateLimitSchema.index({ key: 1, createdAt: 1 });

let RateLimitModel = null;

function getModel() {
  if (!RateLimitModel) {
    RateLimitModel =
      mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
  }
  return RateLimitModel;
}

export const LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxAttempts: 10 },
  forgotPassword: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },
  resetPassword: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },
  otpVerification: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  emailVerification: { windowMs: 60 * 60 * 1000, maxAttempts: 5 },
  contactForm: { windowMs: 60 * 60 * 1000, maxAttempts: 10 },
  certificateVerification: { windowMs: 15 * 60 * 1000, maxAttempts: 30 },
  publicSearch: { windowMs: 15 * 60 * 1000, maxAttempts: 60 },
  emailSending: { windowMs: 60 * 60 * 1000, maxAttempts: 20 },
  fileUpload: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },
  paymentInitiation: { windowMs: 15 * 60 * 1000, maxAttempts: 10 },
  paymentConfirmation: { windowMs: 15 * 60 * 1000, maxAttempts: 10 },
  candidateCreation: { windowMs: 60 * 60 * 1000, maxAttempts: 100 },
  csvImport: { windowMs: 60 * 60 * 1000, maxAttempts: 10 },
  destructiveAdmin: { windowMs: 60 * 60 * 1000, maxAttempts: 10 },
  ownerBootstrap: { windowMs: 60 * 60 * 1000, maxAttempts: 5 },
  ownerAdminCreation: { windowMs: 60 * 60 * 1000, maxAttempts: 20 },
  ownerOrgCreation: { windowMs: 60 * 60 * 1000, maxAttempts: 20 },
  adminOrgCreate: { windowMs: 60 * 60 * 1000, maxAttempts: 20 },
  adminOrgMutation: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },
  orgMutation: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },
  accountActivation: { windowMs: 60 * 60 * 1000, maxAttempts: 10 },
  default: { windowMs: 60 * 60 * 1000, maxAttempts: 60 },
};

function getKey(route, ip, userId) {
  const base = userId ? `${route}:user:${userId}` : `${route}:ip:${ip}`;
  return base;
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function checkRateLimit(request, route, options = {}) {
  try {
    await connectDB();
  } catch {
    return { allowed: true, remaining: 0, retryAfter: 0 };
  }

  const config = LIMITS[route] || LIMITS.default;
  const windowMs = options.windowMs || config.windowMs;
  const maxAttempts = options.maxAttempts || config.maxAttempts;
  const ip = getClientIp(request);
  const userId = options.userId || null;
  const key = getKey(route, ip, userId);

  const Model = getModel();
  const windowStart = new Date(Date.now() - windowMs);

  try {
    await Model.deleteMany({
      key,
      createdAt: { $lt: windowStart },
    });

    const count = await Model.countDocuments({
      key,
      createdAt: { $gte: windowStart },
    });

    if (count >= maxAttempts) {
      const oldest = await Model.findOne({ key, createdAt: { $gte: windowStart } })
        .sort({ createdAt: 1 })
        .lean();
      const retryAfter = oldest
        ? Math.ceil((oldest.createdAt.getTime() + windowMs - Date.now()) / 1000)
        : Math.ceil(windowMs / 1000);

      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        total: maxAttempts,
        resetAt: new Date(Date.now() + retryAfter * 1000),
      };
    }

    await Model.create({
      key,
      attempts: 1,
      createdAt: new Date(),
    });

    return {
      allowed: true,
      remaining: maxAttempts - count - 1,
      retryAfter: 0,
      total: maxAttempts,
    };
  } catch (err) {
    console.error("Rate limit check failed:", err.message);
    return { allowed: true, remaining: 0, retryAfter: 0 };
  }
}

export function rateLimitResponse(retryAfter, message) {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: message || "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": "See route documentation",
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

export function withRateLimit(handler, route, options = {}) {
  return async function (request, context) {
    const userId = options.extractUserId
      ? options.extractUserId(request)
      : undefined;

    const result = await checkRateLimit(request, route, { ...options, userId });

    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter);
    }

    const response = await handler(request, context);
    return response;
  };
}
