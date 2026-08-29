import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { prepareScrollVideo, moovPosition, needsFaststart } from "@/lib/cms/videoPrepare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOADS = path.resolve(process.cwd(), "public", "uploads");

/**
 * Repair a video that is already on the server so a browser can seek it.
 *
 * Uploads have been prepared on arrival for a while now, but the videos put
 * there before that are still as their encoder wrote them — index at the end of
 * the file, which is the reason a scroll section shows one frame and never
 * moves. There is a script for it, but a script means SSH, and the person who
 * needs this is looking at the section in the CMS.
 *
 * So: same repair, one button. Owner-only, and it only ever touches a file
 * inside public/uploads that the block already points at. The original is kept
 * alongside as <name>.original, so nothing is lost if the result is wrong.
 */
export async function POST(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "fileUpload", { userId: user._id.toString() });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const { url } = await request.json().catch(() => ({}));
    const clean = String(url || "").split("?")[0].split("#")[0];
    if (!clean.startsWith("/uploads/")) {
      return badRequestResponse("Only a video uploaded to this site can be repaired here.");
    }

    const abs = path.resolve(UPLOADS, `.${clean.replace("/uploads", "")}`);
    if (!abs.startsWith(`${UPLOADS}${path.sep}`)) {
      return badRequestResponse("That path is outside the uploads folder.");
    }
    if (!/\.(mp4|mov|m4v|webm|ogv)$/i.test(abs)) {
      return badRequestResponse("That file is not a video.");
    }

    let buffer;
    try {
      buffer = fs.readFileSync(abs);
    } catch {
      return badRequestResponse("That video is not on this server any more. Re-upload it.");
    }

    const before = moovPosition(buffer);
    if (before !== null && !needsFaststart(buffer)) {
      return successResponse({
        changed: false,
        note: "This video is already seekable — its index is at the front of the file. If the section still does not follow the scroll, the problem is elsewhere; build a frame sequence from it instead.",
      });
    }

    const out = await prepareScrollVideo(buffer, path.basename(abs));
    if (!out.changed) {
      return successResponse({ changed: false, note: out.note || "Nothing could be changed about this video." });
    }

    // Keep the original until the owner is satisfied, then write the new one.
    fs.writeFileSync(`${abs}.original`, buffer);
    fs.writeFileSync(abs, out.buffer);
    const after = moovPosition(out.buffer);

    return successResponse({
      changed: true,
      action: out.action,
      note: out.note,
      indexBefore: before === null ? null : Math.round(before * 100),
      indexAfter: after === null ? null : Math.round(after * 100),
      originalKeptAs: `${clean}.original`,
    });
  } catch (err) {
    console.error("Repair video error:", err);
    return safeErrorResponse(err, 500);
  }
}
