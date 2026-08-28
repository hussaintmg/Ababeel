import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getExtension(buffer) {
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

export async function uploadFile(buffer, folder, resourceType = "image") {
  try {
    const folderPath = path.join(UPLOADS_DIR, folder);
    ensureDir(folderPath);

    const ext = resourceType === "video" ? ".mp4" : getExtension(buffer);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(folderPath, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    const publicId = `${folder}/${uniqueName}`;
    const url = `/uploads/${folder}/${uniqueName}`;

    return { url, publicId };
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
}

export async function deleteFile(publicId, resourceType = "image") {
  try {
    if (!publicId) return { success: false, message: "No publicId provided" };

    const filePath = path.join(UPLOADS_DIR, publicId);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return { success: true, message: "File deleted" };
    }

    return { success: false, message: "File not found" };
  } catch (error) {
    console.error("File delete error:", error);
    throw error;
  }
}

export function extractPublicId(url) {
  if (!url) return null;
  try {
    const urlParts = url.split("/");
    const uploadIdx = urlParts.indexOf("uploads");
    if (uploadIdx === -1) return null;
    return urlParts.slice(uploadIdx + 1).join("/");
  } catch {
    return null;
  }
}
