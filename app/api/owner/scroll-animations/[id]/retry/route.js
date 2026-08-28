import connectDB from "@/utils/db";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, notFoundResponse, badRequestResponse } from "@/lib/errors";
import { serializeSummary } from "@/lib/cms/frameJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reset a failed job so the source can be sent again.
 *
 * The original upload is not retained (videos and archives are large and
 * transient), so a retry clears the error and asks the admin to re-supply the
 * file rather than pretending it can replay from nothing.
 */
export async function POST(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;

    await connectDB();
    const doc = await CmsFrameSequence.findById(id).catch(() => null);
    if (!doc) return notFoundResponse("Unknown scroll animation");
    if (doc.status === "PROCESSING") return badRequestResponse("This animation is still processing");

    doc.status = "FAILED";
    doc.error = "";
    doc.stage = "Awaiting a new upload";
    doc.progress = 0;
    await doc.save();

    return successResponse({
      data: serializeSummary(doc.toObject()),
      message: "Ready to retry — upload the source again using the same settings.",
      settings: doc.settings || {},
    });
  } catch (error) {
    console.error("Scroll animation retry error:", error);
    return safeErrorResponse(error, 500);
  }
}
