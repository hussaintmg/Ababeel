/**
 * Making an uploaded video usable for scroll scrubbing.
 *
 * A scroll-driven section does not play a video, it *seeks* it — thirty or
 * sixty times a second, to a new position each time. That asks far more of a
 * file than playback does, and an ordinary export fails at it in three
 * separate ways. All three look identical to the visitor: the section shows one
 * frame, or nothing, and never changes however far they scroll.
 *
 *  1. The index is at the end of the file. An MP4 keeps its `moov` atom — the
 *     table of where every frame is — wherever the encoder put it, and almost
 *     every encoder puts it last, after all the video data. Until the browser
 *     has that table it does not know the duration and cannot seek at all, so
 *     `video.duration` stays NaN and the scroll drives nothing. `+faststart`
 *     moves it to the front. It is a remux, not a re-encode: no quality is
 *     lost and it takes about a second.
 *
 *  2. The codec is one the browser cannot decode. The uploader accepts
 *     QuickTime, which is what a phone or a Mac produces, and a .mov is
 *     frequently HEVC — which Chrome and Firefox will not play. The element
 *     fires an error, and the section silently falls back to its background
 *     colour.
 *
 *  3. Keyframes are far apart. To show one frame the decoder must start at the
 *     keyframe before it and decode forward, so with a keyframe every four
 *     seconds a scrub lands up to a hundred frames of work away from where it
 *     started. The picture lags the scroll badly, or stalls.
 *
 * So an uploaded video is remuxed or re-encoded once, here, at upload time,
 * rather than every visitor paying for it. ffmpeg comes from the bundled
 * `ffmpeg-static`; where there is none, the file is stored unchanged and the
 * report says why, so the editor can tell the author rather than leaving them
 * with a section that does nothing.
 *
 * Server-only.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const run = promisify(execFile);

/**
 * Duration and dimensions out of an ffmpeg report.
 *
 * Deliberately a local copy rather than an import from frameSources: that
 * module reaches for the storage layer and the ingest pipeline through the "@/"
 * alias, which only the bundler understands. Keeping this file free of the
 * alias is what lets `scripts/fix-scroll-videos.mjs` import it under plain node
 * to repair the videos already sitting on a server.
 */
function reportMeta(text) {
  const out = { duration: 0, width: 0, height: 0 };
  const d = /Duration:\s*(\d+):(\d\d):(\d\d(?:\.\d+)?)/.exec(text || "");
  if (d) out.duration = Number(d[1]) * 3600 + Number(d[2]) * 60 + parseFloat(d[3]);
  const v = /Stream #\d+:\d+[^\n]*?:\s*Video:[^\n]*?(\d{2,5})x(\d{2,5})/.exec(text || "");
  if (v) {
    out.width = Number(v[1]);
    out.height = Number(v[2]);
  }
  return out;
}

/** Codecs every current browser can decode. */
const SAFE_VIDEO_CODECS = ["h264", "vp8", "vp9", "av1"];

/**
 * Longest gap between keyframes we consider comfortable to scrub, in seconds.
 * At 12 frames a second this is about a dozen frames of decoding for the worst
 * seek, which is imperceptible; four seconds is not.
 */
const MAX_KEYFRAME_GAP_S = 1;

/** Where ffmpeg is. Mirrors lib/cms/frameSources so both agree. */
async function ffmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const mod = await import("ffmpeg-static");
    const bin = typeof mod.default === "string" ? mod.default : mod.default?.path || "";
    if (bin && fs.existsSync(bin)) return bin;
  } catch {
    /* not installed */
  }
  return "ffmpeg";
}

/**
 * Where the MP4 index sits, as a fraction of the file.
 *
 * Pure, and deliberately byte-level rather than a shell out: it is the one
 * property that decides whether a browser can seek the file at all, and it is
 * cheap enough to check on every upload. Returns null for a container that has
 * no `moov` atom (WebM, say), where the question does not arise.
 */
export function moovPosition(buffer) {
  const at = buffer.indexOf("moov", 0, "latin1");
  if (at < 0) return null;
  return at / buffer.length;
}

/** An MP4 whose index is not near the front cannot be seeked until it is. */
export function needsFaststart(buffer) {
  const pos = moovPosition(buffer);
  // Anything past the first tenth means the browser waits on the tail of the
  // file before it can seek — for a large upload, that is the whole download.
  return pos !== null && pos > 0.1;
}

/** Codec name out of an ffmpeg report, lowercased ("h264", "hevc", "vp9"…). */
export function videoCodec(text) {
  const m = /Stream #\d+:\d+[^\n]*?:\s*Video:\s*([a-z0-9_]+)/i.exec(String(text || ""));
  return m ? m[1].toLowerCase() : "";
}

/**
 * Decide what has to happen to this file, from what we know about it.
 *
 * Separated from the work so the rule is testable without ffmpeg, a video, or
 * a filesystem — which is the only way this stays honest as the cases grow.
 */
export function planConversion({ codec, faststartNeeded, keyframeGap, container }) {
  const safeCodec = SAFE_VIDEO_CODECS.includes(String(codec || "").toLowerCase());
  const sparseKeyframes = Number.isFinite(keyframeGap) && keyframeGap > MAX_KEYFRAME_GAP_S;

  if (!codec) {
    // Nothing could be read about it. Leave it alone rather than re-encoding
    // something we do not understand, and say so.
    return { action: "keep", reason: "unreadable", note: "The video could not be inspected." };
  }
  if (!safeCodec) {
    return {
      action: "encode",
      reason: "codec",
      note: `The video is ${codec.toUpperCase()}, which browsers do not reliably play. It was converted to H.264.`,
    };
  }
  if (sparseKeyframes) {
    return {
      action: "encode",
      reason: "keyframes",
      note: `Keyframes were ${keyframeGap.toFixed(1)}s apart, too far for smooth scrubbing. The video was re-encoded with frequent keyframes.`,
    };
  }
  if (faststartNeeded || container === "mov") {
    return {
      action: "remux",
      reason: faststartNeeded ? "faststart" : "container",
      note: faststartNeeded
        ? "The video's index was at the end of the file, so a browser could not seek it. It was moved to the front."
        : "The file was repackaged as MP4 so browsers can play it.",
    };
  }
  return { action: "keep", reason: "ok", note: "" };
}

/** Longest gap between keyframes, in seconds. Needs ffprobe; null without it. */
async function keyframeGap(absPath) {
  try {
    const probe = process.env.FFPROBE_PATH || "ffprobe";
    const { stdout } = await run(
      probe,
      ["-v", "error", "-select_streams", "v:0", "-skip_frame", "nokey",
       "-show_entries", "frame=pts_time", "-of", "csv=p=0", "-read_intervals", "%+30", absPath],
      { timeout: 60000, maxBuffer: 8 * 1024 * 1024 }
    );
    const times = String(stdout).split("\n").map((s) => parseFloat(s)).filter(Number.isFinite);
    if (times.length < 2) return null;
    let worst = 0;
    for (let i = 1; i < times.length; i++) worst = Math.max(worst, times[i] - times[i - 1]);
    return worst;
  } catch {
    // No ffprobe on this host — the other two checks still apply.
    return null;
  }
}

/**
 * Prepare an uploaded video for scroll scrubbing.
 *
 * Always returns something usable: on any failure the original bytes come back
 * untouched, with a report explaining what could not be done. An upload must
 * never fail because the optimisation did.
 *
 * @returns { buffer, ext, changed, action, note, available }
 */
export async function prepareScrollVideo(buffer, originalName = "") {
  const container = path.extname(originalName).replace(".", "").toLowerCase();
  const unchanged = (extra) => ({ buffer, ext: container || "mp4", changed: false, ...extra });

  const bin = await ffmpegPath();
  const dir = path.join(os.tmpdir(), `cms-video-${crypto.randomBytes(6).toString("hex")}`);
  const input = path.join(dir, `in.${container || "mp4"}`);
  const output = path.join(dir, "out.mp4");

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(input, buffer);

    // Read the file. ffmpeg with no output reports the input and exits 1,
    // which is expected, not a failure.
    let report = "";
    try {
      const res = await run(bin, ["-hide_banner", "-i", input], { timeout: 60000 });
      report = `${res.stderr || ""}${res.stdout || ""}`;
    } catch (err) {
      report = `${err?.stderr || ""}${err?.stdout || ""}`;
      if (!report) {
        // ffmpeg is not runnable at all.
        return unchanged({
          action: "keep",
          available: false,
          note: "ffmpeg is not available on this server, so the video was stored exactly as uploaded. If it does not follow the scroll, build a frame sequence from it instead.",
        });
      }
    }

    const codec = videoCodec(report);
    const meta = reportMeta(report);
    const gap = await keyframeGap(input);
    const plan = planConversion({
      codec,
      faststartNeeded: needsFaststart(buffer),
      keyframeGap: gap,
      container,
    });

    if (plan.action === "keep") {
      return unchanged({ action: "keep", available: true, note: plan.note });
    }

    const args =
      plan.action === "remux"
        ? ["-y", "-i", input, "-c", "copy", "-movflags", "+faststart", output]
        : [
            "-y", "-i", input,
            "-c:v", "libx264",
            "-profile:v", "main",
            "-pix_fmt", "yuv420p",
            // A keyframe roughly every third of a second, so any seek is a few
            // frames of decoding rather than a hundred.
            "-g", "10",
            "-keyint_min", "10",
            "-sc_threshold", "0",
            "-preset", "veryfast",
            "-crf", "23",
            // Scroll sections are silent by definition, and the audio track is
            // pure download cost.
            "-an",
            "-movflags", "+faststart",
            output,
          ];

    // A long re-encode must not hold a request open indefinitely; on timeout
    // the original is kept and the author is told.
    await run(bin, args, { timeout: plan.action === "remux" ? 120000 : 600000, maxBuffer: 16 * 1024 * 1024 });

    const out = fs.readFileSync(output);
    if (!out.length) return unchanged({ action: "keep", available: true, note: "" });

    return {
      buffer: out,
      ext: "mp4",
      changed: true,
      action: plan.action,
      available: true,
      note: plan.note,
      meta,
    };
  } catch (err) {
    return unchanged({
      action: "keep",
      available: true,
      note: `The video could not be prepared for scrolling (${err?.message || "unknown error"}), so it was stored as uploaded. If it does not follow the scroll, build a frame sequence from it instead.`,
    });
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}
