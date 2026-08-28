import path from "path";
import {
  frameName, frameUrl, resolveUploadPath, clampFrameCount, clampWidth,
  MIN_FRAMES, MAX_FRAMES, MAX_WIDTH, DEFAULT_FRAMES, DEFAULT_WIDTH,
} from "@/lib/cms/frames";
import { frameUrl as clientFrameUrl } from "@/Components/cms/ScrollVideo";

describe("frame naming", () => {
  test("zero-padded, 1-based file names", () => {
    expect(frameName(0)).toBe("0001.webp");
    expect(frameName(119)).toBe("0120.webp");
    expect(frameName(9, "jpg")).toBe("0010.jpg");
  });

  test("the server and the browser agree on the URL", () => {
    // The renderer builds frame URLs itself to avoid a manifest round-trip, so
    // the two implementations must not drift apart.
    for (const i of [0, 1, 42, 119, 239]) {
      expect(clientFrameUrl("abc123", i)).toBe(frameUrl("abc123", i));
    }
    expect(frameUrl("abc123", 0)).toBe("/uploads/cms/frames/abc123/0001.webp");
  });
});

describe("limits", () => {
  test("frame count is clamped to a sane range", () => {
    expect(clampFrameCount(120)).toBe(120);
    expect(clampFrameCount(5)).toBe(MIN_FRAMES);
    expect(clampFrameCount(100000)).toBe(MAX_FRAMES);
    expect(clampFrameCount("not a number")).toBe(DEFAULT_FRAMES);
    expect(clampFrameCount(undefined)).toBe(DEFAULT_FRAMES);
  });

  test("width is clamped", () => {
    expect(clampWidth(1280)).toBe(1280);
    expect(clampWidth(10)).toBe(320);
    expect(clampWidth(99999)).toBe(MAX_WIDTH);
    expect(clampWidth("")).toBe(DEFAULT_WIDTH);
  });
});

describe("upload path resolution", () => {
  test("accepts a real uploads URL", () => {
    const p = resolveUploadPath("/uploads/cms/demo.mp4");
    expect(p).toBe(path.join(process.cwd(), "public", "uploads", "cms", "demo.mp4"));
  });

  test("refuses anything outside the uploads directory", () => {
    expect(resolveUploadPath("/uploads/../../etc/passwd")).toBeNull();
    expect(resolveUploadPath("/etc/passwd")).toBeNull();
    expect(resolveUploadPath("../../etc/passwd")).toBeNull();
    expect(resolveUploadPath("")).toBeNull();
    expect(resolveUploadPath(null)).toBeNull();
  });

  test("a traversal that still lands inside uploads is fine", () => {
    expect(resolveUploadPath("/uploads/cms/../cms/demo.mp4")).toBe(
      path.join(process.cwd(), "public", "uploads", "cms", "demo.mp4")
    );
  });
});
