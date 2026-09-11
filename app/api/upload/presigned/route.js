import { NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/s3";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, badRequestResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = [
  "profile_images",
  "signatures",
  "candidates/profile",
  "candidates/profiles",
  "receipts",
  "cms",
  "uploads",
];

export async function POST(request) {
  try {
    const rl = await checkRateLimit(request, "presignedUpload", {
      windowMs: 60 * 1000,
      maxAttempts: 120,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON request body");
    }

    const { filename, contentType, folder = "uploads" } = body || {};

    if (!filename || typeof filename !== "string") {
      return badRequestResponse("Filename is required");
    }

    // Sanitize folder
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    const isAllowedFolder = ALLOWED_FOLDERS.some(
      (f) => cleanFolder === f || cleanFolder.startsWith(`${f}/`)
    );

    if (!isAllowedFolder) {
      return badRequestResponse(`Upload folder '${cleanFolder}' is not permitted`);
    }

    const result = await createPresignedUploadUrl({
      folder: cleanFolder,
      filename,
      contentType: contentType || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key,
      bucket: result.bucket,
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return safeErrorResponse(error, 500);
  }
}
