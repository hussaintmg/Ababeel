import {
  applyEase,
  computeProgress,
  mapProgress,
  trackHeightCss,
  sceneState,
  sceneStyle,
  scenePlacement,
  overlayStyle,
  snapTarget,
  resolveSource,
  validateScrollVideo,
  EASES,
  SCENE_ANIMATIONS,
} from "@/Components/cms/ScrollVideo";

describe("easing", () => {
  test("every offered ease starts at 0 and finishes at 1", () => {
    // An ease that does not is a scene that never fully appears, or one that
    // is already visible before its range begins.
    EASES.forEach(({ value }) => {
      expect(applyEase(value, 0)).toBeCloseTo(0, 5);
      expect(applyEase(value, 1)).toBeCloseTo(1, 5);
    });
  });

  test("an unknown ease is linear rather than an exception", () => {
    expect(applyEase("no-such-ease", 0.4)).toBeCloseTo(0.4);
  });

  test("out-of-range input is clamped", () => {
    expect(applyEase("power2.out", -3)).toBe(0);
    expect(applyEase("power2.out", 7)).toBe(1);
  });
});

describe("start and end triggers", () => {
  const track = { rectHeight: 2000, viewHeight: 800 };

  test("the default pair reproduces the original behaviour exactly", () => {
    // Progress 0 when the track's top meets the viewport's top; 1 when its
    // bottom meets the viewport's bottom. Pages saved before triggers existed
    // must be unaffected by them.
    expect(computeProgress({ ...track, rectTop: 0 })).toBe(0);
    expect(computeProgress({ ...track, rectTop: -600 })).toBeCloseTo(0.5);
    expect(computeProgress({ ...track, rectTop: -1200 })).toBe(1);
  });

  test("'top center' starts the animation half a screen earlier", () => {
    expect(computeProgress({ ...track, rectTop: 400, start: "top center" })).toBe(0);
    expect(computeProgress({ ...track, rectTop: 0, start: "top center" })).toBeGreaterThan(0);
  });

  test("'bottom top' runs on until the section has left the screen", () => {
    expect(computeProgress({ ...track, rectTop: -2000, start: "top top", end: "bottom top" })).toBe(1);
    expect(computeProgress({ ...track, rectTop: -1200, start: "top top", end: "bottom top" })).toBeCloseTo(0.6);
  });

  test("an unusable trigger falls back rather than freezing the section", () => {
    const p = computeProgress({ ...track, rectTop: -600, start: "nonsense", end: "rubbish" });
    expect(p).toBeCloseTo(0.5);
  });

  test("a track shorter than the screen never divides by zero", () => {
    expect(computeProgress({ rectTop: 0, rectHeight: 300, viewHeight: 800 })).toBe(0);
  });
});

describe("delay before the animation starts", () => {
  test("the first slice of the track does nothing", () => {
    expect(mapProgress(0.1, { offset: 20 })).toBe(0);
    expect(mapProgress(0.2, { offset: 20 })).toBeCloseTo(0);
    expect(mapProgress(0.6, { offset: 20 })).toBeCloseTo(0.5);
    expect(mapProgress(1, { offset: 20 })).toBe(1);
  });

  test("an absurd delay still leaves scroll for the animation", () => {
    expect(mapProgress(1, { offset: 999 })).toBe(1);
  });
});

describe("track height", () => {
  test("scroll distance in screens wins over the frame-count estimate", () => {
    expect(trackHeightCss({ scrollDuration: "3", stageHeight: "100vh", usesFrames: true, frameCount: 120, pxPerFrame: 12 }))
      .toBe("calc(100vh + 300vh)");
  });

  test("an explicit CSS height wins over everything", () => {
    expect(trackHeightCss({ height: "450vh", scrollDuration: "3" })).toBe("450vh");
  });

  test("a frame sequence with nothing set sizes itself from its frames, with a floor in screens", () => {
    expect(trackHeightCss({ usesFrames: true, frameCount: 120, pxPerFrame: "14", stageHeight: "100vh" }))
      .toBe("calc(100vh + max(1680px, 250vh))");
  });

  test("a video with nothing set gets three screens", () => {
    expect(trackHeightCss({ stageHeight: "100vh" })).toBe("300vh");
  });

  test("a nonsense scroll distance does not produce nonsense CSS", () => {
    expect(trackHeightCss({ scrollDuration: "abc", stageHeight: "100vh" })).toBe("300vh");
  });
});

describe("scenes", () => {
  test("a scene is off before its range and on inside it", () => {
    const scene = { start: 40, end: 70 };
    expect(sceneState(scene, 0.1).active).toBe(false);
    expect(sceneState(scene, 0.55).active).toBe(true);
    expect(sceneState(scene, 0.95).active).toBe(false);
  });

  test("it eases in at the start of its range and out at the end", () => {
    const scene = { start: 20, end: 80 };
    expect(sceneState(scene, 0.2).enter).toBe(0);
    expect(sceneState(scene, 0.5).enter).toBe(1);
    expect(sceneState(scene, 0.5).exit).toBe(0);
    expect(sceneState(scene, 0.8).exit).toBeCloseTo(1);
  });

  test("a scene pinned to the start of the track is already in at 0%", () => {
    // Otherwise the first scene is invisible for the whole time the stage is
    // pinning, and the section looks like it failed to load.
    expect(sceneState({ start: 0, end: 32 }, 0).enter).toBe(1);
    expect(sceneStyle({ start: 0, end: 32, animation: "fade-up" }, 0).style.opacity).toBeCloseTo(1);
  });

  test("a scene pinned to the end of the track does not fade out again", () => {
    expect(sceneState({ start: 68, end: 100 }, 1).exit).toBe(0);
    expect(sceneStyle({ start: 68, end: 100, animation: "fade-up" }, 1).style.opacity).toBeCloseTo(1);
  });

  test("a scene in the middle still animates at both ends of its own range", () => {
    expect(sceneStyle({ start: 34, end: 66, animation: "fade-up" }, 0.34).style.opacity).toBeCloseTo(0);
    expect(sceneStyle({ start: 34, end: 66, animation: "fade-up" }, 0.5).style.opacity).toBeCloseTo(1);
    expect(sceneStyle({ start: 34, end: 66, animation: "fade-up" }, 0.66).style.opacity).toBeCloseTo(0);
  });

  test("a scene with no range covers the whole section", () => {
    expect(sceneState({}, 0.5).active).toBe(true);
    expect(sceneState({}, 0.5).t).toBeCloseTo(0.5);
  });

  test("start and end the wrong way round is swapped, not blanked", () => {
    // The editor warns about it separately; silently showing nothing would be
    // the worse of the two failures.
    expect(sceneState({ start: 80, end: 20 }, 0.5).active).toBe(true);
  });

  test("a zero-width range does not divide by zero", () => {
    const s = sceneState({ start: 50, end: 50 }, 0.6);
    expect(Number.isFinite(s.t)).toBe(true);
    expect(s.active).toBe(true);
  });

  test("out-of-range percentages are clamped", () => {
    expect(sceneState({ start: -50, end: 400 }, 0.5).active).toBe(true);
  });

  test("mid-range a scene is fully opaque and untransformed", () => {
    const { style } = sceneStyle({ start: 0, end: 100, animation: "fade-up" }, 0.5);
    expect(style.opacity).toBeCloseTo(1);
    expect(style.transform).toBe("translate3d(0, 0.00px, 0)");
  });

  test("every offered animation produces a usable style", () => {
    SCENE_ANIMATIONS.forEach(({ value }) => {
      const { style } = sceneStyle({ start: 0, end: 100, animation: value }, 0.08);
      expect(Number.isFinite(style.opacity)).toBe(true);
      if (style.transform) expect(style.transform).not.toMatch(/NaN/);
      if (style.filter) expect(style.filter).not.toMatch(/NaN/);
    });
  });

  test("reduced motion keeps the fade and drops the travel", () => {
    const { style } = sceneStyle({ start: 20, end: 80, animation: "fade-up" }, 0.22, { reduced: true });
    expect(style.transform).toBeUndefined();
    expect(style.opacity).toBeLessThan(1);
  });

  test("an inactive scene is hidden rather than merely transparent", () => {
    const { active, style } = sceneStyle({ start: 60, end: 90 }, 0.1);
    expect(active).toBe(false);
    expect(style.visibility).toBe("hidden");
  });

  test("placement maps the nine positions onto flexbox", () => {
    expect(scenePlacement("top-left")).toEqual({ justifyContent: "flex-start", alignItems: "flex-start" });
    expect(scenePlacement("bottom-right")).toEqual({ justifyContent: "flex-end", alignItems: "flex-end" });
    expect(scenePlacement("center")).toEqual({ justifyContent: "center", alignItems: "center" });
    expect(scenePlacement(undefined)).toEqual({ justifyContent: "center", alignItems: "center" });
  });
});

describe("overlay layers", () => {
  test("an item animates only inside its own window", () => {
    const item = { start: 20, end: 60, fromOpacity: 0, toOpacity: 1, ease: "linear" };
    expect(overlayStyle(item, 0.1).opacity).toBe(0);
    expect(overlayStyle(item, 0.4).opacity).toBeCloseTo(0.5);
    expect(overlayStyle(item, 0.9).opacity).toBe(1);
  });

  test("values left blank stay at their natural setting", () => {
    const style = overlayStyle({}, 0.5);
    expect(style.transform).toBeUndefined();
    expect(style.filter).toBeUndefined();
  });

  test("movement, scale and blur interpolate together", () => {
    const item = { fromY: 100, toY: 0, fromScale: 0.8, toScale: 1, fromBlur: 10, toBlur: 0, ease: "linear" };
    const half = overlayStyle(item, 0.5);
    expect(half.transform).toContain("translate3d(0.00px, 50.00px, 0)");
    expect(half.transform).toContain("scale(0.9000)");
    expect(half.filter).toBe("blur(5.00px)");
  });

  test("reduced motion drops movement but keeps the fade", () => {
    const item = { fromY: 100, toY: 0, fromOpacity: 0, toOpacity: 1, ease: "linear" };
    const style = overlayStyle(item, 0.5, { reduced: true });
    expect(style.transform).toBeUndefined();
    expect(style.opacity).toBeCloseTo(0.5);
  });

  test("a zero-width window does not produce NaN", () => {
    const style = overlayStyle({ start: 50, end: 50 }, 0.5);
    expect(Number.isFinite(style.opacity)).toBe(true);
  });

  test("opacity can never leave 0–1", () => {
    expect(overlayStyle({ fromOpacity: -5, toOpacity: 9, ease: "linear" }, 0).opacity).toBe(0);
    expect(overlayStyle({ fromOpacity: -5, toOpacity: 9, ease: "linear" }, 1).opacity).toBe(1);
  });
});

describe("settling on a scene boundary", () => {
  const scenes = [{ start: 0, end: 30 }, { start: 30, end: 70 }, { start: 70, end: 100 }];

  test("nothing happens when snapping is off", () => {
    expect(snapTarget(0.31, scenes, { enabled: false })).toBeNull();
  });

  test("a nearby boundary is chosen", () => {
    expect(snapTarget(0.32, scenes, { enabled: true })).toBeCloseTo(0.3);
  });

  test("a position far from any boundary is left alone", () => {
    // Otherwise the page pulls against the reader in the middle of a scene.
    expect(snapTarget(0.5, scenes, { enabled: true })).toBeNull();
  });

  test("already exactly on a boundary means no move", () => {
    expect(snapTarget(0.3, scenes, { enabled: true })).toBeNull();
  });

  test("the two ends of the track are always boundaries", () => {
    expect(snapTarget(0.03, [], { enabled: true })).toBe(0);
    expect(snapTarget(0.97, [], { enabled: true })).toBe(1);
  });
});

describe("which source actually plays", () => {
  const frames = ["/a/1.webp", "/a/2.webp", "/a/3.webp"];

  test("a frame sequence beats a video file", () => {
    const s = resolveSource({ renderMode: "frames", frames, src: "/v.mp4" });
    expect(s.kind).toBe("frames");
    expect(s.frameCount).toBe(3);
  });

  test("frames mode with no frames falls through to the video", () => {
    expect(resolveSource({ renderMode: "frames", frames: [], src: "/v.mp4" }).kind).toBe("video");
  });

  test("a phone uses the mobile cut when there is one", () => {
    expect(resolveSource({ src: "/big.mp4", mobileSrc: "/small.mp4" }, { mobile: true }).src).toBe("/small.mp4");
    expect(resolveSource({ src: "/big.mp4", mobileSrc: "/small.mp4" }, { mobile: false }).src).toBe("/big.mp4");
  });

  test("switching the section off on mobile shows the poster there only", () => {
    const p = { renderMode: "frames", frames, poster: "/p.webp", mobileMode: "off" };
    expect(resolveSource(p, { mobile: true }).kind).toBe("poster");
    expect(resolveSource(p, { mobile: false }).kind).toBe("frames");
  });

  test("with nothing configured at all it reports nothing rather than guessing", () => {
    expect(resolveSource({}).kind).toBe("none");
  });

  test("a poster alone is still something to show", () => {
    expect(resolveSource({ poster: "/p.webp" }).kind).toBe("poster");
  });
});

describe("what the editor warns about", () => {
  const messages = (p) => validateScrollVideo(p).map((x) => `${x.level}: ${x.message}`);
  const errorsOf = (p) => validateScrollVideo(p).filter((x) => x.level === "error");

  test("a fully configured section is clean", () => {
    const p = {
      renderMode: "frames",
      frames: ["/a/1.webp", "/a/2.webp"],
      poster: "/p.webp",
      title: "Safety first",
      scenes: [],
    };
    expect(validateScrollVideo(p)).toEqual([]);
  });

  test("an empty section is an error, not a warning", () => {
    expect(errorsOf({}).length).toBeGreaterThan(0);
  });

  test("frames mode with nothing attached says exactly that", () => {
    expect(messages({ renderMode: "frames", poster: "/p.webp", title: "x" }).join(" ")).toMatch(/no usable sequence/i);
  });

  test("a video address that is not a URL is rejected", () => {
    expect(messages({ src: "my video.mp4" }).join(" ")).toMatch(/not a usable URL/);
  });

  test("a playback range that starts after it ends is an error", () => {
    const issue = errorsOf({ src: "/v.mp4", startOffset: 80, endOffset: 20 })[0];
    expect(issue.message).toMatch(/starts at 80% and ends at 20%/);
    expect(issue.hint).toMatch(/must be before the end/);
  });

  test("a scene whose start is past its end is an error", () => {
    const out = messages({ src: "/v.mp4", scenes: [{ start: 80, end: 20, heading: "Hi" }] });
    expect(out.join(" ")).toMatch(/starts at 80% and ends at 20%/);
  });

  test("an empty scene is flagged so it is not left in by mistake", () => {
    expect(messages({ src: "/v.mp4", scenes: [{ start: 0, end: 50 }] }).join(" ")).toMatch(/is empty/);
  });

  test("overlapping scenes are a warning with the number to fix it", () => {
    const out = messages({
      src: "/v.mp4",
      poster: "/p.webp",
      title: "x",
      scenes: [
        { start: 0, end: 60, heading: "A" },
        { start: 20, end: 100, heading: "B" },
      ],
    });
    expect(out.join(" ")).toMatch(/overlap/);
  });

  test("a missing poster is a warning, because that is what makes it black", () => {
    expect(messages({ src: "/v.mp4", title: "x" }).join(" ")).toMatch(/No poster image/);
  });

  test("several scenes with pinning off explains why they will not show", () => {
    const out = messages({
      src: "/v.mp4",
      poster: "/p.webp",
      sticky: false,
      scenes: [{ start: 0, end: 50, heading: "A" }, { start: 50, end: 100, heading: "B" }],
    });
    expect(out.join(" ")).toMatch(/not pinned/);
  });

  test("a section with no text anywhere is flagged for search and screen readers", () => {
    expect(messages({ src: "/v.mp4", poster: "/p.webp" }).join(" ")).toMatch(/No text anywhere/);
  });

  test("a nonsense scroll distance is an error naming the value", () => {
    expect(messages({ src: "/v.mp4", scrollDuration: "two" }).join(" ")).toMatch(/“two” is not a number/);
  });

  test("every issue carries something the author can act on", () => {
    const issues = validateScrollVideo({ renderMode: "frames", src: "nope", scenes: [{ start: 9, end: 2 }] });
    expect(issues.length).toBeGreaterThan(0);
    issues.forEach((issue) => {
      expect(typeof issue.message).toBe("string");
      expect(issue.message.length).toBeGreaterThan(8);
      expect(typeof issue.hint).toBe("string");
      expect(issue.hint.length).toBeGreaterThan(8);
    });
  });
});

/* --------------------------------------------------------------------- *
 * The section is bound through the same variable system as every other
 * block, rather than a second one of its own. These check that a scene's
 * heading and an overlay's text really are resolved, because a nested list
 * is exactly where a prop resolver quietly stops recursing.
 * --------------------------------------------------------------------- */
import { resolveProps } from "@/lib/cms/binding";

describe("scenes and overlays go through the existing variable system", () => {
  const ctx = { site: { name: "Ababeel Safety" }, programmeCount: 20, course: { name: "IOSH Managing Safely" } };

  test("a scene's heading, text and button resolve", () => {
    const out = resolveProps(
      {
        scenes: [
          { heading: "{{site.name}}", text: "{{programmeCount}} programmes", ctaLabel: "See {{course.name}}", start: "0", end: "50" },
        ],
      },
      ctx
    );
    expect(out.scenes[0].heading).toBe("Ababeel Safety");
    expect(out.scenes[0].text).toBe("20 programmes");
    expect(out.scenes[0].ctaLabel).toBe("See IOSH Managing Safely");
    // Everything else survives untouched.
    expect(out.scenes[0].start).toBe("0");
  });

  test("an overlay layer resolves too", () => {
    const out = resolveProps({ overlays: [{ kind: "text", text: "{{site.name}}", fromY: "-20" }] }, ctx);
    expect(out.overlays[0].text).toBe("Ababeel Safety");
    expect(out.overlays[0].fromY).toBe("-20");
  });

  test("a formula works inside a scene", () => {
    const out = resolveProps({ scenes: [{ heading: "{{= programmeCount * 2 }} courses" }] }, ctx);
    expect(out.scenes[0].heading).toBe("40 courses");
  });

  test("the ordered frame list is not mangled by resolution", () => {
    // `frames` is an array of plain URLs. A resolver that stringified arrays
    // would silently empty the sequence and the section would show nothing.
    const frames = ["/uploads/scroll-frames/x/frame-000001.webp", "/uploads/scroll-frames/x/frame-000002.webp"];
    const out = resolveProps({ renderMode: "frames", frames, frameCount: "2" }, ctx);
    expect(out.frames).toEqual(frames);
    expect(resolveSource(out).frameCount).toBe(2);
  });
});

describe("a long sequence is flagged for what it costs on a phone", () => {
  const many = Array.from({ length: 120 }, (_, i) => `/uploads/scroll-frames/x/frame-${i}.webp`);

  test("120 frames with no mobile plan is a warning, not an error", () => {
    const issues = validateScrollVideo({ renderMode: "frames", frames: many, poster: "/p.webp", title: "x" });
    const weight = issues.find((i) => /heavy download/.test(i.message));
    expect(weight).toBeDefined();
    expect(weight.level).toBe("warning");
    expect(weight.hint).toMatch(/poster/i);
  });

  test("choosing a lighter mobile option clears it", () => {
    const issues = validateScrollVideo({
      renderMode: "frames", frames: many, poster: "/p.webp", title: "x", mobileMode: "poster",
    });
    expect(issues.find((i) => /heavy download/.test(i.message))).toBeUndefined();
  });

  test("a short sequence is never flagged", () => {
    const few = many.slice(0, 26);
    const issues = validateScrollVideo({ renderMode: "frames", frames: few, poster: "/p.webp", title: "x" });
    expect(issues.find((i) => /heavy download/.test(i.message))).toBeUndefined();
  });
});

describe("a video format the browser cannot play", () => {
  test("a QuickTime source is flagged with what to do about it", () => {
    const issues = validateScrollVideo({ src: "/uploads/cms/clip.mov", poster: "/p.webp", title: "x" });
    const mov = issues.find((i) => /QuickTime/.test(i.message));
    expect(mov).toBeDefined();
    expect(mov.hint).toMatch(/HEVC/);
  });

  test("an ordinary MP4 is not flagged", () => {
    const issues = validateScrollVideo({ src: "/uploads/cms/clip.mp4", poster: "/p.webp", title: "x" });
    expect(issues.find((i) => /QuickTime/.test(i.message))).toBeUndefined();
  });
});
