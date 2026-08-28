/**
 * The three ways a frame sequence gets made.
 *
 *   ingestVideo   mp4 / mov / webm  →  ffmpeg  →  frames
 *   ingestZip     a .zip of images  →  unpack  →  frames
 *   ingestFrames  many image files  →           →  frames
 *
 * All three end in the same normalize-and-store pipeline, so the sequence they
 * produce is indistinguishable downstream. Only `ingestVideo` needs ffmpeg;
 * when it is missing the other two still work, which is the whole point.
 *
 * Server-only.
 */
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import JSZip from "jszip";
import {
  prepareEntries, storeFrames, frameKey, imageOptimizationAvailable,
  MAX_FRAME_COUNT, MAX_VIDEO_SIZE_MB, isImageName,
} from "@/lib/cms/frameIngest";
import { storageCapabilities, getStorageProvider } from "@/lib/cms/storage";

const run = promisify(execFile);

/**
 * Where ffmpeg is.
 *
 * Most shared hosting has no system ffmpeg and no way to install one, which
 * left video extraction simply unavailable there. `ffmpeg-static` ships a
 * prebuilt binary as an ordinary npm package, so `npm ci` puts one on the
 * server. Order: an explicit FFMPEG_PATH wins, then that package, then
 * whatever is on PATH.
 *
 * It is an optional dependency — if the download is blocked the install still
 * succeeds and this falls through to the system binary, which is exactly the
 * behaviour that was there before.
 */
let binaries = null;
async function resolveBinaries() {
  if (binaries) return binaries;

  if (process.env.FFMPEG_PATH) {
    binaries = {
      ffmpeg: process.env.FFMPEG_PATH,
      ffprobe: process.env.FFPROBE_PATH || process.env.FFMPEG_PATH.replace(/ffmpeg$/, "ffprobe"),
      from: "FFMPEG_PATH",
    };
    return binaries;
  }

  try {
    const mod = await import("ffmpeg-static");
    const bin = typeof mod.default === "string" ? mod.default : mod.default?.path || "";
    if (bin && fs.existsSync(bin)) {
      // ffmpeg-static is ffmpeg only; ffprobe comes from the system when it is
      // there, and every probe already falls back gracefully without it.
      binaries = { ffmpeg: bin, ffprobe: process.env.FFPROBE_PATH || "ffprobe", from: "ffmpeg-static" };
      return binaries;
    }
  } catch {
    /* not installed — the system binary is the fallback */
  }

  binaries = {
    ffmpeg: "ffmpeg",
    ffprobe: process.env.FFPROBE_PATH || "ffprobe",
    from: "PATH",
  };
  return binaries;
}

/* ------------------------------------------------------------------ *
 * capabilities
 * ------------------------------------------------------------------ */

let ffmpegProbe = null;

/** Is ffmpeg usable here? Memoised — it cannot change while the process runs. */
export async function checkFfmpeg() {
  if (ffmpegProbe) return ffmpegProbe;
  const { ffmpeg, from } = await resolveBinaries();
  try {
    const { stdout } = await run(ffmpeg, ["-version"], { timeout: 15000 });
    ffmpegProbe = {
      available: true,
      version: `${stdout.split("\n")[0].slice(0, 80)} (${from})`,
      reason: "",
    };
  } catch (err) {
    ffmpegProbe = {
      available: false,
      version: "",
      reason:
        `ffmpeg could not be run (${err?.code || err?.message || "unknown"}). ` +
        "Run `npm install ffmpeg-static` on the server, or set FFMPEG_PATH. " +
        "ZIP and multi-frame upload work without it.",
    };
  }
  return ffmpegProbe;
}

/**
 * What this deployment can actually do — surfaced in the admin UI so nobody
 * discovers a missing binary halfway through a 400 MB upload.
 */
export async function mediaCapabilities() {
  const ffmpeg = await checkFfmpeg();
  const storage = storageCapabilities();
  const optimize = await imageOptimizationAvailable();
  return {
    imageOptimizationAvailable: optimize,
    imageOptimizationReason: optimize ? "" : "sharp is unavailable — uploaded frames are stored as-is instead of being converted to WebP",
    ffmpegAvailable: ffmpeg.available,
    ffmpegVersion: ffmpeg.version,
    ffmpegReason: ffmpeg.reason,
    zipImportAvailable: true,
    frameUploadAvailable: true,
    localStorageAvailable: storage.local.available,
    cloudStorageAvailable: storage.s3.available || storage.cloudinary.available,
    storage,
    limits: {
      maxVideoSizeMb: MAX_VIDEO_SIZE_MB,
      maxFrameCount: MAX_FRAME_COUNT,
    },
  };
}

/* ------------------------------------------------------------------ *
 * video
 * ------------------------------------------------------------------ */

export const FPS_MODES = [
  { value: "original", label: "Original FPS" },
  { value: "30", label: "30 fps" },
  { value: "24", label: "24 fps" },
  { value: "15", label: "15 fps" },
  { value: "custom", label: "Custom fps" },
  { value: "target", label: "Target frame count" },
];

/**
 * Duration, size and frame rate, read out of ffmpeg's own report.
 *
 * ffprobe is a separate binary and `ffmpeg-static` does not ship one, so on a
 * host that has ffmpeg only through that package there is no ffprobe to call.
 * `ffmpeg -i <file>` with no output still prints everything needed to stderr
 * (and exits non-zero, which is why the error is the thing being parsed).
 */
export function parseFfmpegReport(text) {
  const out = { duration: 0, width: 0, height: 0, fps: 0, frames: 0 };
  const d = /Duration:\s*(\d+):(\d\d):(\d\d(?:\.\d+)?)/.exec(text);
  if (d) out.duration = Number(d[1]) * 3600 + Number(d[2]) * 60 + parseFloat(d[3]);
  // The video stream line carries the dimensions and the rate; audio lines do
  // not match because the size pattern is required.
  const v = /Stream #\d+:\d+[^\n]*?:\s*Video:[^\n]*?(\d{2,5})x(\d{2,5})/.exec(text);
  if (v) {
    out.width = Number(v[1]);
    out.height = Number(v[2]);
  }
  const f = /(\d+(?:\.\d+)?)\s*fps/.exec(text);
  if (f) out.fps = parseFloat(f[1]);
  if (out.duration && out.fps) out.frames = Math.round(out.duration * out.fps);
  return out;
}

/** The same numbers via ffmpeg, for hosts with no ffprobe. */
async function probeWithFfmpeg(absPath) {
  const { ffmpeg } = await resolveBinaries();
  let text = "";
  try {
    const res = await run(ffmpeg, ["-hide_banner", "-i", absPath], { timeout: 60000 });
    text = `${res.stderr || ""}${res.stdout || ""}`;
  } catch (err) {
    // Expected: with no output file ffmpeg reports the input and exits 1.
    text = `${err?.stderr || ""}${err?.stdout || ""}`;
  }
  const meta = parseFfmpegReport(text);
  if (!meta.duration || !meta.width) {
    throw Object.assign(new Error("Could not read the video's duration or dimensions"), { status: 400 });
  }
  return meta;
}

export async function probeVideo(absPath) {
  let stdout;
  try {
    ({ stdout } = await run(
      (await resolveBinaries()).ffprobe,
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "format=duration:stream=width,height,r_frame_rate,nb_frames", "-of", "json", absPath],
      { timeout: 60000 }
    ));
  } catch {
    return probeWithFfmpeg(absPath);
  }
  const data = JSON.parse(stdout);
  const stream = data.streams?.[0] || {};
  const [num, den] = String(stream.r_frame_rate || "0/1").split("/").map(Number);
  return {
    duration: parseFloat(data.format?.duration) || 0,
    width: stream.width || 0,
    height: stream.height || 0,
    fps: den ? num / den : 0,
    nbFrames: parseInt(stream.nb_frames, 10) || 0,
  };
}

/**
 * Turn the author's choice into an extraction rate.
 *
 * Nothing is forced to 30 fps: "original" keeps the source rate, "target" backs
 * an fps out of the frame count they asked for, and every mode is capped so a
 * long clip cannot produce an unbounded sequence.
 */
export function resolveExtraction({ fpsMode, customFps, targetFrames }, meta) {
  const duration = meta.duration || 0;
  let fps;

  switch (fpsMode) {
    case "original":
      fps = meta.fps || 30;
      break;
    case "custom":
      fps = Math.max(parseFloat(customFps) || 0, 0.1);
      break;
    case "target": {
      const want = Math.max(parseInt(targetFrames, 10) || 0, 2);
      fps = duration > 0 ? want / duration : 30;
      break;
    }
    default: {
      const preset = parseFloat(fpsMode);
      fps = Number.isFinite(preset) && preset > 0 ? preset : 30;
    }
  }

  let frameCount = Math.max(Math.round(fps * duration), 1);
  if (frameCount > MAX_FRAME_COUNT) {
    frameCount = MAX_FRAME_COUNT;
    fps = duration > 0 ? frameCount / duration : fps;
  }
  return { fps, frameCount };
}

/**
 * Extract frames from a video on disk.
 *
 * ffmpeg writes into a temp directory (never memory), the files are read back
 * one at a time, and the temp directory is removed whatever happens.
 */
export async function ingestVideo({ sequenceId, videoPath, settings = {}, onProgress, onStage }) {
  const ffmpeg = await checkFfmpeg();
  if (!ffmpeg.available) {
    throw Object.assign(new Error(ffmpeg.reason), { status: 422, code: "FFMPEG_UNAVAILABLE" });
  }

  const stat = await fs.promises.stat(videoPath);
  if (stat.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    throw Object.assign(new Error(`Video is larger than ${MAX_VIDEO_SIZE_MB} MB`), { status: 413 });
  }

  onStage?.("Reading video");
  const meta = await probeVideo(videoPath);
  if (!meta.duration || !meta.width) {
    throw Object.assign(new Error("Could not read the video's duration or dimensions"), { status: 400 });
  }

  const { fps, frameCount } = resolveExtraction(settings, meta);
  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "cms-frames-"));

  try {
    onStage?.("Extracting frames");
    // ffmpeg scales and encodes to WebP in one pass, so the video route needs
    // no image library — it works even where sharp is unavailable.
    const targetWidth = settings.width === "original" ? 0 : parseInt(settings.width, 10) || 1280;
    const scale = targetWidth ? `,scale='min(${targetWidth},iw)':-2` : "";
    await run(
      (await resolveBinaries()).ffmpeg,
      [
        "-nostdin", "-y",
        "-i", videoPath,
        "-vf", `fps=${fps.toFixed(6)}${scale}`,
        "-frames:v", String(frameCount),
        // Without an explicit image muxer ffmpeg writes a single animated file
        // instead of a numbered sequence.
        "-f", "image2",
        "-c:v", "libwebp",
        "-quality", String(settings.quality || 72),
        "-compression_level", "4",
        path.join(tmp, "%06d.webp"),
      ],
      { timeout: 20 * 60 * 1000, maxBuffer: 1024 * 1024 * 16 }
    );

    const files = (await fs.promises.readdir(tmp)).filter(isImageName).sort();
    if (!files.length) {
      throw Object.assign(new Error("ffmpeg produced no frames"), { status: 500 });
    }

    onStage?.("Storing frames");
    // One frame in memory at a time: read it, store it, drop it. Holding 500
    // decoded images at once is what kills naive implementations on a long clip.
    const storage = getStorageProvider();
    const frames = [];
    let bytes = 0;
    for (let i = 0; i < files.length; i++) {
      const buffer = await fs.promises.readFile(path.join(tmp, files[i]));
      frames.push(await storage.put(buffer, frameKey(sequenceId, i, "webp")));
      bytes += buffer.length;
      onProgress?.(i + 1, files.length);
    }

    // Frame dimensions come from the scaled output, which ffprobe can read off
    // the first file without decoding the whole sequence.
    let dims = { width: 0, height: 0 };
    try {
      const probe = await probeVideo(path.join(tmp, files[0]));
      dims = { width: probe.width, height: probe.height };
    } catch {
      dims = { width: targetWidth || meta.width, height: 0 };
    }

    return {
      frames,
      ...dims,
      bytes,
      frameCount: frames.length,
      fps,
      duration: meta.duration,
      missing: [],
      skipped: 0,
      optimized: true,
    };
  } finally {
    await fs.promises.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

/* ------------------------------------------------------------------ *
 * zip
 * ------------------------------------------------------------------ */

/**
 * Import a ZIP of frame images.
 *
 * Non-images (readmes, .DS_Store, __MACOSX forks) are ignored rather than
 * failing the import, entries are ordered numerically, and any gap in the
 * numbering is reported back so the author can decide what to do about it.
 */
export async function ingestZip({ sequenceId, zipBuffer, settings = {}, onProgress, onStage }) {
  onStage?.("Reading archive");
  const zip = await JSZip.loadAsync(zipBuffer);

  const names = [];
  zip.forEach((relativePath, file) => {
    if (!file.dir) names.push(relativePath);
  });
  if (!names.length) throw Object.assign(new Error("The archive is empty"), { status: 400 });

  const imageNames = names.filter(isImageName);
  if (!imageNames.length) {
    throw Object.assign(new Error("No images found in the archive"), { status: 400 });
  }
  if (imageNames.length > MAX_FRAME_COUNT) {
    throw Object.assign(new Error(`The archive holds ${imageNames.length} images (limit ${MAX_FRAME_COUNT})`), { status: 413 });
  }

  onStage?.("Extracting images");
  const raw = [];
  for (const name of imageNames) {
    raw.push({ name, buffer: Buffer.from(await zip.file(name).async("uint8array")) });
  }

  const { entries, skipped, missing } = prepareEntries([
    ...raw,
    ...names.filter((n) => !isImageName(n)).map((name) => ({ name, buffer: null })),
  ]);

  onStage?.("Optimizing images");
  const stored = await storeFrames(sequenceId, entries, {
    width: settings.width || "1280",
    quality: settings.quality || 72,
    onProgress,
  });

  return { ...stored, frameCount: stored.frames.length, fps: 0, duration: 0, missing, skipped };
}

/* ------------------------------------------------------------------ *
 * many images
 * ------------------------------------------------------------------ */

/** Import a list of individually uploaded images. */
export async function ingestFrames({ sequenceId, files, settings = {}, onProgress, onStage }) {
  if (!files?.length) throw Object.assign(new Error("No images were uploaded"), { status: 400 });
  if (files.length > MAX_FRAME_COUNT) {
    throw Object.assign(new Error(`${files.length} images exceeds the limit of ${MAX_FRAME_COUNT}`), { status: 413 });
  }

  const { entries, skipped, missing } = prepareEntries(files);
  if (!entries.length) throw Object.assign(new Error("None of the uploaded files are images"), { status: 400 });

  onStage?.("Optimizing images");
  const stored = await storeFrames(sequenceId, entries, {
    width: settings.width || "1280",
    quality: settings.quality || 72,
    onProgress,
  });

  return { ...stored, frameCount: stored.frames.length, fps: 0, duration: 0, missing, skipped };
}

/** Somewhere to park an uploaded video while ffmpeg works on it. */
export async function writeTempUpload(buffer, originalName) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "cms-upload-"));
  const ext = (/\.([a-z0-9]+)$/i.exec(originalName || "")?.[1] || "mp4").toLowerCase();
  const file = path.join(dir, `${crypto.randomBytes(6).toString("hex")}.${ext}`);
  await fs.promises.writeFile(file, buffer);
  return { dir, file };
}
