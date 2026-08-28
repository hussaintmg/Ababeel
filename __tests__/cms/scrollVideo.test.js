import { mapProgress, computeProgress, SCROLL_MODES } from "@/Components/cms/ScrollVideo";

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

  test("a mode saved before it was retired still maps sanely", () => {
    // "progressive" was removed from the picker; existing blocks keep working
    // by falling through to frame scrubbing.
    expect(mapProgress(0.5, { mode: "progressive" })).toBeCloseTo(0.5);
    expect(mapProgress(0, { mode: "progressive" })).toBe(0);
    expect(mapProgress(1, { mode: "progressive" })).toBe(1);
  });

  test("every advertised mode is handled", () => {
    for (const { value } of SCROLL_MODES) {
      const out = mapProgress(0.5, { mode: value });
      expect(out).toBeGreaterThanOrEqual(0);
      expect(out).toBeLessThanOrEqual(1);
    }
  });
});

describe("scroll progress", () => {
  const VIEW = 900;

  test("0 at the top of the track, 1 once it has fully passed", () => {
    // A 300vh track (2700px) in a 900px viewport scrolls 1800px.
    expect(computeProgress({ rectTop: 0, rectHeight: 2700, viewHeight: VIEW })).toBe(0);
    expect(computeProgress({ rectTop: -900, rectHeight: 2700, viewHeight: VIEW })).toBeCloseTo(0.5);
    expect(computeProgress({ rectTop: -1800, rectHeight: 2700, viewHeight: VIEW })).toBe(1);
  });

  test("clamped before and after the track", () => {
    expect(computeProgress({ rectTop: 600, rectHeight: 2700, viewHeight: VIEW })).toBe(0);
    expect(computeProgress({ rectTop: -5000, rectHeight: 2700, viewHeight: VIEW })).toBe(1);
  });

  test("a track no taller than its viewport never advances", () => {
    expect(computeProgress({ rectTop: -100, rectHeight: 900, viewHeight: VIEW })).toBe(0);
    expect(computeProgress({ rectTop: -100, rectHeight: 400, viewHeight: VIEW })).toBe(0);
  });

  test("measures against a scrolling pane, not just the page", () => {
    // The builder preview: a 630px pane starting 200px down the page.
    const pane = { viewTop: 200, viewHeight: 630 };
    expect(computeProgress({ rectTop: 200, rectHeight: 2700, ...pane })).toBe(0);
    expect(computeProgress({ rectTop: 200 - 1035, rectHeight: 2700, ...pane })).toBeCloseTo(0.5);
    expect(computeProgress({ rectTop: 200 - 2070, rectHeight: 2700, ...pane })).toBe(1);
  });

  test("scroll progress feeds the playback mapping unchanged at the ends", () => {
    const raw = computeProgress({ rectTop: 0, rectHeight: 2700, viewHeight: VIEW });
    expect(mapProgress(raw, { mode: "scrub" })).toBe(0);
    const end = computeProgress({ rectTop: -1800, rectHeight: 2700, viewHeight: VIEW });
    expect(mapProgress(end, { mode: "scrub" })).toBe(1);
  });
});
