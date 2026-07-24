import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getFaviconInfo } from "@/lib/cms";

// Dynamic favicon. This replaces the old static app/favicon.ico: that file was
// picked up by Next's metadata file convention, which always wins over the
// `icons` entry in generateMetadata, so the CMS-configured icon was silently
// ignored no matter how often the owner changed it.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const DEFAULT_ICON = path.join(PUBLIC_DIR, "favicon-default.ico");

const CONTENT_TYPES = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

// Map a site-relative asset URL onto a file inside /public, refusing anything
// that escapes the directory.
function resolveLocal(src) {
  let clean = src.split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return null;
  try {
    clean = decodeURIComponent(clean);
  } catch {
    return null;
  }
  const filePath = path.resolve(PUBLIC_DIR, `.${clean}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) return null;
  return filePath;
}

export async function GET() {
  let filePath = DEFAULT_ICON;

  try {
    const { src } = await getFaviconInfo();
    if (/^https?:\/\//i.test(src)) {
      return NextResponse.redirect(src, 307);
    }
    const local = src ? resolveLocal(src) : null;
    if (local && fs.existsSync(local) && CONTENT_TYPES[path.extname(local).toLowerCase()]) {
      filePath = local;
    }
  } catch {
    // DB unreachable — still serve a tab icon rather than a 500.
  }

  let file;
  let stat;
  try {
    [file, stat] = await Promise.all([
      fs.promises.readFile(filePath),
      fs.promises.stat(filePath),
    ]);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "image/x-icon",
      "Content-Length": String(stat.size),
      // Revalidate on every load: the URL is constant, so a long-lived cache
      // entry here is exactly what kept the old icon on screen. The ?v= stamp
      // in the <link> tag is what actually breaks the cache on a change.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Last-Modified": stat.mtime.toUTCString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
