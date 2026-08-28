import { mapProgress, computeProgress, loadOrder, trackTravel, trackHeightCss, reducedMotionMode, SCROLL_MODES } from "@/Components/cms/ScrollVideo";

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

describe("frame download priority", () => {
  test("the current frame comes first", () => {
    expect(loadOrder(100, 40)[0]).toBe(40);
  });

  test("a coarse spread over the whole sequence comes before the detail", () => {
    // This is what stops the animation freezing part-way while it loads. After
    // a dozen images the picture must already change from one end of the
    // section to the other, so those dozen have to be spread across the whole
    // sequence rather than bunched around wherever the viewer happens to be.
    const order = loadOrder(120, 0);
    const first = order.slice(0, 14);
    expect(Math.max(...first)).toBeGreaterThanOrEqual(110);
    expect(first).toContain(0);
    expect(first).toContain(119);
    // and they are spread, not clustered
    const gaps = first.slice(1).map((v, i) => Math.abs(v - first[i]));
    expect(Math.max(...gaps)).toBeGreaterThan(5);
  });

  test("the window around the viewer is fetched before anything distant", () => {
    const order = loadOrder(200, 100, 20);
    // after the coarse pass, the next frames are the viewer's neighbourhood
    const afterCoarse = order.slice(0, 60);
    const nearby = afterCoarse.filter((i) => Math.abs(i - 100) <= 20);
    expect(nearby.length).toBeGreaterThanOrEqual(40);
    // frame 0 matters for anyone scrolling back up, and is in the coarse pass
    expect(order.indexOf(0)).toBeLessThan(30);
  });

  test("the last frame is fetched early, because the section releases on it", () => {
    expect(loadOrder(120, 0).indexOf(119)).toBeLessThan(20);
  });

  test("every frame is queued exactly once", () => {
    const order = loadOrder(60, 25);
    expect(order).toHaveLength(60);
    expect(new Set(order).size).toBe(60);
    expect([...order].sort((a, b) => a - b)).toEqual([...Array(60).keys()]);
  });

  test("clamps at the ends without producing out-of-range indices", () => {
    for (const current of [0, 59]) {
      const order = loadOrder(60, current);
      expect(Math.min(...order)).toBe(0);
      expect(Math.max(...order)).toBe(59);
    }
  });

  test("a single-frame sequence is handled", () => {
    expect(loadOrder(1, 0)).toEqual([0]);
  });
});

describe("how much scroll a sequence gets", () => {
  const travelOf = (css) => /max\((\d+)px, (\d+)vh\)/.exec(css);

  test("a sequence asks for its own per-frame distance", () => {
    expect(trackTravel(240, 12)).toBe(2880);
    expect(trackTravel(120, 12)).toBe(1440);
    expect(trackTravel(26, 12)).toBe(312);
  });

  test("the author's own pxPerFrame is respected", () => {
    expect(trackTravel(100, 30)).toBe(3000);
  });

  test("a short sequence is given screens, not a fixed number of pixels", () => {
    // This is the bug that made a working animation look like it did nothing.
    // 26 frames at 12px is 312px, and the old floor of 900px is 1.1 screens on
    // an 800px window — the whole animation was over inside one flick, and the
    // taller the screen the less of it anyone saw. The floor is now measured in
    // screens, so it holds on a phone and on a 4K monitor alike.
    const css = trackHeightCss({ usesFrames: true, frameCount: 26, pxPerFrame: "12", stageHeight: "100vh" });
    const m = travelOf(css);
    expect(m).not.toBeNull();
    expect(Number(m[1])).toBe(312);
    expect(Number(m[2])).toBeGreaterThanOrEqual(250);
  });

  test("a long sequence still gets its per-frame distance on top", () => {
    const m = travelOf(trackHeightCss({ usesFrames: true, frameCount: 400, pxPerFrame: "12", stageHeight: "100vh" }));
    // 4800px beats 250vh on any ordinary screen, and CSS max() picks it there.
    expect(Number(m[1])).toBe(4800);
  });

  test("an explicit scroll distance still wins over both", () => {
    expect(trackHeightCss({ scrollDuration: "4", usesFrames: true, frameCount: 26, pxPerFrame: "12", stageHeight: "100vh" }))
      .toBe("calc(100vh + 400vh)");
  });
});

describe("what a visitor with reduced motion gets", () => {
  test("a block that never chose gets the scroll-following fallback", () => {
    expect(reducedMotionMode({})).toBe("scrub");
    expect(reducedMotionMode({ reducedMotion: "" })).toBe("scrub");
  });

  test("the old boolean still means what it meant", () => {
    // false always meant "ignore the setting".
    expect(reducedMotionMode({ respectReducedMotion: false })).toBe("full");
    // true meant a frozen frame; it now maps to the gentler option, because a
    // picture that never changes is what made the section look broken.
    expect(reducedMotionMode({ respectReducedMotion: true })).toBe("scrub");
  });

  test("an explicit choice always wins", () => {
    expect(reducedMotionMode({ reducedMotion: "still", respectReducedMotion: false })).toBe("still");
    expect(reducedMotionMode({ reducedMotion: "full", respectReducedMotion: true })).toBe("full");
    expect(reducedMotionMode({ reducedMotion: "scrub" })).toBe("scrub");
  });

  test("an unknown value falls back rather than breaking the section", () => {
    expect(reducedMotionMode({ reducedMotion: "nonsense" })).toBe("scrub");
    expect(reducedMotionMode(null)).toBe("scrub");
  });
});
