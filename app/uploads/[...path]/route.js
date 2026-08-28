import fs from "fs";
import path from "path";
import { Readable } from "stream";
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
  // Video, for the Scroll Video section.
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
};

const RANGE_TYPES = new Set([".mp4", ".mov", ".webm", ".ogv"]);

// "bytes=1000-" / "bytes=1000-2000" → { start, end }, or null when unusable.
function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
  if (!m) return null;
  const [, rawStart, rawEnd] = m;
  if (rawStart === "" && rawEnd === "") return null;
  let start;
  let end;
  if (rawStart === "") {
    const suffix = parseInt(rawEnd, 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = parseInt(rawStart, 10);
    end = rawEnd === "" ? size - 1 : parseInt(rawEnd, 10);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

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

  // Scroll-driven video seeks constantly, so byte ranges are essential: the
  // browser fetches only the segment it needs instead of the whole file.
  const ext = path.extname(filePath).toLowerCase();
  if (RANGE_TYPES.has(ext)) {
    headers.set("Accept-Ranges", "bytes");
    const range = parseRange(request.headers.get("range"), stat.size);
    if (range) {
      const length = range.end - range.start + 1;
      headers.set("Content-Length", String(length));
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${stat.size}`);
      if (!includeBody || request.method === "HEAD") {
        return new NextResponse(null, { status: 206, headers });
      }
      const stream = fs.createReadStream(filePath, { start: range.start, end: range.end });
      return new NextResponse(Readable.toWeb(stream), { status: 206, headers });
    }
  }

  if (!includeBody || request.method === "HEAD") {
    return new NextResponse(null, { status: 200, headers });
  }

  if (RANGE_TYPES.has(ext)) {
    // Stream large media rather than buffering the whole file in memory.
    return new NextResponse(Readable.toWeb(fs.createReadStream(filePath)), { status: 200, headers });
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
