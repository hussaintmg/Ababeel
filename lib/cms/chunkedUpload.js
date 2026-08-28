/**
 * Client half of the chunked upload.
 *
 * Posts a file in pieces small enough that no request-body limit — Next's own,
 * or nginx's `client_max_body_size` on the host — is ever in play, then returns
 * the session id for the create request to name.
 *
 * Browser-side.
 */
import axios from "axios";

const ENDPOINT = "/api/owner/scroll-animations/upload";

async function post(fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) form.append(k, v);
  }
  const res = await axios.post(ENDPOINT, form, { withCredentials: true });
  return res.data?.data || {};
}

/** Abandon a session — best effort, so a failed cleanup never masks the error. */
export async function abortUpload(id) {
  if (!id) return;
  try {
    await post({ action: "abort", id });
  } catch {
    /* the sweep will get it */
  }
}

/**
 * Send one large file in parts.
 *
 * @param file        the File to send
 * @param onProgress  called with 0–100 as parts land
 * @returns the upload session id
 */
export async function uploadInChunks(file, onProgress) {
  const { id, chunkSize } = await post({
    action: "begin",
    filename: file.name,
    size: String(file.size),
  });
  if (!id) throw new Error("Could not start the upload");

  try {
    const size = chunkSize || 2 * 1024 * 1024;
    const total = Math.ceil(file.size / size);
    for (let i = 0; i < total; i++) {
      const part = file.slice(i * size, Math.min((i + 1) * size, file.size));
      await post({ action: "chunk", id, index: String(i), chunk: part });
      onProgress?.(Math.round(((i + 1) / total) * 100));
    }
    return id;
  } catch (err) {
    await abortUpload(id);
    throw err;
  }
}

/**
 * Send many whole files, one request each — a frame selection.
 *
 * The index is sent explicitly so the order the author chose is preserved even
 * though the requests are sequential.
 */
export async function uploadFiles(files, onProgress) {
  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  const { id } = await post({
    action: "begin",
    filename: files[0]?.name || "frames",
    size: String(totalBytes || 1),
  });
  if (!id) throw new Error("Could not start the upload");

  try {
    let sent = 0;
    for (let i = 0; i < files.length; i++) {
      await post({ action: "file", id, index: String(i), file: files[i] });
      sent += files[i].size;
      onProgress?.(Math.round((sent / (totalBytes || 1)) * 100));
    }
    return id;
  } catch (err) {
    await abortUpload(id);
    throw err;
  }
}
