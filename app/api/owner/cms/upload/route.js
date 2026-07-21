import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { uploadFile } from "@/utils/upload";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";

// Owner-only asset upload for the CMS (logos, favicon, block images).
// Saves into /public/uploads/cms and returns the public URL.
export async function POST(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "fileUpload", { userId: user._id.toString() });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return badRequestResponse("No file provided");
    }
    if (file.size > 50 * 1024 * 1024) {
      return badRequestResponse("File must be 50MB or smaller");
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"];
    if (file.type && !allowed.includes(file.type)) {
      return badRequestResponse("Unsupported file type");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadFile(buffer, "cms", "image", {
      optimize: true,
    });

    return successResponse({ url, publicId });
  } catch (error) {
    console.error("CMS upload error:", error);
    return safeErrorResponse(error, 500);
  }
}
