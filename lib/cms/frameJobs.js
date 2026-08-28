/**
 * Frame-sequence jobs: create the record, run the right ingester, keep the
 * status honest.
 *
 * A job is never left on PROCESSING. Every path either reaches READY or writes
 * FAILED with a message the admin can read and a retry they can press.
 *
 * Server-only.
 */
import connectDB from "@/utils/db";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import { ingestVideo, ingestZip, ingestFrames } from "@/lib/cms/frameSources";
import { getStorageProvider } from "@/lib/cms/storage";

export function serializeSequence(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    sourceType: doc.sourceType,
    status: doc.status,
    sourceUrl: doc.sourceUrl || "",
    sourceName: doc.sourceName || "",
    frames: doc.frames || [],
    frameCount: doc.frameCount || 0,
    width: doc.width || 0,
    height: doc.height || 0,
    bytes: doc.bytes || 0,
    fps: doc.fps || 0,
    duration: doc.duration || 0,
    settings: doc.settings || {},
    missingFrames: doc.missingFrames || [],
    progress: doc.progress || 0,
    stage: doc.stage || "",
    error: doc.error || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

/** A lighter shape for list views — the frame array can be thousands of URLs. */
export function serializeSummary(doc) {
  const full = serializeSequence(doc);
  if (!full) return null;
  const { frames, ...rest } = full;
  return { ...rest, poster: frames[0] || "" };
}

export async function createSequence({ name, sourceType, settings, email }) {
  await connectDB();
  return CmsFrameSequence.create({
    name: String(name || "Untitled animation").slice(0, 160),
    sourceType,
    status: "PROCESSING",
    settings: settings || {},
    stage: "Queued",
    createdByEmail: email || "",
  });
}

/**
 * Run an ingester against an existing record and record the outcome.
 * Progress is written at most every 2% so a 5000-frame job does not turn into
 * 5000 database writes.
 */
export async function runIngestion(doc, ingest) {
  await connectDB();
  let lastWritten = -1;

  const onProgress = async (done, total) => {
    const pct = Math.round((done / Math.max(total, 1)) * 100);
    if (pct === lastWritten || pct % 2 !== 0) return;
    lastWritten = pct;
    await CmsFrameSequence.updateOne({ _id: doc._id }, { $set: { progress: pct } }).catch(() => {});
  };
  const onStage = async (stage) => {
    await CmsFrameSequence.updateOne({ _id: doc._id }, { $set: { stage } }).catch(() => {});
  };

  try {
    const result = await ingest({ sequenceId: String(doc._id), onProgress, onStage });
    await CmsFrameSequence.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: "READY",
          frames: result.frames,
          frameCount: result.frameCount,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          fps: result.fps || 0,
          duration: result.duration || 0,
          missingFrames: result.missing || [],
          progress: 100,
          stage: "Ready",
          error: "",
        },
      }
    );
    return { ok: true, result };
  } catch (err) {
    console.error("Frame ingestion failed:", err?.message);
    // Partial output from a failed run is useless and takes space.
    await getStorageProvider().deletePrefix(String(doc._id)).catch(() => {});
    await CmsFrameSequence.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: "FAILED",
          stage: "Failed",
          error: String(err?.message || "Frame processing failed").slice(0, 500),
        },
      }
    );
    return { ok: false, error: err };
  }
}

export const INGESTERS = {
  VIDEO: (opts) => (ctx) => ingestVideo({ ...ctx, ...opts }),
  ZIP: (opts) => (ctx) => ingestZip({ ...ctx, ...opts }),
  FRAMES: (opts) => (ctx) => ingestFrames({ ...ctx, ...opts }),
};

/** Remove a sequence and everything it stored. */
export async function deleteSequenceRecord(id) {
  await connectDB();
  const doc = await CmsFrameSequence.findById(id);
  if (!doc) return false;
  await getStorageProvider().deletePrefix(String(doc._id)).catch(() => {});
  await CmsFrameSequence.deleteOne({ _id: doc._id });
  return true;
}
