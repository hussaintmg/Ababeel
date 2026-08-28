import { requireOwner } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse, notFoundResponse } from "@/lib/errors";
import {
  hasFfmpeg, extractFrames, createSequence, writeFrame, finalizeSequence,
  deleteSequence, readManifest, clampFrameCount, clampWidth,
  DEFAULT_FRAMES, DEFAULT_WIDTH, MAX_FRAMES, MIN_FRAMES, MAX_WIDTH,
} from "@/lib/cms/frames";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Frame extraction can take a while on a long clip.
export const maxDuration = 300;

// GET — can this server extract frames itself, and what are the limits?
export async function GET(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const manifest = await readManifest(id);
      if (!manifest) return notFoundResponse("Unknown frame sequence");
      return successResponse({ data: manifest });
    }

    return successResponse({
      data: {
        // When false the builder extracts frames in the browser instead, so
        // the feature works on hosts without ffmpeg.
        ffmpeg: await hasFfmpeg(),
        limits: { minFrames: MIN_FRAMES, maxFrames: MAX_FRAMES, maxWidth: MAX_WIDTH, defaultFrames: DEFAULT_FRAMES, defaultWidth: DEFAULT_WIDTH },
      },
    });
  } catch (error) {
    console.error("CMS frames meta error:", error);
    return safeErrorResponse(error, 500);
  }
}

/**
 * POST — three actions:
 *   { action: "extract", src, count, width }   ffmpeg does the work here
 *   { action: "begin",  width, height, count } start a browser-filled sequence
 *   { action: "finish", id, ... }              write its manifest
 * Browser-extracted frames themselves are PUT one batch at a time (see PUT).
 */
export async function POST(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsFrames", {
      userId: user._id.toString(),
      windowMs: 60 * 60 * 1000,
      maxAttempts: 60,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    if (body?.action === "begin") {
      const seq = await createSequence({
        width: body.width,
        height: body.height,
        count: body.count,
        source: typeof body.src === "string" ? body.src.slice(0, 500) : "",
      });
      return successResponse({ data: seq });
    }

    if (body?.action === "finish") {
      if (!body?.id) return badRequestResponse("A sequence id is required");
      const manifest = await finalizeSequence(String(body.id), {
        width: clampWidth(body.width),
        height: parseInt(body.height, 10) || 0,
        duration: Number(body.duration) || 0,
        source: typeof body.src === "string" ? body.src.slice(0, 500) : "",
      });
      return successResponse({ data: manifest });
    }

    // default: extract with ffmpeg
    if (!body?.src) return badRequestResponse("A video is required");
    if (!(await hasFfmpeg())) {
      return badRequestResponse("ffmpeg is not available on this server — the builder will extract frames in your browser instead.");
    }
    const manifest = await extractFrames(body.src, {
      count: clampFrameCount(body.count),
      width: clampWidth(body.width),
      quality: Math.min(Math.max(parseInt(body.quality, 10) || 72, 40), 95),
    });
    return successResponse({ data: manifest });
  } catch (error) {
    console.error("CMS frame extraction error:", error);
    return safeErrorResponse(error, error.status || 500);
  }
}

// PUT — a batch of browser-extracted frames as multipart form data.
// Fields: id, and one or more `frame_<index>` files.
export async function PUT(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsFrameUpload", {
      userId: user._id.toString(),
      windowMs: 60 * 60 * 1000,
      maxAttempts: 2000,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const form = await request.formData();
    const id = String(form.get("id") || "");
    if (!/^[a-f0-9]{16}$/.test(id)) return badRequestResponse("Invalid sequence id");

    let written = 0;
    for (const [key, value] of form.entries()) {
      const m = /^frame_(\d+)$/.exec(key);
      if (!m || typeof value === "string") continue;
      if (value.size > 2 * 1024 * 1024) return badRequestResponse("A frame is too large");
      if (value.type && value.type !== "image/webp" && !value.type.startsWith("image/")) {
        return badRequestResponse("Frames must be images");
      }
      await writeFrame(id, Number(m[1]), Buffer.from(await value.arrayBuffer()));
      written += 1;
    }
    if (!written) return badRequestResponse("No frames in this batch");
    return successResponse({ data: { written } });
  } catch (error) {
    console.error("CMS frame upload error:", error);
    return safeErrorResponse(error, error.status || 500);
  }
}

export async function DELETE(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequestResponse("A sequence id is required");
    const removed = await deleteSequence(String(id));
    if (!removed) return notFoundResponse("Unknown frame sequence");
    return successResponse({ message: "Frame sequence deleted", id });
  } catch (error) {
    console.error("CMS frame delete error:", error);
    return safeErrorResponse(error, 500);
  }
}
