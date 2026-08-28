/**
 * Making an uploaded video seekable.
 *
 * The decision is tested on its own, without ffmpeg or a file, because that is
 * the part that decides whether a section works. The conversion itself is
 * tested too, but only where ffmpeg is actually present — the whole point of
 * the module is that a host without it still stores a working upload.
 */
import fs from "fs";
import path from "path";
import { moovPosition, needsFaststart, videoCodec, planConversion } from "@/lib/cms/videoPrepare";

/** A minimal MP4-shaped buffer with `moov` at a chosen position. */
function mp4With(moovAt, total = 1000) {
  const buf = Buffer.alloc(total, 0x20);
  buf.write("ftyp", 4, "latin1");
  buf.write("moov", moovAt, "latin1");
  return buf;
}

describe("where the index sits", () => {
  test("finds the moov atom and reports it as a fraction of the file", () => {
    expect(moovPosition(mp4With(20, 1000))).toBeCloseTo(0.02);
    expect(moovPosition(mp4With(950, 1000))).toBeCloseTo(0.95);
  });

  test("a container with no moov atom is not an MP4 question", () => {
    expect(moovPosition(Buffer.from("this is a webm, honest"))).toBeNull();
    expect(needsFaststart(Buffer.from("this is a webm, honest"))).toBe(false);
  });

  test("an index at the end means the browser cannot seek the file", () => {
    // This is the whole bug: almost every encoder writes the index last, and
    // until the browser has it `video.duration` is NaN and the scroll drives
    // nothing at all.
    expect(needsFaststart(mp4With(990, 1000))).toBe(true);
  });

  test("an index at the front is fine", () => {
    expect(needsFaststart(mp4With(36, 1000))).toBe(false);
  });
});

describe("reading the codec out of an ffmpeg report", () => {
  test("finds H.264", () => {
    expect(videoCodec("  Stream #0:0(und): Video: h264 (Main), yuv420p, 1280x720")).toBe("h264");
  });

  test("finds HEVC, which is what a phone often produces", () => {
    expect(videoCodec("  Stream #0:0: Video: hevc (Main 10), yuv420p10le, 1920x1080")).toBe("hevc");
  });

  test("is not confused by an audio stream listed first", () => {
    const report = "  Stream #0:0: Audio: aac, 48000 Hz\n  Stream #0:1: Video: vp9, yuv420p, 640x360";
    expect(videoCodec(report)).toBe("vp9");
  });

  test("reports nothing rather than guessing when there is no video stream", () => {
    expect(videoCodec("  Stream #0:0: Audio: aac, 48000 Hz")).toBe("");
    expect(videoCodec("")).toBe("");
    expect(videoCodec(null)).toBe("");
  });
});

describe("deciding what to do with an uploaded video", () => {
  const plan = (o) => planConversion({ codec: "h264", faststartNeeded: false, keyframeGap: 0.4, container: "mp4", ...o });

  test("a file that is already right is left alone", () => {
    expect(plan({}).action).toBe("keep");
  });

  test("an index at the end is a remux, not a re-encode", () => {
    // It is lossless and takes about a second; re-encoding would throw away
    // quality for a problem that is only where the bytes are.
    const p = plan({ faststartNeeded: true });
    expect(p.action).toBe("remux");
    expect(p.note).toMatch(/index/i);
  });

  test("a codec browsers cannot play is re-encoded, and the note says which", () => {
    const p = plan({ codec: "hevc" });
    expect(p.action).toBe("encode");
    expect(p.note).toMatch(/HEVC/);
  });

  test("VP9 and AV1 are left alone — they are not H.264, but browsers play them", () => {
    expect(plan({ codec: "vp9" }).action).toBe("keep");
    expect(plan({ codec: "av1" }).action).toBe("keep");
  });

  test("keyframes far apart are re-encoded, because that is what makes a scrub lag", () => {
    const p = plan({ keyframeGap: 4 });
    expect(p.action).toBe("encode");
    expect(p.note).toMatch(/4\.0s apart/);
  });

  test("a host with no ffprobe cannot measure keyframes, and that is not an error", () => {
    expect(plan({ keyframeGap: null }).action).toBe("keep");
  });

  test("a QuickTime file is repackaged even when its codec is fine", () => {
    expect(plan({ container: "mov" }).action).toBe("remux");
  });

  test("a file nothing could be read from is left alone and said so", () => {
    const p = plan({ codec: "" });
    expect(p.action).toBe("keep");
    expect(p.reason).toBe("unreadable");
    expect(p.note).toBeTruthy();
  });

  test("an unplayable codec outranks a late index — one re-encode fixes both", () => {
    expect(plan({ codec: "hevc", faststartNeeded: true }).action).toBe("encode");
  });
});

/* --------------------------------------------------------------------- *
 * The real thing, only where ffmpeg is present. On a host without it the
 * module must still return the original bytes, which is covered above.
 * --------------------------------------------------------------------- */
const ffmpegBin = (() => {
  try {
    // eslint-disable-next-line global-require
    const m = require("ffmpeg-static");
    const bin = typeof m === "string" ? m : m?.path || "";
    return bin && fs.existsSync(bin) ? bin : "";
  } catch {
    return "";
  }
})();

const describeWithFfmpeg = ffmpegBin ? describe : describe.skip;

describeWithFfmpeg("converting a real file", () => {
  const { execFileSync } = require("child_process");
  const { prepareScrollVideo } = require("@/lib/cms/videoPrepare");
  const dir = fs.mkdtempSync(path.join(require("os").tmpdir(), "vp-"));
  const src = path.join(dir, "normal.mp4");

  beforeAll(() => {
    // A clip the way an ordinary encoder writes one: index last, keyframes far
    // apart. testsrc needs no input files, so this runs anywhere ffmpeg does.
    execFileSync(ffmpegBin, [
      "-y", "-f", "lavfi", "-i", "testsrc=size=320x180:rate=12:duration=8",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "48", "-sc_threshold", "0", src,
    ], { stdio: "ignore", timeout: 120000 });
  }, 180000);

  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  test("a normal export really does have its index at the end", () => {
    expect(needsFaststart(fs.readFileSync(src))).toBe(true);
  });

  test("preparing it makes the file seekable", async () => {
    const out = await prepareScrollVideo(fs.readFileSync(src), "normal.mp4");
    expect(out.changed).toBe(true);
    expect(needsFaststart(out.buffer)).toBe(false);
    expect(moovPosition(out.buffer)).toBeLessThan(0.05);
    expect(out.note).toBeTruthy();
  }, 180000);

  test("a file that cannot be parsed comes back untouched rather than failing the upload", async () => {
    const junk = Buffer.from("not a video at all");
    const out = await prepareScrollVideo(junk, "broken.mp4");
    expect(out.changed).toBe(false);
    expect(out.buffer).toBe(junk);
    expect(out.note).toBeTruthy();
  }, 120000);
});
