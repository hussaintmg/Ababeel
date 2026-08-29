/**
 * The report that says why a section is not playing.
 *
 * The route itself needs a database and an owner session, so what is tested
 * here is the judgement it makes — the part that has to be right, because a
 * report that says "nothing obviously wrong" about a broken section is worse
 * than no report at all.
 */
import { resolveSource, validateScrollVideo, sceneRange } from "@/Components/cms/ScrollVideo";

const framesOf = (n) => Array.from({ length: n }, (_, i) => `/uploads/scroll-frames/x/frame-${String(i + 1).padStart(6, "0")}.webp`);

describe("what the section will actually render", () => {
  test("a block set to video reports video, however many frames it also carries", () => {
    // The commonest cause of "it does not play": the block was left on video.
    const s = resolveSource({ renderMode: "video", src: "/uploads/cms/clip.mp4", frames: framesOf(120) });
    expect(s.kind).toBe("video");
  });

  test("a block set to frames reports frames", () => {
    expect(resolveSource({ renderMode: "frames", frames: framesOf(120) }).kind).toBe("frames");
  });

  test("a block with nothing usable says so rather than looking fine", () => {
    expect(resolveSource({ renderMode: "frames", frames: [] }).kind).toBe("none");
  });
});

describe("an element built on the timeline is not reported as broken", () => {
  // The bug this covers: the timeline writes frames and leaves the percentages
  // empty, the validator read those empty strings as numbers, and a perfectly
  // good element came back as "starts at 0% and ends at 0%".
  const timelineScene = {
    startFrame: "1", endFrame: "25", start: "", end: "", heading: "HI",
    animation: "fade-up", exitAnimation: "same", ease: "power2.out",
    distance: "40", position: "center", align: "center", visibility: "both", textColor: "#ffffff",
  };
  const props = { renderMode: "frames", frames: framesOf(120), frameCount: "120", scenes: [timelineScene] };

  test("no error about its range", () => {
    const errors = validateScrollVideo(props).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });

  test("and nothing claims it is on for 0% to 0%", () => {
    expect(validateScrollVideo(props).map((i) => i.message).join(" ")).not.toMatch(/0% and ends at 0%/);
  });

  test("its range really is the frames it names", () => {
    const r = sceneRange(timelineScene, 120);
    expect(r.start).toBe(0);
    expect(r.end).toBeCloseTo(24 / 119);
  });
});

describe("a poster is only asked for when something actually needs one", () => {
  test("a frame sequence is not nagged — its own first frame is the fallback", () => {
    const issues = validateScrollVideo({ renderMode: "frames", frames: framesOf(30), title: "x" });
    expect(issues.find((i) => /No poster/.test(i.message))).toBeUndefined();
  });

  test("a video still is, because without one it starts black", () => {
    const issues = validateScrollVideo({ renderMode: "video", src: "/uploads/cms/clip.mp4", title: "x" });
    expect(issues.find((i) => /No poster/.test(i.message))).toBeDefined();
  });
});

describe("frame ranges that really are wrong are still caught", () => {
  const withScene = (scene) => validateScrollVideo({ renderMode: "frames", frames: framesOf(120), scenes: [scene] });

  test("an element on for a single frame", () => {
    const e = withScene({ startFrame: "40", endFrame: "40", heading: "Blink" }).find((i) => i.level === "error");
    expect(e.message).toMatch(/single frame/);
  });

  test("an element whose frames run backwards", () => {
    const e = withScene({ startFrame: "80", endFrame: "20", heading: "Back" }).find((i) => i.level === "error");
    expect(e.message).toMatch(/frame 80 back to frame 20/);
  });

  test("an element reaching past the end of the sequence", () => {
    const w = withScene({ startFrame: "1", endFrame: "900", heading: "Long" }).find((i) => /outside frames/.test(i.message));
    expect(w.level).toBe("warning");
  });

  test("two elements that overlap are compared on the same scale", () => {
    const issues = validateScrollVideo({
      renderMode: "frames", frames: framesOf(120), poster: "", title: "x",
      scenes: [
        { startFrame: "1", endFrame: "60", heading: "A" },
        { startFrame: "20", endFrame: "100", heading: "B" },
      ],
    });
    expect(issues.find((i) => /overlap/.test(i.message))).toBeDefined();
  });

  test("elements that hand over cleanly are not flagged", () => {
    const issues = validateScrollVideo({
      renderMode: "frames", frames: framesOf(120), title: "x",
      scenes: [
        { startFrame: "1", endFrame: "40", heading: "A" },
        { startFrame: "45", endFrame: "80", heading: "B" },
      ],
    });
    expect(issues.find((i) => /overlap/.test(i.message))).toBeUndefined();
  });
});
