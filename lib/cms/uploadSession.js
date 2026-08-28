/**
 * Large uploads, one small piece at a time.
 *
 * A 22 MB archive of frames never reached the handler: Next stops reading the
 * request body at `serverActions.bodySizeLimit`, so `request.formData()` got a
 * truncated stream and threw "Failed to parse body as FormData" — a 500 with
 * nothing in it to explain the size. Raising that number only moves the wall,
 * and the wall behind it is nginx's `client_max_body_size`, which on shared
 * hosting is commonly 1–10 MB and not the owner's to change.
 *
 * So the browser slices the file and posts parts small enough that no limit
 * anywhere is in play. Each part is appended to one temp file; when the last
 * one lands the caller gets a path and the ingestion runs exactly as before.
 *
 * A session holds either one streamed file (a video or an archive, sent as
 * parts) or a set of whole files (a multi-frame selection, one per request).
 * Both exist for the same reason and are swept the same way.
 *
 * Sessions live in the OS temp directory and are swept on a schedule, so an
 * abandoned upload costs a few megabytes for an hour rather than for ever.
 *
 * Server-only.
 */
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

/** Comfortably under every default body limit worth worrying about. */
export const CHUNK_SIZE = 2 * 1024 * 1024;

/** An upload nobody has touched for this long is abandoned. */
const SESSION_TTL_MS = 60 * 60 * 1000;

/** A ceiling, so a stuck client cannot fill the disk one part at a time. */
export const MAX_UPLOAD_BYTES = 600 * 1024 * 1024;

const ROOT = path.join(os.tmpdir(), "cms-uploads");

function sessionDir(id) {
  // The id is generated here and never trusted from the client, but the join
  // is still guarded: a "../" in an id would otherwise escape the root.
  const safe = String(id || "").replace(/[^a-f0-9]/gi, "");
  if (safe.length !== 32) return null;
  return path.join(ROOT, safe);
}

async function readMeta(dir) {
  try {
    return JSON.parse(await fs.promises.readFile(path.join(dir, "meta.json"), "utf8"));
  } catch {
    return null;
  }
}

async function writeMeta(dir, meta) {
  await fs.promises.writeFile(path.join(dir, "meta.json"), JSON.stringify(meta));
}

/**
 * Start an upload.
 *
 * @param filename  the original name, kept only for its extension
 * @param size      the total the client intends to send
 * @param userId    who started it; only they may add to it
 */
export async function beginUpload({ filename, size, userId }) {
  const total = Number(size) || 0;
  if (total <= 0) throw Object.assign(new Error("A file size is required"), { status: 400 });
  if (total > MAX_UPLOAD_BYTES) {
    throw Object.assign(
      new Error(`That file is larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`),
      { status: 413 }
    );
  }

  await fs.promises.mkdir(ROOT, { recursive: true });
  const id = crypto.randomBytes(16).toString("hex");
  const dir = path.join(ROOT, id);
  await fs.promises.mkdir(dir, { recursive: true });

  const ext = (/\.([a-z0-9]+)$/i.exec(filename || "")?.[1] || "bin").toLowerCase();
  const meta = {
    id,
    ext,
    filename: String(filename || "upload").slice(0, 200),
    total,
    received: 0,
    fileCount: 0,
    names: {},
    userId: String(userId || ""),
    startedAt: Date.now(),
  };
  await writeMeta(dir, meta);
  await fs.promises.writeFile(path.join(dir, `data.${ext}`), Buffer.alloc(0));
  return { id, chunkSize: CHUNK_SIZE, chunks: Math.ceil(total / CHUNK_SIZE) };
}

/**
 * Append one part.
 *
 * Parts must arrive in order — the client sends them one at a time, and an
 * out-of-order part would silently corrupt the file, so it is refused instead.
 */
export async function appendChunk({ id, index, buffer, userId }) {
  const dir = sessionDir(id);
  if (!dir) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  const meta = await readMeta(dir);
  if (!meta) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  if (meta.userId && meta.userId !== String(userId || "")) {
    throw Object.assign(new Error("Unknown upload"), { status: 404 });
  }

  const expected = Math.floor(meta.received / CHUNK_SIZE);
  if (Number(index) !== expected) {
    throw Object.assign(
      new Error(`Upload is out of order — expected part ${expected}, got ${index}`),
      { status: 409 }
    );
  }
  if (meta.received + buffer.length > meta.total) {
    throw Object.assign(new Error("More data than the upload declared"), { status: 400 });
  }

  await fs.promises.appendFile(path.join(dir, `data.${meta.ext}`), buffer);
  meta.received += buffer.length;
  meta.touchedAt = Date.now();
  await writeMeta(dir, meta);

  return { received: meta.received, total: meta.total, complete: meta.received >= meta.total };
}

/**
 * Add one whole file to a session — the multi-frame case, where the pieces are
 * already separate files and each is small enough to post on its own.
 *
 * The stored name is prefixed with its arrival index so the order the author
 * chose survives, and the original name is kept because the frame sorter reads
 * the number out of it.
 */
export async function addFile({ id, index, filename, buffer, userId }) {
  const dir = sessionDir(id);
  if (!dir) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  const meta = await readMeta(dir);
  if (!meta) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  if (meta.userId && meta.userId !== String(userId || "")) {
    throw Object.assign(new Error("Unknown upload"), { status: 404 });
  }

  const files = path.join(dir, "files");
  await fs.promises.mkdir(files, { recursive: true });

  // The name is never used as a path: only its extension survives, and the
  // real name goes in the manifest.
  const n = Number.isInteger(Number(index)) ? Number(index) : (meta.fileCount || 0);
  const stored = `${String(n).padStart(6, "0")}.part`;
  await fs.promises.writeFile(path.join(files, stored), buffer);

  meta.fileCount = (meta.fileCount || 0) + 1;
  meta.received = (meta.received || 0) + buffer.length;
  meta.names = meta.names || {};
  meta.names[stored] = String(filename || `frame-${n}`).slice(0, 200);
  meta.touchedAt = Date.now();
  if (meta.received > MAX_UPLOAD_BYTES) {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
    throw Object.assign(new Error("Upload is larger than the limit"), { status: 413 });
  }
  await writeMeta(dir, meta);
  return { files: meta.fileCount, received: meta.received };
}

/** The whole files a session collected, in the order they were added. */
export async function collectFiles({ id, userId }) {
  const dir = sessionDir(id);
  if (!dir) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  const meta = await readMeta(dir);
  if (!meta) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  if (meta.userId && meta.userId !== String(userId || "")) {
    throw Object.assign(new Error("Unknown upload"), { status: 404 });
  }

  const files = path.join(dir, "files");
  let stored;
  try {
    stored = (await fs.promises.readdir(files)).sort();
  } catch {
    throw Object.assign(new Error("No files were uploaded"), { status: 400 });
  }

  const out = [];
  for (const name of stored) {
    out.push({
      name: meta.names?.[name] || name,
      buffer: await fs.promises.readFile(path.join(files, name)),
    });
  }
  return out;
}

/** The finished file, or an explanation of why it is not finished. */
export async function finishUpload({ id, userId }) {
  const dir = sessionDir(id);
  if (!dir) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  const meta = await readMeta(dir);
  if (!meta) throw Object.assign(new Error("Unknown upload"), { status: 404 });
  if (meta.userId && meta.userId !== String(userId || "")) {
    throw Object.assign(new Error("Unknown upload"), { status: 404 });
  }
  if (meta.received < meta.total) {
    throw Object.assign(
      new Error(`Upload is incomplete (${meta.received} of ${meta.total} bytes)`),
      { status: 400 }
    );
  }
  return { dir, file: path.join(dir, `data.${meta.ext}`), filename: meta.filename, size: meta.received };
}

/** Delete one session, whether it finished or not. */
export async function discardUpload(id) {
  const dir = sessionDir(id);
  if (!dir) return;
  await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
}

/**
 * Remove sessions nobody came back for. Called at the start of a new upload,
 * so the sweep costs nothing on an idle server and never needs a cron.
 */
export async function sweepStaleUploads(now = Date.now()) {
  let names;
  try {
    names = await fs.promises.readdir(ROOT);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names) {
    const dir = path.join(ROOT, name);
    const meta = await readMeta(dir);
    const last = meta?.touchedAt || meta?.startedAt || 0;
    if (!meta || now - last > SESSION_TTL_MS) {
      await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
      removed += 1;
    }
  }
  return removed;
}
