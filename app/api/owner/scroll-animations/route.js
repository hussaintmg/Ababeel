import connectDB from "@/utils/db";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import { requireOwner } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { mediaCapabilities, FPS_MODES, writeTempUpload } from "@/lib/cms/frameSources";
import { RESOLUTION_PRESETS, MAX_VIDEO_SIZE_MB, MAX_FRAME_COUNT } from "@/lib/cms/frameIngest";
import { createSequence, runIngestion, INGESTERS, serializeSummary } from "@/lib/cms/frameJobs";
import { finishUpload, collectFiles, discardUpload } from "@/lib/cms/uploadSession";
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
 *
 * Anything past a few megabytes arrives through the chunked upload route
 * instead and is named here by `uploadId`, because the request body is capped
 * well below the size of a real frame archive — see lib/cms/uploadSession.
 */
export async function POST(request) {
  let temp = null;
  let uploaded = null;
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

    // A file sent whole (small) or assembled from chunks (anything real).
    const uploadId = String(form.get("uploadId") || "");
    let assembled = null;
    if (uploadId) {
      uploaded = uploadId;
      // A frame selection is many whole files; a video or archive is one file
      // sent in parts. Only the latter has something to assemble.
      if (source !== "frames") {
        assembled = await finishUpload({ id: uploadId, userId: user._id.toString() });
      }
    }

    if (source === "video") {
      const file = form.get("video");
      if (!assembled && (!file || typeof file === "string")) {
        return badRequestResponse("No video was uploaded");
      }
      const size = assembled ? assembled.size : file.size;
      if (size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        return badRequestResponse(`Video is larger than ${MAX_VIDEO_SIZE_MB} MB`);
      }
      const caps = await mediaCapabilities();
      if (!caps.ffmpegAvailable) {
        // Explicit, not silent: the UI offers ZIP / frame upload instead.
        return badRequestResponse(caps.ffmpegReason);
      }

      if (!assembled) temp = await writeTempUpload(Buffer.from(await file.arrayBuffer()), file.name);
      const videoPath = assembled ? assembled.file : temp.file;
      const doc = await createSequence({ name, sourceType: "VIDEO", settings, email: user.email });
      const outcome = await runIngestion(doc, INGESTERS.VIDEO({ videoPath, settings }));
      return finish(doc._id, outcome);
    }

    if (source === "zip") {
      const file = form.get("zip");
      if (!assembled && (!file || typeof file === "string")) {
        return badRequestResponse("No archive was uploaded");
      }
      const buffer = assembled
        ? await fs.promises.readFile(assembled.file)
        : Buffer.from(await file.arrayBuffer());
      const doc = await createSequence({ name, sourceType: "ZIP", settings, email: user.email });
      const outcome = await runIngestion(doc, INGESTERS.ZIP({ zipBuffer: buffer, settings }));
      return finish(doc._id, outcome);
    }

    if (source === "frames") {
      let entries;
      if (uploadId) {
        // Sent one at a time through the upload route, because a whole frame
        // selection is far past any request body limit.
        entries = await collectFiles({ id: uploadId, userId: user._id.toString() });
      } else {
        const files = form.getAll("frames").filter((f) => typeof f !== "string");
        if (!files.length) return badRequestResponse("No images were uploaded");
        entries = [];
        for (const f of files) {
          entries.push({ name: f.name, buffer: Buffer.from(await f.arrayBuffer()) });
        }
      }
      if (!entries.length) return badRequestResponse("No images were uploaded");
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
    // The assembled file has been read by now, however the run ended.
    if (uploaded) await discardUpload(uploaded);
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
