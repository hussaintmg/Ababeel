/**
 * Chunked upload endpoint for the scroll-animation sources.
 *
 * Three actions on one route, chosen by the `action` field:
 *
 *   begin   { filename, size }        → { id, chunkSize, chunks }
 *   chunk   { id, index, chunk }      → { received, total, complete }
 *   file    { id, index, file }       → { files, received }
 *   abort   { id }                    → {}
 *
 * `chunk` streams one big file in parts; `file` collects many small ones, which
 * is what a multi-frame selection is.
 *
 * The finished file is handed to the ingestion by POSTing to the main
 * scroll-animations route with `uploadId`, so nothing about how a sequence is
 * built changes — only how the bytes arrive.
 */
import { requireOwner } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { beginUpload, appendChunk, addFile, discardUpload, sweepStaleUploads, CHUNK_SIZE } from "@/lib/cms/uploadSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    // Generous: one part per request means a large file is many requests.
    const rl = await checkRateLimit(request, "scrollAnimationUpload", {
      userId: user._id.toString(),
      windowMs: 60 * 60 * 1000,
      maxAttempts: 2000,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const form = await request.formData();
    const action = String(form.get("action") || "").toLowerCase();
    const userId = user._id.toString();

    if (action === "begin") {
      // Cheap here, and it means an abandoned upload is not kept for ever.
      await sweepStaleUploads();
      const started = await beginUpload({
        filename: String(form.get("filename") || ""),
        size: form.get("size"),
        userId,
      });
      return successResponse({ data: started }, 201);
    }

    if (action === "chunk") {
      const id = String(form.get("id") || "");
      const index = parseInt(form.get("index"), 10);
      const part = form.get("chunk");
      if (!part || typeof part === "string") return badRequestResponse("No chunk was uploaded");
      if (!Number.isInteger(index) || index < 0) return badRequestResponse("A chunk index is required");
      if (part.size > CHUNK_SIZE * 2) return badRequestResponse("Chunk is too large");

      const state = await appendChunk({
        id,
        index,
        buffer: Buffer.from(await part.arrayBuffer()),
        userId,
      });
      return successResponse({ data: state });
    }

    if (action === "file") {
      const id = String(form.get("id") || "");
      const index = parseInt(form.get("index"), 10);
      const part = form.get("file");
      if (!part || typeof part === "string") return badRequestResponse("No file was uploaded");
      if (part.size > CHUNK_SIZE * 2) {
        return badRequestResponse(`Each frame must be under ${Math.round((CHUNK_SIZE * 2) / 1024 / 1024)} MB`);
      }
      const state = await addFile({
        id,
        index: Number.isInteger(index) ? index : 0,
        filename: part.name,
        buffer: Buffer.from(await part.arrayBuffer()),
        userId,
      });
      return successResponse({ data: state });
    }

    if (action === "abort") {
      await discardUpload(String(form.get("id") || ""));
      return successResponse({ data: {} });
    }

    return badRequestResponse("action must be one of: begin, chunk, file, abort");
  } catch (error) {
    console.error("Scroll animation upload error:", error?.message);
    return safeErrorResponse(error, error.status || 500);
  }
}
