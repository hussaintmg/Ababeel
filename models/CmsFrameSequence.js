import mongoose from "mongoose";

/**
 * CmsFrameSequence
 * ----------------
 * One scroll animation: an ordered run of frame images plus how it was made.
 *
 * The three ingestion routes — a video run through ffmpeg, a ZIP of frames, or
 * a direct multi-image upload — all converge on this same document, so the
 * renderer only ever sees `frames`, `width`, `height`, `frameCount` and has no
 * idea which route produced them.
 *
 * `status` is a real lifecycle, not decoration: a job that dies leaves FAILED
 * with an error to show and a retry to offer, never a record stuck on
 * PROCESSING.
 */
const cmsFrameSequenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },

    // VIDEO | ZIP | FRAMES
    sourceType: { type: String, enum: ["VIDEO", "ZIP", "FRAMES"], required: true },
    // PROCESSING | READY | FAILED
    status: { type: String, enum: ["PROCESSING", "READY", "FAILED"], default: "PROCESSING", index: true },

    // The original upload, kept so a failed job can be retried without a re-upload.
    sourceUrl: { type: String, default: "" },
    sourceName: { type: String, default: "" },

    // Ordered public URLs, one per frame.
    frames: { type: [String], default: [] },
    frameCount: { type: Number, default: 0 },

    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },

    // Video sources only.
    fps: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },

    // What the author asked for, so a retry reproduces the same settings.
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Frame numbers that were absent from the upload. Surfaced as a warning;
    // the sequence still renders, it just skips.
    missingFrames: { type: [Number], default: [] },

    progress: { type: Number, default: 0 },
    stage: { type: String, default: "" },
    error: { type: String, default: "" },

    createdByEmail: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

cmsFrameSequenceSchema.index({ createdAt: -1 });

export default mongoose.models.CmsFrameSequence ||
  mongoose.model("CmsFrameSequence", cmsFrameSequenceSchema);
