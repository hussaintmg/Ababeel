"use client";

/**
 * Scroll Video section.
 *
 * The section reserves a tall scroll track; inside it a sticky viewport-height
 * stage pins the video while the page scrolls past. Scroll progress is mapped
 * onto `video.currentTime`, so the frames advance as you scroll and the section
 * releases once the last frame is reached.
 *
 * Two things make that a real lock rather than a hope. The track is pinned by
 * `position: sticky`, so the page physically cannot reach the next section
 * before it has scrolled the whole track — every frame gets its own scroll
 * distance. And a single flick of a trackpad can otherwise cover that whole
 * track in one event, so while the stage is pinned each gesture is clamped to a
 * small step (see useScrollLock): the animation plays through from the first
 * frame to the last instead of being skipped. The clamp releases the moment the
 * animation reaches either end, and gives up entirely if the page stops
 * responding to it, so a visitor can never be trapped in the section.
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
 * Most scroll a single wheel notch or touch move may cover while the stage is
 * pinned. Roughly one notch on a mouse; a trackpad flick that would otherwise
 * jump 800px in one event is spread over the frames instead.
 */
const MAX_STEP_PX = 90;

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
/**
 * Order frames should be fetched in, given where the viewer currently is.
 *
 *   current frame → the window around it → outward → everything else
 *
 * Loading 1..N in order is wrong for a visitor who lands mid-section: they wait
 * for frames they have already scrolled past. Exported for testing.
 */
export function loadOrder(count, current = 0, window = 20) {
  const order = [];
  const seen = new Set();
  const push = (i) => {
    if (i >= 0 && i < count && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(current);
  for (let d = 1; d <= window; d++) {
    push(current + d);
    push(current - d);
  }
  // The first frame matters even when the viewer starts elsewhere: it is what
  // anyone scrolling back up sees.
  push(0);
  for (let i = 0; i < count; i++) push(i);
  return order;
}

function useFrameSequence({ id, count, ext, enabled, onFirstFrame, urls }) {
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
    // A sequence is addressed either by id (frames generated into a known
    // directory) or by an explicit URL list (a saved scroll animation). Either
    // is enough; requiring the id silently disabled the URL-list case.
    if (!enabled || !count || (!id && !urls?.length)) return undefined;
    let cancelled = false;
    const images = new Array(count).fill(null);
    imagesRef.current = images;

    let done = 0;
    // A phone has far less headroom than a laptop; fetch fewer at once there.
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    const memoryGb = typeof navigator !== "undefined" ? navigator.deviceMemory || 4 : 4;
    const CONCURRENCY = mobile || memoryGb <= 2 ? 3 : 6;

    const srcFor = (index) => (urls?.length ? urls[index] : frameUrl(id, index, ext));

    const loadOne = (index) =>
      new Promise((resolve) => {
        if (cancelled || images[index]) return resolve();
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return resolve();
          images[index] = img;
          done += 1;
          setLoaded(done);
          if (!images.__firstReported) {
            images.__firstReported = true;
            setReady(true);
            onFirstFrame?.();
          }
          resolve();
        };
        // A missing frame must not stall the sequence; the draw step falls
        // back to the nearest frame it does have.
        img.onerror = () => resolve();
        img.src = srcFor(index);
      });

    // Re-planned whenever the viewer moves far from where the queue was built,
    // so the frames nearest the current position always come first.
    let queue = loadOrder(count, 0);
    let cursor = 0;
    const pump = async () => {
      while (!cancelled && cursor < queue.length) {
        const index = queue[cursor];
        cursor += 1;
        await loadOne(index);
      }
    };

    loadOne(0).then(() => {
      for (let i = 0; i < CONCURRENCY; i++) pump();
    });

    // The draw loop calls this as the viewer scrolls.
    imagesRef.reprioritize = (current) => {
      if (cancelled || cursor >= queue.length) return;
      queue = loadOrder(count, current).filter((i) => !images[i]);
      cursor = 0;
    };

    return () => {
      cancelled = true;
      imagesRef.reprioritize = null;
      imagesRef.current = [];
    };
  }, [id, count, ext, enabled, onFirstFrame, urls]);

  return { imagesRef, loaded, ready };
}

/**
 * Should this scroll gesture be held back, and by how much?
 *
 *   handled === false → leave the gesture alone entirely. That covers a stage
 *   that is not pinned, and — the important one — an animation already at the
 *   end it is being scrolled towards, which is what releases the page onward
 *   once the last frame has been reached (or back up from the first).
 *
 * Split out from the listener so the decision can be tested without a DOM.
 */
export function lockStep({ delta, progress, pinned }) {
  if (!pinned || !delta) return { handled: false, step: 0 };
  if (delta > 0 && progress >= 0.999) return { handled: false, step: 0 };
  if (delta < 0 && progress <= 0.001) return { handled: false, step: 0 };
  return { handled: true, step: clamp(delta, -MAX_STEP_PX, MAX_STEP_PX) };
}

/**
 * Keeps the page inside a pinned section until its animation has played out.
 *
 * `position: sticky` already guarantees the scroll distance exists; what it
 * cannot do is stop one flick from consuming all of it, which is how a
 * scroll-driven section ends up looking like it "jumped to the next section".
 * So while the stage is pinned and the animation is part-way through, each
 * wheel or touch gesture is clamped to MAX_STEP_PX and applied by hand.
 *
 * Deliberate escape hatches, so this can never trap anyone:
 *   • at either end of the animation the gesture is left alone, which is what
 *     lets the page move on once the last frame is reached (or back up out of
 *     the section from the first);
 *   • keyboard paging, the scrollbar and anchor jumps are untouched;
 *   • if the clamped scroll stops actually moving the page, the lock switches
 *     itself off for good.
 *
 * @param wrapRef      the track element
 * @param scroller     the scrolling ancestor, or null for the page
 * @param progressRef  live 0–1 scroll progress, written by the scroll handler
 * @param enabled      false for reduced motion, the builder, and video mode
 */
export function useScrollLock({ wrapRef, scroller, progressRef, enabled }) {
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!enabled || !wrap || typeof window === "undefined") return undefined;

    let surrendered = false;
    let lastTouchY = null;

    const scrollTop = () => (scroller ? scroller.scrollTop : window.scrollY);
    const viewHeight = () => (scroller ? scroller.clientHeight : window.innerHeight);

    // The stage is pinned exactly while the track spans the whole viewport.
    const pinned = () => {
      const rect = wrap.getBoundingClientRect();
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      return rect.top <= top + 1 && rect.bottom >= top + viewHeight() - 1;
    };

    const apply = (delta, event) => {
      if (surrendered) return;
      const { handled, step } = lockStep({ delta, progress: progressRef.current, pinned: pinned() });
      if (!handled) return;

      const before = scrollTop();
      event.preventDefault();
      if (scroller) scroller.scrollBy(0, step);
      else window.scrollBy(0, step);

      // Preventing the default and then failing to move would freeze the page;
      // one such gesture is enough to stop interfering.
      if (Math.abs(scrollTop() - before) < 0.5) surrendered = true;
    };

    const onWheel = (e) => {
      if (e.ctrlKey) return; // pinch-zoom
      apply(e.deltaY, e);
    };
    const onTouchStart = (e) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e) => {
      const y = e.touches[0]?.clientY;
      if (y == null || lastTouchY == null) return;
      const delta = lastTouchY - y;
      lastTouchY = y;
      apply(delta, e);
    };

    const target = scroller || window;
    target.addEventListener("wheel", onWheel, { passive: false });
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      target.removeEventListener("wheel", onWheel);
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
    };
  }, [wrapRef, scroller, progressRef, enabled]);
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
  // Raw 0–1 track progress, kept in a ref so the scroll lock can read it
  // without a render in between.
  const rawRef = useRef(0);
  const [scroller, setScroller] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef(null);
  const lastIndexRef = useRef(-1);
  const meta = useVideoMeta(videoRef, p.src);

  const desktopSrc = p.src || "";
  const mobileSrc = p.mobileSrc || "";
  const src = isMobile && mobileSrc ? mobileSrc : desktopSrc;
  const hasVideoSrc = !!src;

  // Frame-sequence mode: the decoder is out of the scroll path entirely, so
  // scrubbing is instant instead of waiting on a seek.
  const framesId = p.framesId || "";
  // A saved scroll animation supplies its ordered URLs directly; the older
  // in-block sequences are addressed by id + count. Both land here.
  const frameUrls = Array.isArray(p.frames) && p.frames.length > 1 ? p.frames : null;
  const frameCount = frameUrls ? frameUrls.length : parseInt(p.frameCount, 10) || 0;
  const usesFrames = p.renderMode === "frames" && frameCount > 1 && (!!framesId || !!frameUrls);
  const { imagesRef, loaded: framesLoaded, ready: framesReady } = useFrameSequence({
    id: framesId,
    count: frameCount,
    ext: p.frameExt || "webp",
    enabled: usesFrames,
    urls: frameUrls,
  });

  const stageHeight = p.stageHeight || "100vh";
  const sticky = p.sticky !== false;
  // Track length decides how much scrolling one playthrough costs. Left to the
  // author it is a guess; for a frame sequence the honest answer is a fixed
  // amount of scroll per frame on top of the pinned stage, so every frame is
  // actually seen however many there are.
  const pxPerFrame = clamp(Number(p.pxPerFrame) || 12, 2, 80);
  const trackHeight =
    p.height ||
    (usesFrames ? `calc(${stageHeight} + ${Math.round(frameCount * pxPerFrame)}px)` : "300vh");
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
      // Keep the download queue centred on where the viewer actually is.
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        imagesRef.reprioritize?.(index);
      }
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
      // At the two ends the easing is cut short instead: the first frame has to
      // be on screen the moment the stage pins, and the last frame has to be
      // reached before it releases — a tail of easing there would let the
      // section scroll away mid-animation.
      const target = targetRef.current;
      const atEnd = target <= 0.001 || target >= 0.999;
      const diff = target - currentRef.current;
      currentRef.current += diff * (atEnd ? Math.max(smoothing, 0.5) : smoothing);
      if (Math.abs(diff) < 0.0008 || (atEnd && Math.abs(diff) < 0.02)) {
        currentRef.current = target;
      }

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
    const found = findScrollParent(wrap);
    setScroller((prev) => (prev === found ? prev : found));
    const compute = () => {
      const rect = wrap.getBoundingClientRect();
      const view = found
        ? { top: found.getBoundingClientRect().top, height: found.clientHeight }
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
      rawRef.current = raw;
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
            { root: found, rootMargin: "100px 0px" }
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

  /* ---- keep the page inside the section until the last frame ---- */
  // Off under reduced motion and in the builder, where the scrubber owns the
  // position and hijacking the preview pane's scroll would fight the author.
  useScrollLock({
    wrapRef,
    scroller,
    progressRef: rawRef,
    enabled:
      p.lockScroll !== false &&
      sticky &&
      builderProgress === null &&
      !(reduced && p.respectReducedMotion !== false) &&
      (usesFrames || hasVideoSrc),
  });

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

  const hasVideo = hasVideoSrc;
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
            src={frameUrls ? frameUrls[0] : frameUrl(framesId, 0, p.frameExt || "webp")}
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
