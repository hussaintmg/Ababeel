import connectDB from "@/utils/db";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, notFoundResponse } from "@/lib/errors";
import { serializeSequence, deleteSequenceRecord } from "@/lib/cms/frameJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — one sequence, including the full ordered frame list.
export async function GET(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;
    await connectDB();
    const doc = await CmsFrameSequence.findById(id).lean().catch(() => null);
    if (!doc) return notFoundResponse("Unknown scroll animation");
    return successResponse({ data: serializeSequence(doc) });
  } catch (error) {
    console.error("Scroll animation read error:", error);
    return safeErrorResponse(error, 500);
  }
}

// PATCH — rename, or save a manually reordered frame list.
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    await connectDB();
    const doc = await CmsFrameSequence.findById(id).catch(() => null);
    if (!doc) return notFoundResponse("Unknown scroll animation");

    if (typeof body.name === "string" && body.name.trim()) {
      doc.name = body.name.trim().slice(0, 160);
    }
    if (Array.isArray(body.frames) && body.frames.length) {
      // A reorder may only permute the URLs this sequence already owns — it can
      // never introduce an arbitrary URL.
      const owned = new Set(doc.frames);
      const next = body.frames.filter((f) => owned.has(f));
      if (next.length !== doc.frames.length) {
        return successResponse({ data: serializeSequence(doc), warning: "Reorder ignored: it did not contain exactly the existing frames" });
      }
      doc.frames = next;
    }
    doc.createdByEmail = doc.createdByEmail || user.email || "";
    await doc.save();
    return successResponse({ data: serializeSequence(doc.toObject()) });
  } catch (error) {
    console.error("Scroll animation update error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;
    const removed = await deleteSequenceRecord(id);
    if (!removed) return notFoundResponse("Unknown scroll animation");
    return successResponse({ message: "Scroll animation deleted", id });
  } catch (error) {
    console.error("Scroll animation delete error:", error);
    return safeErrorResponse(error, 500);
  }
}
