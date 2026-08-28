import {
  frameNumberOf, sortFrameEntries, detectMissingFrames, isImageName,
  prepareEntries, frameKey, extensionOf,
} from "@/lib/cms/frameIngest";
import { resolveExtraction, FPS_MODES } from "@/lib/cms/frameSources";

const names = (list) => list.map((name) => ({ name }));

describe("frame numbering", () => {
  test("reads the trailing number, whatever the prefix", () => {
    expect(frameNumberOf("frame-1.jpg")).toBe(1);
    expect(frameNumberOf("frame-0042.jpg")).toBe(42);
    expect(frameNumberOf("0001.jpg")).toBe(1);
    expect(frameNumberOf("image_0007.png")).toBe(7);
    expect(frameNumberOf("render.0123.webp")).toBe(123);
  });

  test("a directory prefix cannot masquerade as the frame number", () => {
    expect(frameNumberOf("shot2/frame-9.jpg")).toBe(9);
    expect(frameNumberOf("scene_03/img_0011.png")).toBe(11);
  });

  test("unnumbered names report null rather than 0", () => {
    expect(frameNumberOf("poster.jpg")).toBeNull();
    expect(frameNumberOf("")).toBeNull();
  });
});

describe("sorting", () => {
  test("is numeric, not alphabetical — the classic frame-10 bug", () => {
    const sorted = sortFrameEntries(names(["frame-1.jpg", "frame-10.jpg", "frame-2.jpg"]));
    expect(sorted.map((e) => e.name)).toEqual(["frame-1.jpg", "frame-2.jpg", "frame-10.jpg"]);
  });

  test("handles a long unpadded run in the right order", () => {
    const input = names([9, 1, 100, 20, 3, 11, 2].map((n) => `frame-${n}.png`));
    expect(sortFrameEntries(input).map((e) => frameNumberOf(e.name))).toEqual([1, 2, 3, 9, 11, 20, 100]);
  });

  test("zero-padded and mixed padding sort together", () => {
    const input = names(["0010.jpg", "0002.jpg", "1.jpg", "003.jpg"]);
    expect(sortFrameEntries(input).map((e) => frameNumberOf(e.name))).toEqual([1, 2, 3, 10]);
  });

  test("unnumbered entries sort after numbered ones, stably", () => {
    const sorted = sortFrameEntries(names(["intro.jpg", "frame-2.jpg", "frame-1.jpg"]));
    expect(sorted.map((e) => e.name)).toEqual(["frame-1.jpg", "frame-2.jpg", "intro.jpg"]);
  });
});

describe("missing frame detection", () => {
  test("reports the gap the spec calls out", () => {
    const sorted = sortFrameEntries(names(["frame-001.jpg", "frame-002.jpg", "frame-004.jpg"]));
    expect(detectMissingFrames(sorted)).toEqual([3]);
  });

  test("reports several gaps", () => {
    const sorted = sortFrameEntries(names([1, 2, 5, 6, 9].map((n) => `f-${n}.jpg`)));
    expect(detectMissingFrames(sorted)).toEqual([3, 4, 7, 8]);
  });

  test("a complete run reports nothing", () => {
    const sorted = sortFrameEntries(names([1, 2, 3, 4].map((n) => `f-${n}.jpg`)));
    expect(detectMissingFrames(sorted)).toEqual([]);
  });

  test("a stray far-off number does not produce a giant gap list", () => {
    const sorted = sortFrameEntries(names(["f-1.jpg", "f-2.jpg", "f-99999.jpg"]));
    expect(detectMissingFrames(sorted)).toEqual([]);
  });

  test("nothing is silently reordered or duplicated", () => {
    const input = names(["frame-004.jpg", "frame-001.jpg", "frame-002.jpg"]);
    const sorted = sortFrameEntries(input);
    expect(sorted).toHaveLength(3);
    expect(new Set(sorted.map((e) => e.name)).size).toBe(3);
  });
});

describe("file filtering", () => {
  test("accepts the supported image types", () => {
    for (const n of ["a.jpg", "a.jpeg", "a.png", "a.webp", "a.PNG"]) expect(isImageName(n)).toBe(true);
  });

  test("rejects everything else, including archive noise", () => {
    for (const n of ["README.txt", "notes.pdf", ".DS_Store", "__MACOSX/._frame-1.jpg", "frames/", "a.mp4"]) {
      expect(isImageName(n)).toBe(false);
    }
  });

  test("prepareEntries orders images and counts what it skipped", () => {
    const { entries, skipped, missing } = prepareEntries(
      names(["frame-10.jpg", "README.txt", "frame-1.jpg", ".DS_Store", "frame-3.jpg"])
    );
    expect(entries.map((e) => e.name)).toEqual(["frame-1.jpg", "frame-3.jpg", "frame-10.jpg"]);
    expect(skipped).toBe(2);
    // Every gap in the run is reported, not just the first.
    expect(missing).toEqual([2, 4, 5, 6, 7, 8, 9]);
  });
});

describe("storage keys", () => {
  test("zero-padded so the stored order matches the sequence order", () => {
    expect(frameKey("abc", 0)).toBe("abc/frame-000001.webp");
    expect(frameKey("abc", 499)).toBe("abc/frame-000500.webp");
    expect(frameKey("abc", 0, "jpg")).toBe("abc/frame-000001.jpg");
    expect(extensionOf("x/y/z.JPEG")).toBe("jpeg");
  });
});

describe("video extraction strategy", () => {
  const meta = { duration: 10, fps: 60, width: 1920, height: 1080 };

  test("original keeps the source rate rather than forcing 30", () => {
    expect(resolveExtraction({ fpsMode: "original" }, meta)).toEqual({ fps: 60, frameCount: 600 });
  });

  test("the presets are honoured exactly", () => {
    expect(resolveExtraction({ fpsMode: "30" }, meta).fps).toBe(30);
    expect(resolveExtraction({ fpsMode: "24" }, meta).fps).toBe(24);
    expect(resolveExtraction({ fpsMode: "15" }, meta)).toEqual({ fps: 15, frameCount: 150 });
  });

  test("custom fps", () => {
    expect(resolveExtraction({ fpsMode: "custom", customFps: "12.5" }, meta).fps).toBeCloseTo(12.5);
  });

  test("a target frame count backs out the fps", () => {
    const r = resolveExtraction({ fpsMode: "target", targetFrames: "120" }, meta);
    expect(r.frameCount).toBe(120);
    expect(r.fps).toBeCloseTo(12);
  });

  test("a long clip is capped instead of producing an unbounded sequence", () => {
    const long = { duration: 600, fps: 60 };
    const r = resolveExtraction({ fpsMode: "original" }, long);
    expect(r.frameCount).toBeLessThanOrEqual(5000);
    expect(r.fps).toBeLessThan(60);
  });

  test("every advertised mode resolves to something usable", () => {
    for (const { value } of FPS_MODES) {
      const r = resolveExtraction({ fpsMode: value, customFps: "10", targetFrames: "50" }, meta);
      expect(r.fps).toBeGreaterThan(0);
      expect(r.frameCount).toBeGreaterThan(0);
    }
  });
});
