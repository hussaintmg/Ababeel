import fs from "fs";
import path from "path";
import crypto from "crypto";
import { putS3Object, deleteS3Object, getBucketName } from "../lib/s3.js";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function getExtension(buffer) {
  if (!buffer || buffer.length < 4) return ".bin";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return ".jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return ".png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return ".gif";
  if (buffer[0] === 0x25 && buffer[1] === 0x50) return ".pdf";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return ".webp";
  // ICO: 00 00 01 00
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00)
    return ".ico";
  // ISO-BMFF (MP4 / MOV): "....ftyp" at offset 4.
  if (buffer.slice(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.slice(8, 12).toString("ascii");
    return brand.startsWith("qt") ? ".mov" : ".mp4";
  }
  // WebM / Matroska: EBML magic 1A 45 DF A3.
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return ".webm";
  }
  // OGG: "OggS"
  if (buffer.slice(0, 4).toString("ascii") === "OggS") return ".ogv";
  // SVG: leading whitespace then "<svg" or "<?xml"
  const head = buffer.slice(0, 256).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return ".svg";
  return ".bin";
}

function getMimeType(ext) {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

/**
 * Server-side upload handler (used when server receives buffer).
 * Stores directly to Supabase S3 storage.
 */
export async function uploadFile(buffer, folder, resourceType = "image") {
  try {
    const ext = resourceType === "video" ? ".mp4" : getExtension(buffer);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const cleanFolder = folder ? folder.replace(/^\/+|\/+$/g, "") : "uploads";
    const key = `${cleanFolder}/${uniqueName}`;
    const contentType = getMimeType(ext);

    // Save directly to Supabase Storage
    const { url } = await putS3Object(buffer, key, contentType);

    return {
      url,
      publicId: key,
    };
  } catch (error) {
    console.error("File upload error to Supabase:", error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage and legacy local storage if present.
 */
export async function deleteFile(publicId, resourceType = "image") {
  try {
    if (!publicId) return { success: false, message: "No publicId provided" };

    // Clean publicId if a full URL was passed by mistake
    const key = publicId.startsWith("http") ? extractPublicId(publicId) : publicId;
    if (!key) return { success: false, message: "Could not extract storage key" };

    // 1. Delete from Supabase Storage
    await deleteS3Object(key);

    // 2. Also check and remove from legacy local filesystem if it exists
    const localPath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(localPath)) {
      try {
        await fs.promises.unlink(localPath);
      } catch (e) {
        // Ignore local deletion error
      }
    }

    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("File delete error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Extracts storage key / publicId from a URL.
 */
export function extractPublicId(url) {
  if (!url) return null;
  try {
    const bucket = getBucketName();
    if (url.includes(`/object/public/${bucket}/`)) {
      const parts = url.split(`/object/public/${bucket}/`);
      return parts[1] || null;
    }

    if (url.includes(`/${bucket}/`)) {
      const parts = url.split(`/${bucket}/`);
      return parts[1] || null;
    }

    const urlParts = url.split("/");
    const uploadIdx = urlParts.indexOf("uploads");
    if (uploadIdx !== -1) {
      return urlParts.slice(uploadIdx + 1).join("/");
    }

    return null;
  } catch {
    return null;
  }
}
