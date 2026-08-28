/**
 * Filesystem frame storage.
 *
 * Writes under public/uploads/scroll-frames/<sequenceId>/ and returns the URL
 * the existing /uploads/[...path] route already serves. Every key is resolved
 * and checked against the root so a crafted sequence id cannot escape it.
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "public", "uploads", "scroll-frames");
export const URL_BASE = "/uploads/scroll-frames";

function resolveKey(key) {
  const clean = String(key || "").replace(/^\/+/, "");
  if (!clean) throw new Error("Empty storage key");
  const abs = path.resolve(ROOT, clean);
  if (abs !== ROOT && !abs.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error("Storage key escapes the frame directory");
  }
  return abs;
}

export class LocalStorageProvider {
  name = "local";

  async put(buffer, key) {
    const abs = resolveKey(key);
    await fs.promises.mkdir(path.dirname(abs), { recursive: true });
    await fs.promises.writeFile(abs, buffer);
    return `${URL_BASE}/${String(key).replace(/^\/+/, "")}`;
  }

  async delete(key) {
    const abs = resolveKey(key);
    try {
      await fs.promises.unlink(abs);
      return true;
    } catch {
      return false;
    }
  }

  async deletePrefix(prefix) {
    const abs = resolveKey(prefix);
    try {
      const files = await fs.promises.readdir(abs);
      await fs.promises.rm(abs, { recursive: true, force: true });
      return files.length;
    } catch {
      return 0;
    }
  }

  async list(prefix) {
    const abs = resolveKey(prefix);
    try {
      const files = await fs.promises.readdir(abs);
      return files.sort();
    } catch {
      return [];
    }
  }

  /** Bytes currently held under a prefix — shown in the admin UI. */
  async size(prefix) {
    const abs = resolveKey(prefix);
    let total = 0;
    try {
      for (const f of await fs.promises.readdir(abs)) {
        const st = await fs.promises.stat(path.join(abs, f));
        if (st.isFile()) total += st.size;
      }
    } catch {
      /* nothing stored yet */
    }
    return total;
  }
}
