import { NextResponse } from "next/server";
import { uploadFile } from "@/utils/upload";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const rl = await checkRateLimit(request, "registrationSubmit");
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return badRequestResponse("No receipt file provided");
    }

    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxBytes) {
      return badRequestResponse("Receipt file must be 25MB or smaller");
    }

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];

    if (file.type && !allowed.includes(file.type)) {
      return badRequestResponse("Please upload a PDF document or an image (PNG, JPG, WEBP)");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadFile(buffer, "receipts");

    return successResponse({
      url,
      publicId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return safeErrorResponse(error, 500);
  }
}
