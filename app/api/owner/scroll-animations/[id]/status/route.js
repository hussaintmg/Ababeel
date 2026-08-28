import connectDB from "@/utils/db";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, notFoundResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight poll target: status, progress and stage without the frame list.
export async function GET(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;
    await connectDB();
    const doc = await CmsFrameSequence.findById(id)
      .select("status progress stage error frameCount width height bytes missingFrames")
      .lean()
      .catch(() => null);
    if (!doc) return notFoundResponse("Unknown scroll animation");
    return successResponse({
      data: {
        status: doc.status,
        progress: doc.progress || 0,
        stage: doc.stage || "",
        error: doc.error || "",
        frameCount: doc.frameCount || 0,
        width: doc.width || 0,
        height: doc.height || 0,
        bytes: doc.bytes || 0,
        missingFrames: doc.missingFrames || [],
      },
    });
  } catch (error) {
    console.error("Scroll animation status error:", error);
    return safeErrorResponse(error, 500);
  }
}
