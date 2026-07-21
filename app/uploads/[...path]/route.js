import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads");

const CONTENT_TYPES = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

function resolveUploadPath(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;

  const filePath = path.resolve(UPLOADS_DIR, ...segments);
  if (!filePath.startsWith(`${UPLOADS_DIR}${path.sep}`)) return null;
  return filePath;
}

async function serveUpload(request, context, includeBody) {
  const { path: segments } = await context.params;
  const filePath = resolveUploadPath(segments);
  if (!filePath) return new NextResponse("Not Found", { status: 404 });

  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (!stat.isFile()) return new NextResponse("Not Found", { status: 404 });

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) return new NextResponse("Unsupported file type", { status: 415 });

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Length": String(stat.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Last-Modified": stat.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
  });

  // Uploaded SVGs are owner-controlled, but sandbox them as an extra defence
  // against scripts when somebody opens the asset URL directly.
  if (path.extname(filePath).toLowerCase() === ".svg") {
    headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }

  if (!includeBody || request.method === "HEAD") {
    return new NextResponse(null, { status: 200, headers });
  }

  const file = await fs.promises.readFile(filePath);
  return new NextResponse(file, { status: 200, headers });
}

export async function GET(request, context) {
  return serveUpload(request, context, true);
}

export async function HEAD(request, context) {
  return serveUpload(request, context, false);
}
