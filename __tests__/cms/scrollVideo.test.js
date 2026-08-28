import { mapProgress, SCROLL_MODES } from "@/Components/cms/ScrollVideo";

describe("scroll → playback mapping", () => {
  test("frame scrubbing maps scroll linearly onto the clip", () => {
    expect(mapProgress(0, { mode: "scrub" })).toBe(0);
    expect(mapProgress(0.5, { mode: "scrub" })).toBeCloseTo(0.5);
    expect(mapProgress(1, { mode: "scrub" })).toBe(1);
  });

  test("clamps out-of-range scroll values", () => {
    expect(mapProgress(-2, { mode: "scrub" })).toBe(0);
    expect(mapProgress(9, { mode: "scrub" })).toBe(1);
  });

  test("start and end offsets restrict the playback range", () => {
    expect(mapProgress(0, { startOffset: 20, endOffset: 80 })).toBeCloseTo(0.2);
    expect(mapProgress(1, { startOffset: 20, endOffset: 80 })).toBeCloseTo(0.8);
    expect(mapProgress(0.5, { startOffset: 20, endOffset: 80 })).toBeCloseTo(0.5);
  });

  test("reverse runs the clip backwards", () => {
    expect(mapProgress(0, { reverse: true })).toBe(1);
    expect(mapProgress(1, { reverse: true })).toBe(0);
    expect(mapProgress(0, { mode: "reverse" })).toBe(1);
  });

  test("ping pong goes out and back", () => {
    expect(mapProgress(0, { mode: "pingpong" })).toBe(0);
    expect(mapProgress(0.5, { mode: "pingpong" })).toBeCloseTo(1);
    expect(mapProgress(1, { mode: "pingpong" })).toBeCloseTo(0);
  });

  test("loop mode repeats the clip across the scroll distance", () => {
    expect(mapProgress(0.25, { mode: "loop", loops: 2 })).toBeCloseTo(0.5);
    expect(mapProgress(0.75, { mode: "loop", loops: 2 })).toBeCloseTo(0.5);
  });

  test("speed reaches the last frame before the end of the track", () => {
    expect(mapProgress(0.5, { speed: 2 })).toBeCloseTo(1);
    expect(mapProgress(0.25, { speed: 2 })).toBeCloseTo(0.5);
  });

  test("every advertised mode is handled", () => {
    for (const { value } of SCROLL_MODES) {
      const out = mapProgress(0.5, { mode: value });
      expect(out).toBeGreaterThanOrEqual(0);
      expect(out).toBeLessThanOrEqual(1);
    }
  });
});
