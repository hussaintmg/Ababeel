import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { uploadFile } from "@/utils/upload";
import { prepareScrollVideo } from "@/lib/cms/videoPrepare";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";

// Owner-only asset upload for the CMS (logos, favicon, block images, and the
// videos used by the Scroll Video section).
// Saves into /public/uploads/cms and returns the public URL.
export async function POST(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "fileUpload", { userId: user._id.toString() });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return badRequestResponse("No file provided");
    }
    const isVideo = typeof file.type === "string" && file.type.startsWith("video/");
    // Scroll-video sources are legitimately larger than a logo, but still
    // bounded so an upload cannot fill the disk.
    const maxBytes = (isVideo ? 200 : 50) * 1024 * 1024;
    if (file.size > maxBytes) {
      return badRequestResponse(`File must be ${isVideo ? 200 : 50}MB or smaller`);
    }

    const allowedImages = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"];
    const allowedVideos = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    const allowed = [...allowedImages, ...allowedVideos];
    if (file.type && !allowed.includes(file.type)) {
      return badRequestResponse("Unsupported file type");
    }

    let buffer = Buffer.from(await file.arrayBuffer());

    // A video for the Scroll Video section is seeked, not played, and an
    // ordinary export usually cannot be seeked at all until its index has been
    // moved to the front — which is why an uploaded video would sit on one
    // frame however far the visitor scrolled. Fixing it once, here, costs a
    // second; leaving it costs every visitor. On any failure the original is
    // stored unchanged and `videoNote` says what could not be done.
    let videoNote = "";
    let videoAction = "";
    if (isVideo) {
      const prepared = await prepareScrollVideo(buffer, file.name || "");
      buffer = prepared.buffer;
      videoNote = prepared.note || "";
      videoAction = prepared.action || "";
    }

    const { url, publicId } = await uploadFile(buffer, "cms");

    return successResponse({ url, publicId, videoNote, videoAction });
  } catch (error) {
    console.error("CMS upload error:", error);
    return safeErrorResponse(error, 500);
  }
}
