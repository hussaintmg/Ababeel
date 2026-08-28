import { parseFfmpegReport } from "@/lib/cms/frameSources";

// A real report, trimmed. ffmpeg writes this to stderr and exits non-zero when
// no output file is given, which is how a host without ffprobe gets its numbers.
const REPORT = `
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'clip.mp4':
  Metadata:
    major_brand     : isom
  Duration: 00:01:23.45, start: 0.000000, bitrate: 2500 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1920x1080 [SAR 1:1 DAR 16:9], 2400 kb/s, 29.97 fps, 29.97 tbr, 30k tbn (default)
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s (default)
At least one output file must be specified
`;

describe("reading a video's numbers from ffmpeg's report", () => {
  test("pulls duration, dimensions and frame rate", () => {
    const m = parseFfmpegReport(REPORT);
    expect(m.duration).toBeCloseTo(83.45, 2);
    expect(m.width).toBe(1920);
    expect(m.height).toBe(1080);
    expect(m.fps).toBeCloseTo(29.97, 2);
    expect(m.frames).toBe(Math.round(83.45 * 29.97));
  });

  test("takes the video stream's size, not the audio line", () => {
    const m = parseFfmpegReport(REPORT);
    expect(m.width).toBe(1920);
    expect(m.height).not.toBe(48000);
  });

  test("a whole-second duration parses", () => {
    expect(parseFfmpegReport("Duration: 00:00:07.00, start: 0").duration).toBeCloseTo(7, 3);
    expect(parseFfmpegReport("Duration: 01:02:03.50,").duration).toBeCloseTo(3723.5, 2);
  });

  test("unreadable output yields zeros rather than throwing", () => {
    expect(parseFfmpegReport("no such file")).toEqual({ duration: 0, width: 0, height: 0, fps: 0, frames: 0 });
    expect(parseFfmpegReport("")).toEqual({ duration: 0, width: 0, height: 0, fps: 0, frames: 0 });
  });
});
