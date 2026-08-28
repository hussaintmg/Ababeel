/**
 * Frame storage abstraction.
 *
 * Everything upstream (video extraction, ZIP import, multi-file upload) hands
 * finished frame buffers to a provider and gets back a public URL. Nothing in
 * the ingestion or rendering path knows or cares where the bytes live.
 *
 *   provider.put(buffer, key)  →  "/uploads/scroll-frames/<id>/frame-000001.webp"
 *
 * The default provider writes to the local filesystem, which is what this
 * application already does for every other upload. S3 and Cloudinary are
 * strictly optional: with `STORAGE_PROVIDER` unset the app runs exactly as it
 * does today, and a missing CLOUDINARY_URL is never an error — it just means
 * that provider is not selectable.
 */
import { LocalStorageProvider } from "@/lib/cms/storage/local";

/** @typedef {{ name: string, put(buffer: Buffer, key: string): Promise<string>, delete(key: string): Promise<boolean>, deletePrefix(prefix: string): Promise<number>, list(prefix: string): Promise<string[]> }} FrameStorageProvider */

let cached = null;

/** Which providers this deployment could use, and why the others cannot. */
export function storageCapabilities() {
  const configured = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  return {
    configured,
    local: { available: true, reason: "" },
    s3: {
      available: !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY),
      reason: process.env.S3_BUCKET ? "" : "S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY not set",
    },
    cloudinary: {
      available: !!process.env.CLOUDINARY_URL,
      reason: process.env.CLOUDINARY_URL ? "" : "CLOUDINARY_URL not set (optional — not required)",
    },
  };
}

/**
 * The active provider.
 *
 * An unknown or unconfigured provider name falls back to local with a warning
 * rather than throwing: a missing optional credential must never take the whole
 * CMS down.
 */
export function getStorageProvider() {
  if (cached) return cached;
  const want = (process.env.STORAGE_PROVIDER || "local").toLowerCase();

  if (want !== "local") {
    const caps = storageCapabilities();
    const entry = caps[want];
    if (!entry) {
      console.warn(`[frames] Unknown STORAGE_PROVIDER "${want}" — using local storage.`);
    } else if (!entry.available) {
      console.warn(`[frames] STORAGE_PROVIDER="${want}" but ${entry.reason} — using local storage.`);
    } else {
      console.warn(`[frames] STORAGE_PROVIDER="${want}" is configured but no adapter is bundled — using local storage.`);
    }
  }

  cached = new LocalStorageProvider();
  return cached;
}

/** Test seam — lets a suite swap in a fake provider. */
export function _setStorageProvider(provider) {
  cached = provider;
}
