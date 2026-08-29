"use client";

/**
 * Scroll Video section — the renderer.
 *
 * The section reserves a tall scroll track; inside it a pinned, viewport-height
 * stage holds the picture while the page scrolls past. Scroll progress drives
 * three things at once: the frame the video is showing, which scene is on
 * screen, and how far through its own animation each overlay is.
 *
 * The pin is what makes the animation unskippable, and it is enough on its
 * own: `position: sticky` means the page physically cannot reach the next
 * section before it has scrolled the whole track, so every frame has scroll
 * distance of its own. The section never interferes with the visitor's
 * scrolling to achieve that — an earlier version clamped each wheel and touch
 * gesture to a small step, which made the page feel like it was resisting and
 * solved nothing the track length does not already solve.
 *
 * Performance: one <video> or one image sequence, nothing rasterised ahead of
 * time, passive scroll listeners coalesced into a single rAF, the loop exits as
 * soon as the target is reached, and it only runs at all while the section is
 * on screen. An idle pinned section costs nothing.
 *
 * The rule this file is written to: **it must never render nothing.** Whatever
 * is missing — the video, the frames, the network — there is a fallback below
 * it, ending at the poster and the text. A blank black rectangle on a live page
 * is the one outcome that is not allowed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clamp,
  mapProgress,
  reducedMotionMode,
  resolveSource,
  trackHeightCss,
  frameUrl,
  nearestCoarseFrame,
  validateScrollVideo,
} from "./engine";
import useFrameSequence from "./useFrameSequence";
import useScrollController from "./useScrollController";
import VideoScene from "./VideoScene";
import VideoOverlay from "./VideoOverlay";

/** CSS filter string from the design controls. Empty when nothing is set. */
function videoFilter(p) {
  const parts = [];
  const add = (name, value, unit, neutral) => {
    if (value === "" || value == null) return;
    const n = Number(value);
    if (!Number.isFinite(n) || n === neutral) return;
    parts.push(`${name}(${n}${unit})`);
  };
  add("brightness", p.brightness, "%", 100);
  add("contrast", p.contrast, "%", 100);
  add("saturate", p.saturate, "%", 100);
  add("blur", p.videoBlur, "px", 0);
  return parts.join(" ") || undefined;
}

/** The tint or gradient laid over the picture, behind the text. */
function backgroundOverlay(p) {
  const kind = p.overlayType || (p.overlay ? "solid" : "none");
  if (kind === "none") return null;
  if (kind === "gradient") {
    return {
      backgroundImage: `linear-gradient(${parseInt(p.overlayAngle, 10) || 180}deg, ${p.overlayFrom || "rgba(0,0,0,0)"}, ${p.overlayTo || "rgba(0,0,0,0.7)"})`,
    };
  }
  const dim = clamp(parseInt(p.overlay, 10) || 0, 0, 100) / 100;
  if (dim <= 0) return null;
  return { backgroundColor: p.overlayColor ? p.overlayColor : `rgba(0,0,0,${dim})`, opacity: p.overlayColor ? dim : 1 };
}

export default function ScrollVideoRenderer({ p = {}, builderProgress = null, radius = "", showDiagnostics = false, forceDevice = null }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lastIndexRef = useRef(-1);
  const rawRef = useRef(0);
  const paintedRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);
  // A source that turns out not to be playable at all. The section falls back
  // rather than showing a dead <video>.
  const [videoBroken, setVideoBroken] = useState(false);
  // Whether the canvas has drawn a frame yet. Not the same as "a frame has
  // downloaded": on a cold cache there is a window where the element exists,
  // the scroll is already driving it, and it has painted nothing — a blank
  // rectangle where the section should be.
  const [painted, setPainted] = useState(false);

  /* ---- responsive + reduced motion ----
     `forceDevice` is the builder's Desktop/Mobile preview switch: it makes the
     preview render the mobile configuration on a wide screen, which is the only
     way to check the mobile setup without a phone. */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mqMobile = window.matchMedia("(max-width: 768px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setIsMobile(forceDevice ? forceDevice === "mobile" : mqMobile.matches);
      setReduced(mqMotion.matches);
    };
    sync();
    mqMobile.addEventListener?.("change", sync);
    mqMotion.addEventListener?.("change", sync);
    return () => {
      mqMobile.removeEventListener?.("change", sync);
      mqMotion.removeEventListener?.("change", sync);
    };
  }, [forceDevice]);

  const source = useMemo(() => resolveSource(p, { mobile: isMobile }), [p, isMobile]);
  const usesFrames = source.kind === "frames";
  const hasVideoSrc = source.kind === "video" && !videoBroken;
  const src = source.kind === "video" ? source.src : "";

  const frameCount = usesFrames ? source.frameCount : 0;
  const frameUrls = usesFrames ? source.frameUrls : null;
  const { imagesRef, loaded: framesLoaded, failed: framesFailed } = useFrameSequence({
    id: usesFrames ? source.framesId : "",
    count: frameCount,
    ext: usesFrames ? source.ext : "webp",
    enabled: usesFrames,
    urls: frameUrls,
  });

  /* ---- geometry ---- */
  // `svh` on mobile, because `vh` on a phone is the height with the browser
  // chrome hidden — a 100vh stage is taller than the screen until the address
  // bar rolls away, so the section starts off cut in half.
  const stageHeight = isMobile ? p.mobileStageHeight || "100svh" : p.stageHeight || "100vh";
  const sticky = p.sticky !== false && p.pin !== false;
  const motionMode = reducedMotionMode(p);
  const gentle = reduced && motionMode === "scrub";
  const reducedFallback = reduced && motionMode === "still";
  const smoothing = gentle ? 1 : clamp(Number(p.smoothing ?? 0.18) || 0.18, 0.02, 1);
  const fit = p.fit === "contain" ? "contain" : p.fit === "fill" ? "fill" : "cover";

  const trackHeight = trackHeightCss({
    scrollDuration: isMobile && p.mobileScrollDuration ? p.mobileScrollDuration : p.scrollDuration,
    height: p.height,
    stageHeight,
    usesFrames,
    frameCount,
    pxPerFrame: p.pxPerFrame,
  });

  const scenes = useMemo(() => (Array.isArray(p.scenes) ? p.scenes : []), [p.scenes]);
  const overlays = useMemo(() => (Array.isArray(p.overlays) ? p.overlays : []), [p.overlays]);
  const horizontal = p.direction === "horizontal";

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
      // Not downloaded yet → show the nearest frame we do have rather than a
      // gap. Searching both ways matters when the viewer lands mid-section.
      if (!img) {
        for (let d = 1; d < frameCount; d++) {
          if (images[index - d]) { img = images[index - d]; break; }
          if (images[index + d]) { img = images[index + d]; break; }
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
      paintedRef.current = true;
    },
    [imagesRef, frameCount, fit]
  );

  // Promoted out of the draw loop, which runs inside requestAnimationFrame and
  // must not touch React state on every frame.
  useEffect(() => {
    if (painted || !usesFrames) return undefined;
    const id = setInterval(() => {
      if (paintedRef.current) setPainted(true);
    }, 120);
    return () => clearInterval(id);
  }, [painted, usesFrames]);

  /* ---- the seek loop ----
     One rAF loop, started only when the target moves and stopped the moment it
     is reached, so an idle pinned section costs nothing. */
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
        // An optional trim: play only part of the file.
        const lo = Number(p.clipStart);
        const hi = Number(p.clipEnd);
        const from = Number.isFinite(lo) && lo > 0 ? Math.min(lo, video.duration) : 0;
        const to = Number.isFinite(hi) && hi > from ? Math.min(hi, video.duration) : video.duration;
        const time = clamp(from + currentRef.current * (to - from), 0, Math.max(video.duration - 0.02, 0));
        if (video.readyState >= 1 && Math.abs(video.currentTime - time) > 0.008) {
          try {
            video.currentTime = time;
          } catch {
            /* seeking before the browser is ready — the next frame retries */
          }
        }
      }

      if (currentRef.current !== targetRef.current) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    step();
  }, [smoothing, usesFrames, drawFrame, p.clipStart, p.clipEnd]);

  const schedule = useCallback(
    (raw) => {
      rawRef.current = raw;
      setProgress(raw);
      targetRef.current = mapProgress(raw, {
        mode: p.mode,
        startOffset: p.startOffset,
        endOffset: p.endOffset,
        speed: p.speed,
        reverse: p.reverse,
        loops: p.loops,
        ease: p.playbackEase,
        offset: p.offset,
      });
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    },
    [p.mode, p.startOffset, p.endOffset, p.speed, p.reverse, p.loops, p.playbackEase, p.offset, tick]
  );

  /* ---- scroll driving ---- */
  const controllerSettings = useMemo(
    () => ({
      start: p.scrollStart || "top top",
      end: p.scrollEnd || "bottom bottom",
      snap: !!p.snap && !reduced,
      snapDuration: p.snapDuration,
      scenes,
    }),
    [p.scrollStart, p.scrollEnd, p.snap, p.snapDuration, scenes, reduced]
  );

  const { diagnosis } = useScrollController({
    wrapRef,
    onProgress: schedule,
    enabled: builderProgress === null && p.scrollEnabled !== false && !reducedFallback,
    settings: controllerSettings,
  });

  /* ---- builder scrubber ----
     The scrubber owns the value, so it drives the picture directly rather than
     being mirrored into state. */
  useEffect(() => {
    if (builderProgress === null) return;
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

  // Stop the loop for good when the section goes away — a rAF left running
  // after a route change is a leak that survives the navigation.
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    },
    []
  );

  // Playback rate only means anything for the ambient (non-scrubbed) case, but
  // setting it is harmless and the property is exposed in the editor.
  useEffect(() => {
    const video = videoRef.current;
    const rate = Number(p.playbackRate);
    if (video && Number.isFinite(rate) && rate > 0) video.playbackRate = clamp(rate, 0.25, 4);
  }, [p.playbackRate, src]);

  const shownProgress = builderProgress === null ? progress : builderProgress;

  /**
   * The picture to show while the sequence is still downloading.
   *
   * This used to be frame one, always — which is why a section looked stuck on
   * its first frame: until enough images had decoded for the canvas to paint,
   * the visitor scrolled the whole section and the picture never moved. On a
   * fast connection that window is a second; on a phone, or with a heavy
   * sequence, it is the whole visit.
   *
   * It now follows the scroll. The frame is snapped to the coarse pass — the
   * dozen spread across the sequence that the loader fetches first — so the
   * picture moves with the scroll straight away without asking the server for
   * anything it was not already going to fetch. A poster, when the author set
   * one, still wins for the very first paint.
   */
  const loadingFrameSrc = (() => {
    if (!usesFrames) return p.poster || "";
    const index = nearestCoarseFrame(Math.round(shownProgress * (frameCount - 1)), frameCount);
    // A poster is the right thing to show before anything has moved; once the
    // visitor is into the section, the frame they scrolled to is.
    if (p.poster && index === 0) return p.poster;
    return frameUrls ? frameUrls[index] : frameUrl(source.framesId, index, source.ext);
  })();
  const problems = showDiagnostics ? validateScrollVideo(p) : [];
  const dim = backgroundOverlay(p);
  const filter = videoFilter(p);
  const stageRadius = radius ? `${parseInt(radius, 10) || 0}px` : p.radius ? `${parseInt(p.radius, 10) || 0}px` : undefined;

  /* ---- the content laid over the picture ---- */
  const content = (
    <>
      {dim ? <div className="absolute inset-0 pointer-events-none" style={{ ...dim, zIndex: 1 }} /> : null}

      {/* The legacy single title/subtitle. Still supported: every page saved
          before scenes existed uses it, and for a one-line caption it is the
          simplest thing that works. */}
      {p.title || p.subtitle ? (
        <div
          className={`absolute inset-0 flex flex-col justify-center px-6 pointer-events-none ${
            p.textAlign === "left" ? "items-start text-left" : p.textAlign === "right" ? "items-end text-right" : "items-center text-center"
          }`}
          style={{
            color: p.textColor || "#fff",
            opacity: p.fadeText ? clamp(1 - Math.abs(shownProgress - 0.5) * 2.2, 0, 1) : 1,
            zIndex: 2,
          }}
        >
          {p.title ? <h2 className="text-3xl md:text-5xl font-bold max-w-3xl drop-shadow">{p.title}</h2> : null}
          {p.subtitle ? <p className="mt-4 text-base md:text-xl opacity-90 max-w-2xl drop-shadow">{p.subtitle}</p> : null}
        </div>
      ) : null}

      {overlays.map((item, i) => (
        <VideoOverlay key={i} item={item} progress={shownProgress} reduced={gentle} />
      ))}

      {/* Horizontal direction lays the scenes out on a rail and slides the rail
          across as the visitor scrolls down — the scroll axis is still the
          page's, which is what keeps it usable on a trackpad and a phone. */}
      {horizontal && scenes.length ? (
        <div
          className="absolute inset-0 flex"
          style={{
            width: `${scenes.length * 100}%`,
            transform: `translate3d(${-shownProgress * (scenes.length - 1) * (100 / scenes.length)}%, 0, 0)`,
            transition: "transform 80ms linear",
            zIndex: 3,
          }}
        >
          {scenes.map((scene, i) => (
            <div key={i} className="relative h-full" style={{ width: `${100 / scenes.length}%` }}>
              <VideoScene scene={{ ...scene, start: 0, end: 100, animation: "none" }} progress={1} reduced={gentle} isMobile={isMobile} accent={p.accent} />
            </div>
          ))}
        </div>
      ) : (
        scenes.map((scene, i) => (
          <VideoScene key={i} scene={scene} progress={shownProgress} reduced={gentle} isMobile={isMobile} accent={p.accent} />
        ))
      )}
    </>
  );

  /* ---- reduced motion: one still frame, no scroll hijacking, no playback ----
     The point of this branch is *less* motion. It shows the poster when there
     is one and otherwise holds the video on a single frame — it must never
     autoplay or loop, which would be more motion than the scroll version. */
  if (reducedFallback) {
    const still =
      p.poster || (usesFrames ? (frameUrls ? frameUrls[0] : frameUrl(source.framesId, 0, source.ext)) : "");
    return (
      <section className="relative w-full overflow-hidden" style={{ minHeight: stageHeight, borderRadius: stageRadius }} data-cms-scroll-video="still">
        {still ? (
          <img src={still} alt={p.title || ""} className="w-full h-full object-cover" style={{ minHeight: stageHeight, filter }} />
        ) : hasVideoSrc ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full object-cover"
            style={{ minHeight: stageHeight, objectFit: fit, filter }}
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
                /* some browsers refuse to seek this early; the poster stands */
              }
            }}
          />
        ) : (
          <div className="w-full" style={{ minHeight: stageHeight, background: p.bgColor || "#0b2a4a" }} />
        )}
        {content}
      </section>
    );
  }

  /* ---- the section ---- */
  const stageInner = (
    <div
      className={p.stageOverflow === "visible" ? "" : "overflow-hidden"}
      style={{
        position: sticky ? "sticky" : "relative",
        top: 0,
        height: stageHeight,
        minHeight: p.minHeight ? `${parseInt(p.minHeight, 10) || 0}px` : undefined,
        backgroundColor: p.bgColor || "#000",
        borderRadius: stageRadius,
      }}
    >
      {usesFrames ? (
        <>
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ filter, opacity: p.videoOpacity === "" || p.videoOpacity == null ? undefined : clamp(Number(p.videoOpacity) / 100, 0, 1) }}
            aria-label={p.title || "Scroll-driven animation"}
            role="img"
          />
          {/* A real picture stays underneath until the canvas has actually
              painted. The poster if there is one, otherwise the sequence's own
              first frame — which is always a URL we have, needs no
              configuration, and is exactly what the animation starts on.
              Without this the section is a blank rectangle for the whole time
              the first frames are downloading, which on a cold cache is when
              most people see it. */}
          {!painted ? (
            <img
              src={loadingFrameSrc}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: fit, filter }}
            />
          ) : null}
          {p.showProgress && framesLoaded < frameCount ? (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-10">
              <div className="h-full bg-white/50 transition-[width] duration-200" style={{ width: `${Math.round((framesLoaded / frameCount) * 100)}%` }} />
            </div>
          ) : null}
        </>
      ) : hasVideoSrc ? (
        <video
          ref={videoRef}
          key={src}
          poster={p.poster || undefined}
          className="w-full h-full"
          style={{
            objectFit: fit,
            objectPosition: p.objectPosition || undefined,
            filter,
            opacity: p.videoOpacity === "" || p.videoOpacity == null ? undefined : clamp(Number(p.videoOpacity) / 100, 0, 1),
          }}
          muted
          playsInline
          preload={p.preload || "auto"}
          // Scroll drives currentTime; the element itself never plays.
          autoPlay={false}
          controls={false}
          disablePictureInPicture
          aria-label={p.title || "Scroll-driven video"}
          // A source that cannot be decoded at all falls back to the poster
          // rather than leaving a dead element on the page.
          onError={() => setVideoBroken(true)}
        >
          {p.webmSrc ? <source src={p.webmSrc} type="video/webm" /> : null}
          <source src={src} />
        </video>
      ) : source.kind === "poster" && source.src ? (
        <img src={source.src} alt={p.title || ""} className="w-full h-full" style={{ objectFit: fit, filter }} />
      ) : p.poster ? (
        <img src={p.poster} alt={p.title || ""} className="w-full h-full" style={{ objectFit: fit, filter }} />
      ) : (
        // The last fallback. Not a black rectangle: the section still carries
        // its background and all of its text, so a visitor sees a designed
        // block rather than a hole in the page.
        <div className="w-full h-full" style={{ background: p.bgColor || "#0b2a4a" }} />
      )}

      {content}

      {p.showProgress ? (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15 z-10">
          <div className="h-full bg-white/80 transition-[width] duration-75" style={{ width: `${Math.round(shownProgress * 100)}%` }} />
        </div>
      ) : null}

      {/* Said plainly, and only to the person editing: a visitor cannot act on
          any of it, and it must never cover the picture on a live page. */}
      {showDiagnostics && framesFailed > 0 ? (
        <div className="absolute inset-x-0 top-0 m-3 rounded-lg bg-amber-500/95 px-3 py-2 text-[12px] text-white shadow-lg z-20">
          <strong>{framesFailed} of {frameCount} frames could not be loaded.</strong> The files are
          missing from the server. Re-create this animation under Scroll Animations, or pick a
          different one.
        </div>
      ) : null}
      {showDiagnostics && videoBroken ? (
        <div className="absolute inset-x-0 top-0 m-3 rounded-lg bg-red-600/95 px-3 py-2 text-[12px] text-white shadow-lg z-20">
          <strong>The browser could not play this video.</strong> It is a format it cannot decode —
          most often an HEVC .mov from a phone. Re-upload the file and it will be converted to MP4,
          or build a frame sequence from it instead. The section is showing its poster meanwhile.
        </div>
      ) : null}
      {showDiagnostics && diagnosis.pinRepaired > 0 ? (
        <div className="absolute inset-x-0 bottom-0 m-3 rounded-lg bg-blue-600/95 px-3 py-2 text-[12px] text-white shadow-lg z-20">
          {diagnosis.pinRepaired} wrapper{diagnosis.pinRepaired > 1 ? "s were" : " was"} clipping this
          section and would have stopped it pinning. Repaired automatically.
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      ref={wrapRef}
      className="relative w-full"
      style={{
        height: trackHeight,
        maxWidth: p.maxWidth && p.fullWidth === false ? `${parseInt(p.maxWidth, 10) || 0}px` : undefined,
        marginLeft: p.maxWidth && p.fullWidth === false ? "auto" : undefined,
        marginRight: p.maxWidth && p.fullWidth === false ? "auto" : undefined,
      }}
      // The chosen reduced-motion mode rides on the attribute, so the stylesheet
      // can collapse the track for "still" without flattening the sections that
      // still follow the scroll.
      data-cms-scroll-video={motionMode}
      data-scroll-progress={Math.round(shownProgress * 100)}
    >
      {stageInner}

      {/* Author-only. Errors first, then warnings; each says what to do. */}
      {showDiagnostics && problems.length ? (
        <div className="absolute left-0 right-0 top-0 z-30 m-3 space-y-1.5">
          {problems.map((issue, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-[12px] shadow-lg ${
                issue.level === "error" ? "bg-red-600/95 text-white" : "bg-amber-500/95 text-white"
              }`}
            >
              <strong>{issue.message}</strong>
              {issue.hint ? <span className="block opacity-90">{issue.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
