/**
 * A host with no system ffmpeg and no ffprobe — which is most shared hosting,
 * and was the reason video upload simply did not work there.
 *
 * PATH is emptied so nothing can be found on it, then the whole video path is
 * exercised: find the binary, read the clip's numbers, extract frames.
 */
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const run = promisify(execFile);
let dir;
let clip;

beforeAll(async () => {
  const ffmpeg = (await import("ffmpeg-static")).default;
  dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ffm-test-"));
  clip = path.join(dir, "clip.webm");
  // VP9 rather than H.264: no codec licensing worries in a test fixture.
  await run(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", "testsrc=size=640x360:rate=15:duration=4",
    "-c:v", "libvpx-vp9", "-b:v", "300k", clip,
  ], { timeout: 120000 });
}, 180000);

afterAll(async () => {
  if (dir) await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
});

describe("video extraction on a host with no system ffmpeg", () => {
  const realPath = process.env.PATH;
  beforeAll(() => { process.env.PATH = "/nonexistent"; });
  afterAll(() => { process.env.PATH = realPath; });

  test("ffmpeg is found through the npm package instead", async () => {
    const { checkFfmpeg } = await import("@/lib/cms/frameSources");
    const caps = await checkFfmpeg();
    expect(caps.available).toBe(true);
    expect(caps.version).toContain("ffmpeg-static");
    expect(caps.reason).toBe("");
  });

  test("the clip is measured without ffprobe", async () => {
    const { probeVideo } = await import("@/lib/cms/frameSources");
    const meta = await probeVideo(clip);
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(360);
    expect(meta.duration).toBeGreaterThan(3.5);
    expect(meta.fps).toBeGreaterThan(10);
  }, 60000);
});
