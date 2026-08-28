"use client";

/**
 * Scroll Video section.
 *
 * The section reserves a tall scroll track; inside it a sticky viewport-height
 * stage pins the video while the page scrolls past. Scroll progress is mapped
 * onto `video.currentTime`, so the frames advance as you scroll and the section
 * releases once the last frame is reached.
 *
 * Performance notes (this is the whole reason it does not use a frame-image
 * sequence): one HTML5 <video> element is downloaded, nothing is rasterised,
 * scroll listeners are passive, all seeking happens inside a single
 * requestAnimationFrame loop that only runs while the section is on screen
 * (IntersectionObserver), and the loop exits as soon as the target time is
 * reached so an idle sticky section costs nothing.
 */

import { useEffect, useRef, useState, useCallback } from "react";

export const SCROLL_MODES = [
  { value: "scrub", label: "Frame scrubbing" },
  { value: "reverse", label: "Reverse playback" },
  { value: "pingpong", label: "Ping pong" },
  { value: "loop", label: "Loop while scrolling" },
];

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Scroll progress of the track through its viewport, 0–1.
 *
 * `viewTop`/`viewHeight` describe whatever the section scrolls inside: the
 * browser viewport on a public page, or the builder's preview pane. Keeping
 * this pure makes the mapping testable without a DOM.
 */
export function computeProgress({ rectTop, rectHeight, viewTop = 0, viewHeight }) {
  const total = rectHeight - viewHeight;
  if (total <= 0) return 0;
  return clamp((viewTop - rectTop) / total, 0, 1);
}

/** Nearest scrollable ancestor, or null when the section scrolls with the page. */
function findScrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Map raw 0–1 scroll progress onto the configured playback range and mode. */
export function mapProgress(raw, { mode = "scrub", startOffset = 0, endOffset = 100, speed = 1, reverse = false, loops = 1 } = {}) {
  let p = clamp(raw, 0, 1);
  const sp = Number(speed) || 1;
  if (sp !== 1) p = clamp(p * sp, 0, 1);

  if (mode === "pingpong") p = p <= 0.5 ? p * 2 : (1 - p) * 2;
  if (mode === "loop") {
    const n = Math.max(parseInt(loops, 10) || 1, 1);
    p = (p * n) % 1;
  }
  if (reverse || mode === "reverse") p = 1 - p;

  const start = clamp((Number(startOffset) || 0) / 100, 0, 1);
  const end = clamp(endOffset === "" || endOffset === undefined ? 1 : Number(endOffset) / 100, 0, 1);
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  return lo + p * (hi - lo);
}

/**
 * Video metadata read straight off the element: duration, dimensions, aspect
 * ratio and — where the browser exposes per-frame callbacks — the real frame
 * rate and frame count, so the builder timeline reflects the actual file.
 */
export function useVideoMeta(videoRef, src) {
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

/** URL of frame `index` in a sequence (matches lib/cms/frames.js naming). */
export function frameUrl(id, index, ext = "webp") {
  return `/uploads/cms/frames/${id}/${String(index + 1).padStart(4, "0")}.${ext}`;
}

/**
 * Loads a frame sequence and keeps the decoded images in a ref.
 *
 * Frames are fetched a few at a time, first-frame first, so something is on
 * screen almost immediately and the rest fill in while the visitor reads the
 * section above. Nothing here re-renders React — the draw loop reads the ref.
 */
function useFrameSequence({ id, count, ext, enabled, onFirstFrame }) {
  const imagesRef = useRef([]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  // Reset counters when the sequence itself changes, derived during render
  // rather than from the effect so there is no extra render pass.
  const key = `${id || ""}:${count || 0}`;
  const [seqKey, setSeqKey] = useState(key);
  if (key !== seqKey) {
    setSeqKey(key);
    setLoaded(0);
    setReady(false);
  }

  useEffect(() => {
    if (!enabled || !id || !count) return undefined;
    let cancelled = false;
    const images = new Array(count).fill(null);
    imagesRef.current = images;

    let done = 0;
    let next = 0;
    const CONCURRENCY = 6;

    const loadOne = (index) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return resolve();
          images[index] = img;
          done += 1;
          setLoaded(done);
          if (index === 0) {
            setReady(true);
            onFirstFrame?.();
          }
          resolve();
        };
        // A missing frame must not stall the sequence; the draw step falls
        // back to the nearest frame it does have.
        img.onerror = () => resolve();
        img.src = frameUrl(id, index, ext);
      });

    const pump = async () => {
      while (!cancelled && next < count) {
        const index = next;
        next += 1;
        await loadOne(index);
      }
    };

    // Frame 0 first so the section is never blank, then the rest in parallel.
    loadOne(0).then(() => {
      next = 1;
      for (let i = 0; i < CONCURRENCY; i++) pump();
    });

    return () => {
      cancelled = true;
      imagesRef.current = [];
    };
  }, [id, count, ext, enabled, onFirstFrame]);

  return { imagesRef, loaded, ready };
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ScrollVideo({ p = {}, builderProgress = null, radius = "" }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const visibleRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef(null);
  const meta = useVideoMeta(videoRef, p.src);

  const desktopSrc = p.src || "";
  const mobileSrc = p.mobileSrc || "";
  const src = isMobile && mobileSrc ? mobileSrc : desktopSrc;

  // Frame-sequence mode: the decoder is out of the scroll path entirely, so
  // scrubbing is instant instead of waiting on a seek.
  const framesId = p.framesId || "";
  const frameCount = parseInt(p.frameCount, 10) || 0;
  const usesFrames = p.renderMode === "frames" && !!framesId && frameCount > 1;
  const { imagesRef, loaded: framesLoaded, ready: framesReady } = useFrameSequence({
    id: framesId,
    count: frameCount,
    ext: p.frameExt || "webp",
    enabled: usesFrames,
  });

  const trackHeight = p.height || "300vh";
  const stageHeight = p.stageHeight || "100vh";
  const sticky = p.sticky !== false;
  const fit = p.fit === "contain" ? "contain" : "cover";
  const smoothing = clamp(Number(p.smoothing ?? 0.18) || 0.18, 0.02, 1);

  /* ---- responsive + reduced motion ---- */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mqMobile = window.matchMedia("(max-width: 768px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setIsMobile(mqMobile.matches);
      setReduced(mqMotion.matches);
    };
    sync();
    mqMobile.addEventListener?.("change", sync);
    mqMotion.addEventListener?.("change", sync);
    return () => {
      mqMobile.removeEventListener?.("change", sync);
      mqMotion.removeEventListener?.("change", sync);
    };
  }, []);

  /* ---- drawing one frame of the sequence onto the canvas ---- */
  const drawFrame = useCallback(
    (position) => {
      const canvas = canvasRef.current;
      const images = imagesRef.current;
      if (!canvas || !images?.length) return;

      const index = clamp(Math.round(position * (frameCount - 1)), 0, frameCount - 1);
      let img = images[index];
      // Not downloaded yet → show the nearest earlier frame rather than a gap.
      if (!img) {
        for (let j = index - 1; j >= 0; j--) {
          if (images[j]) {
            img = images[j];
            break;
          }
        }
      }
      if (!img) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) return;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
      }

      const ctx = canvas.getContext("2d");
      const scale =
        fit === "contain"
          ? Math.min(canvas.width / img.width, canvas.height / img.height)
          : Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    },
    [imagesRef, frameCount, fit]
  );

  /* ---- the seek loop ---- */
  // One rAF loop, started only when the target moves and stopped the moment it
  // is reached — an idle sticky section costs nothing.
  const tick = useCallback(() => {
    const step = () => {
      rafRef.current = 0;

      // Ease towards the target so a fast flick does not produce a hard jump.
      const diff = targetRef.current - currentRef.current;
      currentRef.current += diff * smoothing;
      if (Math.abs(diff) < 0.0008) currentRef.current = targetRef.current;

      if (usesFrames) {
        drawFrame(currentRef.current);
      } else {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
        const time = clamp(currentRef.current * video.duration, 0, Math.max(video.duration - 0.02, 0));
        if (video.readyState >= 1 && Math.abs(video.currentTime - time) > 0.008) {
          try {
            video.currentTime = time;
          } catch {
            /* seeking before the browser is ready — the next frame retries */
          }
        }
      }

      if (currentRef.current !== targetRef.current && visibleRef.current) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    step();
  }, [smoothing, usesFrames, drawFrame]);

  const schedule = useCallback(
    (raw) => {
      const mapped = mapProgress(raw, {
        mode: p.mode,
        startOffset: p.startOffset,
        endOffset: p.endOffset,
        speed: p.speed,
        reverse: p.reverse,
        loops: p.loops,
      });
      targetRef.current = mapped;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    },
    [p.mode, p.startOffset, p.endOffset, p.speed, p.reverse, p.loops, tick]
  );

  /* ---- scroll driving ---- */
  useEffect(() => {
    if (builderProgress !== null) return undefined; // builder scrubber owns it
    const wrap = wrapRef.current;
    if (!wrap || typeof window === "undefined") return undefined;

    // The section may scroll inside the page or inside the builder's preview
    // pane; measure against whichever actually scrolls it.
    const scroller = findScrollParent(wrap);
    const compute = () => {
      const rect = wrap.getBoundingClientRect();
      const view = scroller
        ? { top: scroller.getBoundingClientRect().top, height: scroller.clientHeight }
        : { top: 0, height: window.innerHeight };
      return computeProgress({
        rectTop: rect.top,
        rectHeight: rect.height,
        viewTop: view.top,
        viewHeight: view.height,
      });
    };

    const onScroll = () => {
      if (!visibleRef.current) return;
      const raw = compute();
      setProgress(raw);
      schedule(raw);
    };

    // Only run while the section is on screen.
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                visibleRef.current = e.isIntersecting;
                const video = videoRef.current;
                if (e.isIntersecting) {
                  onScroll();
                } else if (video && p.pauseOutside !== false && !video.paused) {
                  video.pause();
                }
              });
            },
            { root: scroller, rootMargin: "100px 0px" }
          )
        : null;
    if (io) io.observe(wrap);
    else visibleRef.current = true;

    // Capture phase: `scroll` does not bubble, so this is what lets a section
    // inside the builder's preview pane be driven by that pane's scrolling.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      io?.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [schedule, builderProgress, p.pauseOutside]);

  /* ---- builder scrubber ---- */
  // The scrubber owns the value, so it drives the video directly rather than
  // being mirrored into state.
  useEffect(() => {
    if (builderProgress === null) return;
    visibleRef.current = true;
    schedule(builderProgress);
  }, [builderProgress, schedule]);

  // Redraw as frames arrive and when the stage is resized, so a late frame
  // replaces the stand-in and the canvas stays sharp.
  useEffect(() => {
    if (!usesFrames) return undefined;
    drawFrame(currentRef.current);
    const onResize = () => drawFrame(currentRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [usesFrames, drawFrame, framesLoaded]);

  const shownProgress = builderProgress === null ? progress : builderProgress;

  const hasVideo = !!src;
  const reducedFallback = reduced && p.respectReducedMotion !== false;
  const hasSource = hasVideo || usesFrames;

  /* ---- reduced motion: one still frame, no scroll hijacking, no playback ----
     The point of this branch is *less* motion. It shows the poster when there
     is one and otherwise holds the video on a single frame — it must never
     autoplay or loop, which would be more motion than the scroll version. */
  if (reducedFallback) {
    return (
      <section className="relative w-full overflow-hidden" style={{ minHeight: stageHeight }}>
        {p.poster ? (
          <img src={p.poster} alt={p.title || ""} className="w-full h-full object-cover" style={{ minHeight: stageHeight }} />
        ) : usesFrames ? (
          <img
            src={frameUrl(framesId, 0, p.frameExt || "webp")}
            alt={p.title || ""}
            className="w-full h-full object-cover"
            style={{ minHeight: stageHeight }}
          />
        ) : hasVideo ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full object-cover"
            style={{ minHeight: stageHeight, objectFit: fit }}
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            preload="metadata"
            onLoadedMetadata={(e) => {
              // Park on the frame the section is configured to start from, so
              // the fallback is a real picture rather than a black box.
              const v = e.currentTarget;
              const start = clamp((Number(p.startOffset) || 0) / 100, 0, 1);
              try {
                v.currentTime = Math.min(start * v.duration, Math.max(v.duration - 0.05, 0));
              } catch {
                /* some browsers refuse to seek this early; the poster frame stands */
              }
            }}
          />
        ) : null}
        <Overlay p={p} />
      </section>
    );
  }

  return (
    <section
      ref={wrapRef}
      className="relative w-full"
      style={{ height: hasVideo || usesFrames ? trackHeight : stageHeight }}
      data-cms-scroll-video=""
    >
      <div
        className="overflow-hidden"
        style={{
          position: sticky ? "sticky" : "relative",
          top: 0,
          height: stageHeight,
          backgroundColor: p.bgColor || "#000",
          borderRadius: radius ? `${parseInt(radius, 10) || 0}px` : undefined,
        }}
      >
        {usesFrames ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              aria-label={p.title || "Scroll-driven animation"}
              role="img"
            />
            {/* Poster stays underneath until the first frame has decoded, so
                the section never shows an empty box on a slow connection. */}
            {!framesReady && p.poster ? (
              <img src={p.poster} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />
            ) : null}
            {p.showProgress && framesLoaded < frameCount ? (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
                <div
                  className="h-full bg-white/50 transition-[width] duration-200"
                  style={{ width: `${Math.round((framesLoaded / frameCount) * 100)}%` }}
                />
              </div>
            ) : null}
          </>
        ) : hasVideo ? (
          <video
            ref={videoRef}
            key={src}
            src={src}
            poster={p.poster || undefined}
            className="w-full h-full"
            style={{ objectFit: fit }}
            muted
            playsInline
            preload={p.preload || "auto"}
            // Scroll drives currentTime; the element itself never plays.
            autoPlay={false}
            controls={false}
            disablePictureInPicture
            aria-label={p.title || "Scroll-driven video"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
            Select a video for this section
          </div>
        )}
        <Overlay p={p} progress={shownProgress} />
        {p.showProgress ? (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
            <div className="h-full bg-white/80 transition-[width] duration-75" style={{ width: `${Math.round(shownProgress * 100)}%` }} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Optional caption/heading layer pinned over the video. */
function Overlay({ p, progress = 0 }) {
  if (!p.title && !p.subtitle && !p.overlay) return null;
  const dim = p.overlay ? clamp(parseInt(p.overlay, 10) || 0, 0, 100) / 100 : 0;
  const align = p.textAlign === "left" ? "items-start text-left" : p.textAlign === "right" ? "items-end text-right" : "items-center text-center";
  const fade = p.fadeText ? clamp(1 - Math.abs(progress - 0.5) * 2.2, 0, 1) : 1;
  return (
    <>
      {dim > 0 ? <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${dim})` }} /> : null}
      {p.title || p.subtitle ? (
        <div
          className={`absolute inset-0 flex flex-col justify-center px-6 pointer-events-none ${align}`}
          style={{ color: p.textColor || "#fff", opacity: fade }}
        >
          {p.title ? <h2 className="text-3xl md:text-5xl font-bold max-w-3xl drop-shadow">{p.title}</h2> : null}
          {p.subtitle ? <p className="mt-4 text-base md:text-xl opacity-90 max-w-2xl drop-shadow">{p.subtitle}</p> : null}
        </div>
      ) : null}
    </>
  );
}
