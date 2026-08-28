"use client";

/**
 * Video metadata read straight off the element: duration, dimensions, aspect
 * ratio and — where the browser exposes per-frame callbacks — the real frame
 * rate and frame count, so the builder timeline reflects the actual file
 * rather than an assumed 30fps.
 */

import { useEffect, useState } from "react";

export default function useVideoMeta(videoRef, src) {
  const [meta, setMeta] = useState({ duration: 0, width: 0, height: 0, aspect: 0, fps: 0, frames: 0, ready: false });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let cancelled = false;
    let rvfcHandle = null;

    const measureFps = () => {
      if (typeof video.requestVideoFrameCallback !== "function") return;
      let first = null;
      const step = (now, info) => {
        if (cancelled) return;
        if (!first) {
          first = info;
          rvfcHandle = video.requestVideoFrameCallback(step);
          return;
        }
        const dt = info.mediaTime - first.mediaTime;
        const df = info.presentedFrames - first.presentedFrames;
        if (dt > 0.2 && df > 3) {
          const fps = Math.round(df / dt);
          setMeta((m) => ({ ...m, fps, frames: Math.round(m.duration * fps) }));
          return;
        }
        rvfcHandle = video.requestVideoFrameCallback(step);
      };
      rvfcHandle = video.requestVideoFrameCallback(step);
    };

    const onLoaded = () => {
      if (cancelled) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      setMeta((m) => ({
        ...m,
        duration,
        width,
        height,
        aspect: height ? width / height : 0,
        // Until a real measurement arrives, 30fps is the safe assumption used
        // only to draw the timeline ticks.
        fps: m.fps || 30,
        frames: Math.round(duration * (m.fps || 30)),
        ready: duration > 0,
      }));
      measureFps();
    };

    if (video.readyState >= 1) onLoaded();
    video.addEventListener("loadedmetadata", onLoaded);
    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onLoaded);
      if (rvfcHandle && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(rvfcHandle);
      }
    };
  }, [videoRef, src]);

  return meta;
}
