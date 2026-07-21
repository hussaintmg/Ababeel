import connectDB from "@/utils/db";
import SiteContent from "@/models/SiteContent";
import { requireOwner } from "@/lib/auth";
import { getGlobalSettings } from "@/lib/cms";
import { badRequestResponse, safeErrorResponse, successResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const settings = await getGlobalSettings();
    return successResponse({ auth: settings.auth || {} });
  } catch (error) {
    console.error("Auth pages CMS read error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsSave", {
      userId: user._id.toString(),
      windowMs: 60 * 60 * 1000,
      maxAttempts: 300,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }
    if (!body?.auth || typeof body.auth !== "object" || Array.isArray(body.auth)) {
      return badRequestResponse("Invalid authentication page settings");
    }
    if (JSON.stringify(body.auth).length > 250000) {
      return badRequestResponse("Settings are too large");
    }

    await connectDB();
    await SiteContent.updateOne(
      { key: "global" },
      {
        $set: {
          "settings.auth": body.auth,
          updatedByEmail: user.email || "",
        },
        $setOnInsert: { key: "global", title: "Global Site Settings", enabled: true },
      },
      { upsert: true }
    );

    return successResponse({ auth: body.auth, message: "Authentication pages saved" });
  } catch (error) {
    console.error("Auth pages CMS write error:", error);
    return safeErrorResponse(error, 500);
  }
}
