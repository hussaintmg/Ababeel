import connectDB from "@/utils/db";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import { requireOwner } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { mediaCapabilities, FPS_MODES, writeTempUpload } from "@/lib/cms/frameSources";
import { RESOLUTION_PRESETS, MAX_VIDEO_SIZE_MB, MAX_FRAME_COUNT } from "@/lib/cms/frameIngest";
import { createSequence, runIngestion, INGESTERS, serializeSummary } from "@/lib/cms/frameJobs";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Frame extraction is the slow part; give it room on hosts that honour this.
export const maxDuration = 300;

// GET — the sequence list plus what this deployment can actually do.
export async function GET(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    await connectDB();
    const [docs, capabilities] = await Promise.all([
      CmsFrameSequence.find({}).sort({ createdAt: -1 }).limit(100).lean(),
      mediaCapabilities(),
    ]);

    return successResponse({
      data: {
        sequences: docs.map(serializeSummary),
        capabilities,
        options: {
          fpsModes: FPS_MODES,
          resolutions: RESOLUTION_PRESETS,
          maxVideoSizeMb: MAX_VIDEO_SIZE_MB,
          maxFrameCount: MAX_FRAME_COUNT,
        },
      },
    });
  } catch (error) {
    console.error("Scroll animation list error:", error);
    return safeErrorResponse(error, 500);
  }
}

/**
 * POST — create a sequence from one of the three sources.
 *
 * multipart/form-data:
 *   source=video   video=<file>            fpsMode,customFps,targetFrames,width,quality
 *   source=zip     zip=<file>              width,quality
 *   source=frames  frames=<file> (xN)      width,quality
 */
export async function POST(request) {
  let temp = null;
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "scrollAnimationCreate", {
      userId: user._id.toString(),
      windowMs: 60 * 60 * 1000,
      maxAttempts: 60,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const form = await request.formData();
    const source = String(form.get("source") || "").toLowerCase();
    const name = String(form.get("name") || "").trim() || "Untitled animation";

    const settings = {
      width: String(form.get("width") || "1280"),
      quality: Math.min(Math.max(parseInt(form.get("quality"), 10) || 72, 40), 95),
      fpsMode: String(form.get("fpsMode") || "30"),
      customFps: form.get("customFps") || "",
      targetFrames: form.get("targetFrames") || "",
    };

    if (source === "video") {
      const file = form.get("video");
      if (!file || typeof file === "string") return badRequestResponse("No video was uploaded");
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        return badRequestResponse(`Video is larger than ${MAX_VIDEO_SIZE_MB} MB`);
      }
      const caps = await mediaCapabilities();
      if (!caps.ffmpegAvailable) {
        // Explicit, not silent: the UI offers ZIP / frame upload instead.
        return badRequestResponse(caps.ffmpegReason);
      }

      temp = await writeTempUpload(Buffer.from(await file.arrayBuffer()), file.name);
      const doc = await createSequence({ name, sourceType: "VIDEO", settings, email: user.email });
      const outcome = await runIngestion(doc, INGESTERS.VIDEO({ videoPath: temp.file, settings }));
      return finish(doc._id, outcome);
    }

    if (source === "zip") {
      const file = form.get("zip");
      if (!file || typeof file === "string") return badRequestResponse("No archive was uploaded");
      const buffer = Buffer.from(await file.arrayBuffer());
      const doc = await createSequence({ name, sourceType: "ZIP", settings, email: user.email });
      const outcome = await runIngestion(doc, INGESTERS.ZIP({ zipBuffer: buffer, settings }));
      return finish(doc._id, outcome);
    }

    if (source === "frames") {
      const files = form.getAll("frames").filter((f) => typeof f !== "string");
      if (!files.length) return badRequestResponse("No images were uploaded");
      const entries = [];
      for (const f of files) {
        entries.push({ name: f.name, buffer: Buffer.from(await f.arrayBuffer()) });
      }
      const doc = await createSequence({ name, sourceType: "FRAMES", settings, email: user.email });
      const outcome = await runIngestion(doc, INGESTERS.FRAMES({ files: entries, settings }));
      return finish(doc._id, outcome);
    }

    return badRequestResponse("source must be one of: video, zip, frames");
  } catch (error) {
    console.error("Scroll animation create error:", error);
    return safeErrorResponse(error, error.status || 500);
  } finally {
    if (temp?.dir) await fs.promises.rm(temp.dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function finish(id, outcome) {
  await connectDB();
  const doc = await CmsFrameSequence.findById(id).lean();
  if (!outcome.ok) {
    return successResponse({ data: serializeSummary(doc), ok: false, error: doc?.error || "Processing failed" }, 200);
  }
  return successResponse({ data: serializeSummary(doc), ok: true }, 201);
}
