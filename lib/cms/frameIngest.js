/**
 * Frame ingestion: everything the three input routes share.
 *
 *   video / zip / many images
 *            ↓
 *      collect buffers
 *            ↓
 *      numeric sort            ← "frame-10" sorts after "frame-2", not before
 *            ↓
 *      missing-frame detection ← reported, never silently patched over
 *            ↓
 *      normalize to WebP       ← aspect ratio preserved
 *            ↓
 *      storage provider
 *            ↓
 *      ordered public URLs
 *
 * Server-only.
 */
import { getStorageProvider } from "@/lib/cms/storage";

/**
 * sharp is used to re-encode frames to WebP. It is a native module, so it can
 * be absent on a host that skipped optional binaries. That must degrade the
 * output quality, never take the feature down: without it frames are stored as
 * uploaded and the admin UI says so.
 */
let sharpModule;
let sharpChecked = false;

export async function getSharp() {
  if (sharpChecked) return sharpModule;
  sharpChecked = true;
  try {
    sharpModule = (await import("sharp")).default;
  } catch (err) {
    console.warn("[frames] sharp unavailable — frames will be stored unoptimized:", err?.message?.slice(0, 120));
    sharpModule = null;
  }
  return sharpModule;
}

export async function imageOptimizationAvailable() {
  return !!(await getSharp());
}

export const FRAME_EXT = "webp";
export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "bmp", "tif", "tiff"]);

export const MAX_FRAME_COUNT = parseInt(process.env.MAX_FRAME_COUNT, 10) || 5000;
export const MAX_FRAME_SIZE_MB = parseInt(process.env.MAX_FRAME_SIZE_MB, 10) || 20;
export const MAX_VIDEO_SIZE_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 500;

export const RESOLUTION_PRESETS = [
  { value: "original", label: "Original" },
  { value: "1920", label: "1920 px" },
  { value: "1600", label: "1600 px" },
  { value: "1280", label: "1280 px (recommended)" },
  { value: "1080", label: "1080 px" },
  { value: "720", label: "720 px" },
];

export function extensionOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ""));
  return m ? m[1].toLowerCase() : "";
}

export function isImageName(name) {
  const base = String(name || "").split("/").pop() || "";
  // Skip macOS resource forks and hidden files that ZIPs love to carry.
  if (!base || base.startsWith(".") || base.startsWith("__MACOSX")) return false;
  return IMAGE_EXTENSIONS.has(extensionOf(base));
}

/**
 * The frame number inside a filename.
 *
 * Takes the LAST run of digits, so `image_02_frame_0007.png` is frame 7 rather
 * than frame 2, and a directory prefix like `shot2/frame-9.jpg` cannot mislead
 * it. Returns null when a name carries no number at all.
 */
export function frameNumberOf(name) {
  const base = String(name || "").split("/").pop() || "";
  const stem = base.replace(/\.[a-z0-9]+$/i, "");
  const matches = stem.match(/\d+/g);
  if (!matches || !matches.length) return null;
  return parseInt(matches[matches.length - 1], 10);
}

/**
 * Sort entries by their frame number, falling back to a natural comparison for
 * anything unnumbered. Alphabetical sorting is the classic bug here: it puts
 * frame-10 between frame-1 and frame-2.
 */
export function sortFrameEntries(entries) {
  return [...entries].sort((a, b) => {
    const na = frameNumberOf(a.name);
    const nb = frameNumberOf(b.name);
    if (na !== null && nb !== null && na !== nb) return na - nb;
    if (na !== null && nb === null) return -1;
    if (na === null && nb !== null) return 1;
    return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: "base" });
  });
}

/**
 * Gaps in the numbering of an already-sorted list.
 * `frame-001, frame-002, frame-004` → `[3]`.
 */
export function detectMissingFrames(entries) {
  const numbers = entries.map((e) => frameNumberOf(e.name)).filter((n) => n !== null);
  if (numbers.length < 2) return [];
  const min = numbers[0];
  const max = numbers[numbers.length - 1];
  // A huge span from a stray number should not produce a giant gap list.
  if (max - min > numbers.length * 4 + 100) return [];
  const present = new Set(numbers);
  const missing = [];
  for (let i = min; i <= max; i++) {
    if (!present.has(i)) missing.push(i);
    if (missing.length > 200) break;
  }
  return missing;
}

/** Storage key for frame `index` of a sequence. */
export function frameKey(sequenceId, index, ext = FRAME_EXT) {
  return `${sequenceId}/frame-${String(index + 1).padStart(6, "0")}.${ext}`;
}

/**
 * Re-encode one frame to WebP at the requested width, keeping the aspect ratio.
 * `width: "original"` (or 0) keeps the source size.
 */
export async function normalizeFrame(buffer, { width, quality = 72, sourceName = "" } = {}) {
  const sharp = await getSharp();
  if (!sharp) {
    // Pass-through: the sequence still works, the frames are just whatever was
    // uploaded. Dimensions come from the image itself at render time.
    return { buffer, width: 0, height: 0, ext: extensionOf(sourceName) || "jpg", optimized: false };
  }

  let pipeline = sharp(buffer, { failOn: "none" });
  const meta = await pipeline.metadata();

  const target = width === "original" ? 0 : parseInt(width, 10) || 0;
  if (target && meta.width && meta.width > target) {
    // withoutEnlargement is belt-and-braces; the guard above already skips
    // anything already smaller than the target.
    pipeline = pipeline.resize({ width: target, withoutEnlargement: true, fit: "inside" });
  }

  const out = await pipeline.webp({ quality, effort: 4 }).toBuffer({ resolveWithObject: true });
  return { buffer: out.data, width: out.info.width, height: out.info.height, ext: FRAME_EXT, optimized: true };
}

/**
 * Normalize and store an ordered list of `{ name, buffer }` entries.
 *
 * @param onProgress called as (done, total) so a job can report real progress.
 * @returns { frames, width, height, bytes }
 */
export async function storeFrames(sequenceId, entries, { width, quality = 72, onProgress } = {}) {
  const storage = getStorageProvider();
  const frames = [];
  let bytes = 0;
  let dims = { width: 0, height: 0 };

  let optimized = true;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const normalized = await normalizeFrame(entry.buffer, { width, quality, sourceName: entry.name });
    if (i === 0) dims = { width: normalized.width, height: normalized.height };
    if (!normalized.optimized) optimized = false;
    const url = await storage.put(normalized.buffer, frameKey(sequenceId, i, normalized.ext));
    frames.push(url);
    bytes += normalized.buffer.length;
    onProgress?.(i + 1, entries.length);
  }

  return { frames, ...dims, bytes, optimized };
}

/**
 * Prepare a raw upload list: keep images, order them, and report gaps.
 * Used by both the ZIP importer and the multi-file uploader so the two behave
 * identically.
 */
export function prepareEntries(rawEntries) {
  const images = rawEntries.filter((e) => isImageName(e.name));
  const skipped = rawEntries.length - images.length;
  const sorted = sortFrameEntries(images);
  return { entries: sorted, skipped, missing: detectMissingFrames(sorted) };
}
