/**
 * Scroll-video frame sequences.
 *
 * Seeking an HTML5 video is only as precise as its keyframes: every scrub has
 * to decode, so on a long or lightly-keyframed clip the picture lags behind the
 * scroll. A pre-extracted image sequence removes the decoder from the hot path
 * — each scroll position is just "draw image N" — at the cost of downloading
 * the frames up front.
 *
 * Frames live at  public/uploads/cms/frames/<id>/0001.webp …
 * with a manifest.json beside them for tooling. The block stores the id and
 * count, so a public page needs no extra request to know what to load.
 *
 * Server-only.
 */
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const run = promisify(execFile);

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
export const FRAMES_ROOT = path.join(UPLOADS_DIR, "cms", "frames");
export const FRAMES_URL_BASE = "/uploads/cms/frames";

// Caps that keep a sequence from becoming a multi-megabyte download by accident.
export const MAX_FRAMES = 240;
export const MIN_FRAMES = 12;
export const MAX_WIDTH = 1920;
export const DEFAULT_FRAMES = 120;
export const DEFAULT_WIDTH = 1280;
export const FRAME_EXT = "webp";

export function frameName(index, ext = FRAME_EXT) {
  return `${String(index + 1).padStart(4, "0")}.${ext}`;
}

export function frameUrl(id, index, ext = FRAME_EXT) {
  return `${FRAMES_URL_BASE}/${id}/${frameName(index, ext)}`;
}

/** Is ffmpeg on this machine? Production hosts often do not have it. */
let ffmpegAvailable = null;

/**
 * Is ffmpeg on this machine? Production hosts often are not.
 * Memoised: the answer cannot change while the process is running, and the
 * probe was being re-run on every capability check.
 */
export async function hasFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    await run("ffmpeg", ["-version"], { timeout: 15000 });
    ffmpegAvailable = true;
  } catch (err) {
    console.warn("CMS frames: ffmpeg not usable —", err?.message?.slice(0, 160));
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

/** Resolve a /uploads/... URL to a path inside the uploads directory. */
export function resolveUploadPath(url) {
  const rel = String(url || "").replace(/^\/+/, "");
  if (!rel.startsWith("uploads/")) return null;
  const abs = path.resolve(process.cwd(), "public", rel);
  if (!abs.startsWith(`${UPLOADS_DIR}${path.sep}`)) return null;
  return abs;
}

export function newSequenceId() {
  return crypto.randomBytes(8).toString("hex");
}

function sequenceDir(id) {
  const dir = path.resolve(FRAMES_ROOT, id);
  if (!dir.startsWith(`${FRAMES_ROOT}${path.sep}`)) throw new Error("Invalid sequence id");
  return dir;
}

export function clampFrameCount(n) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return DEFAULT_FRAMES;
  return Math.min(Math.max(v, MIN_FRAMES), MAX_FRAMES);
}

export function clampWidth(n) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return DEFAULT_WIDTH;
  return Math.min(Math.max(v, 320), MAX_WIDTH);
}

/** Duration and dimensions of a video, via ffprobe. */
export async function probeVideo(absPath) {
  const { stdout } = await run(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "format=duration:stream=width,height",
      "-of", "json",
      absPath,
    ],
    { timeout: 30000 }
  );
  const data = JSON.parse(stdout);
  const stream = data.streams?.[0] || {};
  return {
    duration: parseFloat(data.format?.duration) || 0,
    width: stream.width || 0,
    height: stream.height || 0,
  };
}

async function directorySize(dir) {
  const files = await fs.promises.readdir(dir);
  let bytes = 0;
  for (const f of files) {
    const st = await fs.promises.stat(path.join(dir, f));
    if (st.isFile()) bytes += st.size;
  }
  return bytes;
}

/**
 * Extract an evenly spaced image sequence from a video with ffmpeg.
 *
 * `count` frames are spread across the whole clip, so scroll progress maps
 * straight onto a frame index with no rounding surprises.
 */
export async function extractFrames(videoUrl, { count, width, quality = 72 } = {}) {
  const abs = resolveUploadPath(videoUrl);
  if (!abs || !fs.existsSync(abs)) {
    throw Object.assign(new Error("Video file not found"), { status: 400 });
  }

  const frames = clampFrameCount(count);
  const targetWidth = clampWidth(width);
  const meta = await probeVideo(abs);
  if (!meta.duration || !meta.width) {
    throw Object.assign(new Error("Could not read the video"), { status: 400 });
  }

  const id = newSequenceId();
  const dir = sequenceDir(id);
  await fs.promises.mkdir(dir, { recursive: true });

  // fps chosen so ffmpeg emits exactly `frames` images across the clip.
  const fps = frames / meta.duration;
  const height = Math.round((targetWidth * meta.height) / meta.width / 2) * 2;

  await run(
    "ffmpeg",
    [
      "-nostdin", "-y",
      "-i", abs,
      "-vf", `fps=${fps.toFixed(6)},scale=${targetWidth}:-2`,
      "-frames:v", String(frames),
      // Without `-f image2` ffmpeg picks the webp muxer and writes the whole
      // clip into a single animated .webp instead of one file per frame.
      "-f", "image2",
      "-c:v", "libwebp",
      "-quality", String(quality),
      "-compression_level", "4",
      path.join(dir, `%04d.${FRAME_EXT}`),
    ],
    { timeout: 10 * 60 * 1000, maxBuffer: 1024 * 1024 * 8 }
  );

  const written = (await fs.promises.readdir(dir)).filter((f) => f.endsWith(`.${FRAME_EXT}`)).length;
  if (!written) {
    await fs.promises.rm(dir, { recursive: true, force: true });
    throw Object.assign(new Error("ffmpeg produced no frames"), { status: 500 });
  }

  const manifest = {
    id,
    count: written,
    width: targetWidth,
    height,
    ext: FRAME_EXT,
    duration: meta.duration,
    source: videoUrl,
    bytes: await directorySize(dir),
    createdAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

/** Create an empty sequence for the browser-side extractor to fill. */
export async function createSequence({ width, height, count, source = "" }) {
  const id = newSequenceId();
  await fs.promises.mkdir(sequenceDir(id), { recursive: true });
  return {
    id,
    count: clampFrameCount(count),
    width: clampWidth(width),
    height: parseInt(height, 10) || 0,
    ext: FRAME_EXT,
    source,
  };
}

/** Write one browser-extracted frame into a sequence. */
export async function writeFrame(id, index, buffer) {
  const dir = sequenceDir(id);
  if (!fs.existsSync(dir)) throw Object.assign(new Error("Unknown frame sequence"), { status: 404 });
  const i = parseInt(index, 10);
  if (!Number.isFinite(i) || i < 0 || i >= MAX_FRAMES) {
    throw Object.assign(new Error("Frame index out of range"), { status: 400 });
  }
  await fs.promises.writeFile(path.join(dir, frameName(i)), buffer);
}

/** Finish a browser-filled sequence: count what landed and write the manifest. */
export async function finalizeSequence(id, extra = {}) {
  const dir = sequenceDir(id);
  const files = (await fs.promises.readdir(dir)).filter((f) => f.endsWith(`.${FRAME_EXT}`));
  if (!files.length) throw Object.assign(new Error("No frames were uploaded"), { status: 400 });
  const manifest = {
    id,
    count: files.length,
    ext: FRAME_EXT,
    bytes: await directorySize(dir),
    createdAt: new Date().toISOString(),
    ...extra,
  };
  await fs.promises.writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

/** Delete a sequence and everything in it. */
export async function deleteSequence(id) {
  const dir = sequenceDir(id);
  if (!fs.existsSync(dir)) return false;
  await fs.promises.rm(dir, { recursive: true, force: true });
  return true;
}

export async function readManifest(id) {
  try {
    const raw = await fs.promises.readFile(path.join(sequenceDir(id), "manifest.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
