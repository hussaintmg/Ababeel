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
  // SVG: leading whitespace then "<svg" or "<?xml"
  const head = buffer.slice(0, 256).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return ".svg";
  return ".bin";
}

async function optimizeRasterImage(buffer) {
  const ext = getExtension(buffer);
  if (![".jpg", ".png", ".webp"].includes(ext)) return buffer;

  const sharp = (await import("sharp")).default;
  return sharp(buffer)
    .rotate()
    .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

export async function uploadFile(buffer, folder, resourceType = "image", options = {}) {
  try {
    const outputBuffer = options.optimize ? await optimizeRasterImage(buffer) : buffer;
    const folderPath = path.join(UPLOADS_DIR, folder);
    ensureDir(folderPath);

    const ext = resourceType === "video" ? ".mp4" : getExtension(outputBuffer);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(folderPath, uniqueName);

    await fs.promises.writeFile(filePath, outputBuffer);

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
