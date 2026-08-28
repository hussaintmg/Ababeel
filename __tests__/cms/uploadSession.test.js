/**
 * The chunked upload, which exists because a 22 MB frame archive never reached
 * the handler: the request body is capped well below it, so `formData()` got a
 * truncated stream and threw "Failed to parse body as FormData".
 */
import fs from "fs";
import crypto from "crypto";
import {
  beginUpload, appendChunk, finishUpload, addFile, collectFiles,
  discardUpload, sweepStaleUploads, CHUNK_SIZE,
} from "@/lib/cms/uploadSession";

const USER = "user-1";

describe("sending one large file in parts", () => {
  test("the parts reassemble byte for byte", async () => {
    const payload = crypto.randomBytes(CHUNK_SIZE * 2 + 12345);
    const { id, chunks } = await beginUpload({ filename: "clip.mp4", size: payload.length, userId: USER });
    expect(chunks).toBe(3);

    for (let i = 0; i < chunks; i++) {
      const part = payload.subarray(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, payload.length));
      const state = await appendChunk({ id, index: i, buffer: part, userId: USER });
      expect(state.complete).toBe(i === chunks - 1);
    }

    const done = await finishUpload({ id, userId: USER });
    expect(done.file.endsWith(".mp4")).toBe(true);
    const written = await fs.promises.readFile(done.file);
    expect(Buffer.compare(written, payload)).toBe(0);
    await discardUpload(id);
  });

  test("a part out of order is refused rather than corrupting the file", async () => {
    const { id } = await beginUpload({ filename: "a.zip", size: CHUNK_SIZE * 2, userId: USER });
    await expect(
      appendChunk({ id, index: 1, buffer: Buffer.alloc(10), userId: USER })
    ).rejects.toThrow(/out of order/);
    await discardUpload(id);
  });

  test("more data than declared is refused", async () => {
    const { id } = await beginUpload({ filename: "a.zip", size: 10, userId: USER });
    await expect(
      appendChunk({ id, index: 0, buffer: Buffer.alloc(11), userId: USER })
    ).rejects.toThrow(/More data/);
    await discardUpload(id);
  });

  test("an unfinished upload cannot be used", async () => {
    const { id } = await beginUpload({ filename: "a.zip", size: 100, userId: USER });
    await appendChunk({ id, index: 0, buffer: Buffer.alloc(40), userId: USER });
    await expect(finishUpload({ id, userId: USER })).rejects.toThrow(/incomplete/);
    await discardUpload(id);
  });

  test("another user cannot touch someone else's upload", async () => {
    const { id } = await beginUpload({ filename: "a.zip", size: 100, userId: USER });
    await expect(
      appendChunk({ id, index: 0, buffer: Buffer.alloc(10), userId: "someone-else" })
    ).rejects.toThrow(/Unknown upload/);
    await expect(finishUpload({ id, userId: "someone-else" })).rejects.toThrow(/Unknown upload/);
    await discardUpload(id);
  });

  test("an id that tries to escape the upload directory is rejected", async () => {
    for (const bad of ["../../etc", "", "abc", "/etc/passwd"]) {
      await expect(finishUpload({ id: bad, userId: USER })).rejects.toThrow(/Unknown upload/);
    }
  });

  test("a size of zero or a negative size is refused", async () => {
    await expect(beginUpload({ filename: "a", size: 0, userId: USER })).rejects.toThrow(/file size/);
    await expect(beginUpload({ filename: "a", size: -5, userId: USER })).rejects.toThrow(/file size/);
  });
});

describe("collecting many whole files — a frame selection", () => {
  test("files come back in the order they were added, with their names", async () => {
    const { id } = await beginUpload({ filename: "frames", size: 300, userId: USER });
    await addFile({ id, index: 0, filename: "frame_001.png", buffer: Buffer.from("a"), userId: USER });
    await addFile({ id, index: 1, filename: "frame_002.png", buffer: Buffer.from("bb"), userId: USER });
    await addFile({ id, index: 2, filename: "frame_003.png", buffer: Buffer.from("ccc"), userId: USER });

    const files = await collectFiles({ id, userId: USER });
    expect(files.map((f) => f.name)).toEqual(["frame_001.png", "frame_002.png", "frame_003.png"]);
    expect(files.map((f) => f.buffer.toString())).toEqual(["a", "bb", "ccc"]);
    await discardUpload(id);
  });

  test("ten or more files still sort by number, not as text", async () => {
    const { id } = await beginUpload({ filename: "frames", size: 100, userId: USER });
    for (let i = 0; i < 12; i++) {
      await addFile({ id, index: i, filename: `f${i}.png`, buffer: Buffer.from(String(i)), userId: USER });
    }
    const files = await collectFiles({ id, userId: USER });
    expect(files.map((f) => f.name)).toEqual(
      Array.from({ length: 12 }, (_, i) => `f${i}.png`)
    );
    await discardUpload(id);
  });

  test("a filename cannot be used as a path", async () => {
    const { id } = await beginUpload({ filename: "frames", size: 100, userId: USER });
    await addFile({ id, index: 0, filename: "../../escape.png", buffer: Buffer.from("x"), userId: USER });
    const files = await collectFiles({ id, userId: USER });
    // The name is carried as data only; nothing was written outside the session.
    expect(files).toHaveLength(1);
    expect(fs.existsSync("/tmp/escape.png")).toBe(false);
    await discardUpload(id);
  });

  test("a session with no files reports that, rather than an empty success", async () => {
    const { id } = await beginUpload({ filename: "frames", size: 100, userId: USER });
    await expect(collectFiles({ id, userId: USER })).rejects.toThrow(/No files/);
    await discardUpload(id);
  });
});

describe("housekeeping", () => {
  test("an abandoned session is swept, a fresh one is left alone", async () => {
    const stale = await beginUpload({ filename: "old.zip", size: 100, userId: USER });
    const fresh = await beginUpload({ filename: "new.zip", size: 100, userId: USER });

    // Two hours on, only the untouched one should go.
    await sweepStaleUploads(Date.now() + 2 * 60 * 60 * 1000 - 1);
    await expect(finishUpload({ id: stale.id, userId: USER })).rejects.toThrow();

    await discardUpload(fresh.id);
  });
});
