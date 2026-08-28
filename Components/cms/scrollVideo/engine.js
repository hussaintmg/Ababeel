/**
 * Scroll Video — the maths.
 *
 * Everything in this file is pure: no DOM, no React, no timers. That is
 * deliberate. Scroll-driven sections fail in ways that are miserable to debug
 * in a browser — a scene that never appears, a track one screen too short, a
 * pin that releases early — and every one of those is a number being wrong.
 * Keeping the numbers here means they can be tested directly.
 *
 * The renderer (ScrollVideoRenderer) and the controller (useScrollController)
 * do nothing but feed measurements in and apply what comes out.
 */

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* ------------------------------------------------------------------ *
 * Playback modes
 * ------------------------------------------------------------------ */

export const SCROLL_MODES = [
  { value: "scrub", label: "Frame scrubbing" },
  { value: "reverse", label: "Reverse playback" },
  { value: "pingpong", label: "Ping pong" },
  { value: "loop", label: "Loop while scrolling" },
];

export const SCROLL_DIRECTIONS = [
  { value: "vertical", label: "Vertical — content stacks and fades" },
  { value: "horizontal", label: "Horizontal — scenes slide across as you scroll" },
];

/* ------------------------------------------------------------------ *
 * Easing
 * ------------------------------------------------------------------ *
 * Named the way animation tools name them, because that is what an author
 * recognises. All are defined on 0–1 and return 0–1, so any of them can be
 * dropped into any progress value without further thought.
 */

export const EASES = [
  { value: "linear", label: "Linear (no easing)" },
  { value: "sine.out", label: "Sine — gentle" },
  { value: "power2.out", label: "Ease out — natural (recommended)" },
  { value: "power3.out", label: "Ease out — strong" },
  { value: "power2.in", label: "Ease in" },
  { value: "power2.inOut", label: "Ease in and out" },
  { value: "expo.out", label: "Expo — very fast settle" },
  { value: "back.out", label: "Back — slight overshoot" },
];

const EASE_FNS = {
  linear: (t) => t,
  "sine.out": (t) => Math.sin((t * Math.PI) / 2),
  "power2.out": (t) => 1 - (1 - t) ** 2,
  "power3.out": (t) => 1 - (1 - t) ** 3,
  "power2.in": (t) => t * t,
  "power2.inOut": (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  "expo.out": (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  "back.out": (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
};

/** Apply a named ease. An unknown name is linear rather than an exception. */
export function applyEase(name, t) {
  const fn = EASE_FNS[name] || EASE_FNS.linear;
  return fn(clamp(t, 0, 1));
}

/* ------------------------------------------------------------------ *
 * Where the track starts and stops driving
 * ------------------------------------------------------------------ */

export const TRIGGER_STARTS = [
  { value: "top top", label: "Section top reaches the top of the screen" },
  { value: "top center", label: "Section top reaches the middle of the screen" },
  { value: "top bottom", label: "Section top enters the screen" },
  { value: "center center", label: "Section centre reaches the middle of the screen" },
];

export const TRIGGER_ENDS = [
  { value: "bottom bottom", label: "Section bottom reaches the bottom of the screen" },
  { value: "bottom center", label: "Section bottom reaches the middle of the screen" },
  { value: "bottom top", label: "Section bottom leaves the top of the screen" },
];

/**
 * Distance between the track's top and the viewport's top at which a named
 * trigger fires. Written the way ScrollTrigger writes it — "<element edge>
 * <viewport edge>" — so anyone who has used that tool reads these unchanged.
 */
function triggerOffset(spec, { rectHeight, viewHeight }, fallback) {
  const [edge, view] = String(spec || "").trim().split(/\s+/);
  const elementEdge = edge === "bottom" ? rectHeight : edge === "center" ? rectHeight / 2 : 0;
  const viewEdge = view === "bottom" ? viewHeight : view === "center" ? viewHeight / 2 : view === "top" ? 0 : null;
  if (viewEdge === null || (edge !== "top" && edge !== "bottom" && edge !== "center")) return fallback;
  // rectTop - viewTop, at the moment the two named edges coincide.
  return viewEdge - elementEdge;
}

/**
 * Scroll progress of the track, 0–1.
 *
 * `viewTop`/`viewHeight` describe whatever the section scrolls inside: the
 * browser viewport on a public page, or the builder's preview pane.
 *
 * `start`/`end` name the moments progress hits 0 and 1. The defaults reproduce
 * the original behaviour exactly — the animation runs from the moment the
 * section's top reaches the top of the screen until its bottom reaches the
 * bottom — so pages saved before these settings existed are unaffected.
 */
export function computeProgress({
  rectTop,
  rectHeight,
  viewTop = 0,
  viewHeight,
  start = "top top",
  end = "bottom bottom",
}) {
  const startD = triggerOffset(start, { rectHeight, viewHeight }, 0);
  const endD = triggerOffset(end, { rectHeight, viewHeight }, viewHeight - rectHeight);
  const span = startD - endD;
  if (span <= 0) return 0;
  return clamp((startD - (rectTop - viewTop)) / span, 0, 1);
}

/* ------------------------------------------------------------------ *
 * Progress → playback position
 * ------------------------------------------------------------------ */

/** Map raw 0–1 scroll progress onto the configured playback range and mode. */
export function mapProgress(
  raw,
  { mode = "scrub", startOffset = 0, endOffset = 100, speed = 1, reverse = false, loops = 1, ease = "linear", offset = 0 } = {}
) {
  let p = clamp(raw, 0, 1);

  // A delay before the animation starts moving, expressed as a share of the
  // track. Scrolling the first `offset`% does nothing; the rest plays through.
  const skip = clamp(num(offset, 0) / 100, 0, 0.9);
  if (skip > 0) p = clamp((p - skip) / (1 - skip), 0, 1);

  const sp = num(speed, 1) || 1;
  if (sp !== 1) p = clamp(p * sp, 0, 1);

  if (ease && ease !== "linear") p = applyEase(ease, p);

  if (mode === "pingpong") p = p <= 0.5 ? p * 2 : (1 - p) * 2;
  if (mode === "loop") {
    const n = Math.max(parseInt(loops, 10) || 1, 1);
    p = (p * n) % 1;
  }
  if (reverse || mode === "reverse") p = 1 - p;

  const start = clamp(num(startOffset, 0) / 100, 0, 1);
  const end = clamp(endOffset === "" || endOffset === undefined ? 1 : num(endOffset, 100) / 100, 0, 1);
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  return lo + p * (hi - lo);
}

/* ------------------------------------------------------------------ *
 * Track length
 * ------------------------------------------------------------------ */

/**
 * Least scroll a sequence gets to play through, whatever its length — as a
 * share of the screen, not a fixed number of pixels.
 *
 * This used to be a flat 900px, which was the reason a perfectly good
 * animation looked like it did nothing. A 26-frame sequence at 12px a frame
 * wants 312px, so the floor decided it, and 900px on an 800px-tall window is
 * 1.1 screens: the entire animation was over inside one flick of a trackpad,
 * before the visitor had registered that anything was moving. Worse, the floor
 * was the same 900px on a phone, a laptop and a 4K monitor, so the taller the
 * screen the less of the animation anyone saw.
 *
 * 250vh is two and a half screens of scrolling past the pinned stage. It reads
 * as a sequence on every size of screen, and a long sequence still gets its
 * own per-frame distance on top.
 */
export const MIN_TRAVEL_VH = 250;

/** Per-frame scroll distance a sequence asks for, in pixels. */
export function trackTravel(frameCount, pxPerFrame) {
  const per = clamp(num(pxPerFrame, 12) || 12, 2, 80);
  return Math.round(num(frameCount, 0) * per);
}

/**
 * The CSS height of the scroll track.
 *
 * Three ways to say it, in order of precedence: an explicit `scrollDuration`
 * in screens ("3" → three screens of scrolling past the pinned stage), the
 * older free-text `height`, or — for a frame sequence with neither — a length
 * worked out from the frame count so every frame gets scroll distance of its
 * own.
 */
export function trackHeightCss({ scrollDuration, height, stageHeight = "100vh", usesFrames, frameCount, pxPerFrame }) {
  if (height) return String(height);
  const screens = num(scrollDuration, 0);
  if (screens > 0) return `calc(${stageHeight} + ${clamp(screens, 0.2, 20) * 100}vh)`;
  // CSS max() picks whichever is longer at the size the visitor is actually
  // using, so the floor follows the screen instead of a number chosen on one.
  if (usesFrames) return `calc(${stageHeight} + max(${trackTravel(frameCount, pxPerFrame)}px, ${MIN_TRAVEL_VH}vh))`;
  return "300vh";
}

/* ------------------------------------------------------------------ *
 * Scenes
 * ------------------------------------------------------------------ *
 * A scene owns a slice of the scroll. Inside its slice it eases in, holds, and
 * eases out again, so scenes hand over to each other rather than all being on
 * screen at once.
 */

export const SCENE_ANIMATIONS = [
  { value: "fade", label: "Fade" },
  { value: "fade-up", label: "Fade up" },
  { value: "fade-down", label: "Fade down" },
  { value: "fade-left", label: "Slide in from the left" },
  { value: "fade-right", label: "Slide in from the right" },
  { value: "zoom-in", label: "Zoom in" },
  { value: "zoom-out", label: "Zoom out" },
  { value: "blur", label: "Sharpen from blur" },
  { value: "none", label: "No animation — just appear" },
];

export const SCENE_POSITIONS = [
  { value: "center", label: "Centre" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

export const VISIBILITY = [
  { value: "both", label: "Desktop and mobile" },
  { value: "desktop", label: "Desktop only" },
  { value: "mobile", label: "Mobile only" },
];

/** Share of a scene's range spent easing in, and again easing out. */
const SCENE_TRANSITION = 0.22;

/**
 * Where a scene is, given the section's progress.
 *
 *   active   should it be in the DOM at all
 *   t        0–1 through its own range, before easing
 *   enter    0–1 entrance progress: 0 just before it appears, 1 fully in
 *   exit     0–1 exit progress: 0 while it holds, 1 once it has gone
 *
 * A scene with no explicit range covers the whole section, which is what makes
 * a single-scene section behave like the plain overlay it replaces.
 */
export function sceneState(scene, progress) {
  const rawStart = scene?.start === "" || scene?.start == null ? 0 : num(scene.start, 0);
  const rawEnd = scene?.end === "" || scene?.end == null ? 100 : num(scene.end, 100);
  // Authors do get these the wrong way round; swapping is kinder than blanking
  // the scene, and the editor warns about it separately.
  const start = clamp(Math.min(rawStart, rawEnd), 0, 100) / 100;
  const end = clamp(Math.max(rawStart, rawEnd), 0, 100) / 100;
  const span = end - start;

  const p = clamp(progress, 0, 1);
  // A zero-width range would divide by zero; treat it as a single instant that
  // is on for everything at or past it.
  if (span <= 0) {
    const on = p >= start;
    return { active: on, t: on ? 1 : 0, enter: on ? 1 : 0, exit: 0 };
  }

  const t = (p - start) / span;
  // Kept mounted slightly outside the range so the exit transition can play
  // rather than the scene vanishing at the boundary.
  const active = t > -SCENE_TRANSITION && t < 1 + SCENE_TRANSITION;

  // A scene pinned to either end of the track has no room to animate there:
  // the first scene would be invisible the whole time the stage was pinning,
  // and the last would fade out again just as the section released — so a
  // visitor scrolling to the top or the bottom of the section saw no text at
  // all, which reads as the section not having loaded. At the ends the scene
  // is simply already in, or stays in.
  const atTrackStart = start <= 0.001;
  const atTrackEnd = end >= 0.999;
  const enter = atTrackStart ? 1 : clamp(t / SCENE_TRANSITION, 0, 1);
  const exit = atTrackEnd ? 0 : clamp((t - (1 - SCENE_TRANSITION)) / SCENE_TRANSITION, 0, 1);
  return { active, t: clamp(t, 0, 1), enter, exit };
}

/**
 * The inline style a scene's animation produces at a given progress.
 *
 * Entrance and exit are the same animation run forwards and then backwards, so
 * a scene that slides up on the way in slides back down on the way out without
 * the author configuring anything twice.
 */
export function sceneStyle(scene, progress, { reduced = false } = {}) {
  const { active, enter, exit } = sceneState(scene, progress);
  if (!active) return { active: false, style: { opacity: 0, visibility: "hidden" } };

  const kind = scene?.animation || "fade-up";
  const ease = scene?.ease || "power2.out";
  const distance = num(scene?.distance, 40) || 40;

  // 1 = fully in, 0 = fully out. Reduced motion keeps the fade and drops the
  // travel: appearing is information, sliding is decoration.
  const shown = applyEase(ease, enter) * (1 - applyEase("power2.in", exit));
  const away = 1 - shown;

  const style = { opacity: kind === "none" ? 1 : shown };
  if (reduced || kind === "none" || kind === "fade") return { active: true, style };

  const parts = [];
  if (kind === "fade-up") parts.push(`translate3d(0, ${(away * distance).toFixed(2)}px, 0)`);
  if (kind === "fade-down") parts.push(`translate3d(0, ${(-away * distance).toFixed(2)}px, 0)`);
  if (kind === "fade-left") parts.push(`translate3d(${(-away * distance).toFixed(2)}px, 0, 0)`);
  if (kind === "fade-right") parts.push(`translate3d(${(away * distance).toFixed(2)}px, 0, 0)`);
  if (kind === "zoom-in") parts.push(`scale(${(1 - away * 0.14).toFixed(4)})`);
  if (kind === "zoom-out") parts.push(`scale(${(1 + away * 0.14).toFixed(4)})`);
  if (parts.length) style.transform = parts.join(" ");
  if (kind === "blur") style.filter = `blur(${(away * 12).toFixed(2)}px)`;
  return { active: true, style };
}

/** Flex/inset classes for a scene's position on the stage. */
export function scenePlacement(position) {
  const p = String(position || "center");
  const vertical = p.startsWith("top") ? "flex-start" : p.startsWith("bottom") ? "flex-end" : "center";
  const horizontal = p.endsWith("left") || p === "left" ? "flex-start" : p.endsWith("right") || p === "right" ? "flex-end" : "center";
  return { justifyContent: vertical, alignItems: horizontal };
}

/* ------------------------------------------------------------------ *
 * Overlay items
 * ------------------------------------------------------------------ *
 * Persistent layers — a logo, a watermark, a standing headline. Unlike a scene
 * these are always mounted; what changes is how far through their own
 * animation they are.
 */

export const OVERLAY_KINDS = [
  { value: "heading", label: "Heading" },
  { value: "text", label: "Paragraph" },
  { value: "image", label: "Image or logo" },
  { value: "button", label: "Button" },
  { value: "html", label: "Custom HTML" },
];

/**
 * An overlay item's live style.
 *
 * Each item names its own scroll window and its own from → to values, so one
 * can fade in over the first quarter while another drifts across the whole
 * section. Anything left blank stays at its natural value.
 */
export function overlayStyle(item, progress, { reduced = false } = {}) {
  const start = clamp(num(item?.start, 0) / 100, 0, 1);
  const end = clamp(item?.end === "" || item?.end == null ? 1 : num(item.end, 100) / 100, 0, 1);
  const span = Math.max(end - start, 0.0001);
  const raw = clamp((clamp(progress, 0, 1) - start) / span, 0, 1);
  const t = applyEase(item?.ease || "power2.out", raw);

  const lerp = (from, to, fallbackFrom, fallbackTo) => {
    const a = from === "" || from == null ? fallbackFrom : num(from, fallbackFrom);
    const b = to === "" || to == null ? fallbackTo : num(to, fallbackTo);
    return a + (b - a) * t;
  };

  const opacity = clamp(lerp(item?.fromOpacity, item?.toOpacity, 0, 1), 0, 1);
  const style = { opacity };

  if (reduced) return style;

  const x = lerp(item?.fromX, item?.toX, 0, 0);
  const y = lerp(item?.fromY, item?.toY, 0, 0);
  const scale = lerp(item?.fromScale, item?.toScale, 1, 1);
  const blur = Math.max(lerp(item?.fromBlur, item?.toBlur, 0, 0), 0);

  const parts = [];
  if (x || y) parts.push(`translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`);
  if (scale !== 1) parts.push(`scale(${scale.toFixed(4)})`);
  if (parts.length) style.transform = parts.join(" ");
  if (blur > 0.01) style.filter = `blur(${blur.toFixed(2)}px)`;
  return style;
}

/* ------------------------------------------------------------------ *
 * Snapping
 * ------------------------------------------------------------------ */

/**
 * Nearest scene boundary to settle on when the visitor stops scrolling.
 *
 * Returns null when nothing is close enough to be worth moving to, which is
 * what stops snapping from feeling like the page fighting the reader.
 */
export function snapTarget(progress, scenes, { enabled, threshold = 0.12 } = {}) {
  if (!enabled) return null;
  const points = new Set([0, 1]);
  (Array.isArray(scenes) ? scenes : []).forEach((s) => {
    points.add(clamp(num(s?.start, 0) / 100, 0, 1));
    points.add(clamp(s?.end === "" || s?.end == null ? 1 : num(s.end, 100) / 100, 0, 1));
  });
  let best = null;
  let bestGap = Infinity;
  points.forEach((pt) => {
    const gap = Math.abs(pt - progress);
    if (gap < bestGap) {
      bestGap = gap;
      best = pt;
    }
  });
  if (best === null || bestGap > threshold || bestGap < 0.0005) return null;
  return best;
}

/* ------------------------------------------------------------------ *
 * Reduced motion
 * ------------------------------------------------------------------ */

export const REDUCED_MOTION_MODES = [
  { value: "scrub", label: "Follow the scroll, without the hold (recommended)" },
  { value: "still", label: "Show a single still frame" },
  { value: "full", label: "Play exactly as normal" },
];

export function reducedMotionMode(p) {
  const explicit = String(p?.reducedMotion || "");
  if (explicit === "full" || explicit === "still" || explicit === "scrub") return explicit;
  // Older blocks carry a boolean. `false` always meant "ignore the setting";
  // `true` meant a still frame, which is the behaviour being replaced, so it
  // maps to the gentler option rather than the one that looked broken.
  return p?.respectReducedMotion === false ? "full" : "scrub";
}

/* ------------------------------------------------------------------ *
 * Frame sequences
 * ------------------------------------------------------------------ */

/** URL of frame `index` in a sequence (matches lib/cms/frames.js naming). */
export function frameUrl(id, index, ext = "webp") {
  return `/uploads/cms/frames/${id}/${String(index + 1).padStart(4, "0")}.${ext}`;
}

/**
 * Frames to fetch first for a usable animation across the whole scroll range,
 * however few have arrived. Twelve is enough that the picture visibly changes
 * from one end of the section to the other.
 */
const COARSE_PASS = 12;

/**
 * Order frames should be fetched in, given where the viewer currently is.
 *
 *   current frame → a coarse spread over the whole sequence → the window
 *   around the viewer → everything else
 *
 * The coarse pass is what makes this work on a real connection, and leaving it
 * out was a bug people would describe as "the animation stops". Fetching
 * outward from the viewer means that after the first second you hold frames
 * 0–20 of 120 and nothing beyond, so scrolling past a fifth of the section
 * leaves the last loaded frame frozen on screen for the rest of it — the
 * section looks broken precisely when someone scrolls it straight away, which
 * is when most people do.
 *
 * Fetching a dozen frames spread across the whole sequence first costs the same
 * dozen requests and means the animation moves through its entire range
 * immediately, coarsely, and then sharpens as the gaps fill in.
 *
 * Loading 1..N in order is wrong for a different reason: a visitor who lands
 * mid-section waits for frames they have already scrolled past.
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

  // What is on screen right now.
  push(current);

  // A coarse spread over the whole sequence, so every part of the scroll has
  // something to show almost at once. The first and last frames are in here by
  // construction: the first is what anyone scrolling back up sees, and the last
  // is what the section releases on.
  const stride = Math.max(Math.floor(count / COARSE_PASS), 1);
  for (let i = 0; i < count; i += stride) push(i);
  push(count - 1);

  // Then sharpen around the viewer.
  for (let d = 1; d <= window; d++) {
    push(current + d);
    push(current - d);
  }

  // Then everything else.
  for (let i = 0; i < count; i++) push(i);
  return order;
}

/* ------------------------------------------------------------------ *
 * Which source actually plays
 * ------------------------------------------------------------------ */

/**
 * Work out what this section will render, before any of it is on screen.
 *
 * The block carries a video source, a frame sequence, a poster and a separate
 * mobile configuration, and which of them wins is not obvious from the props.
 * Deciding it in one place — testable, and the same answer for the renderer,
 * the editor's warnings and the preview — is what stops the three disagreeing.
 */
export function resolveSource(p = {}, { mobile = false } = {}) {
  const mobileMode = String(p.mobileMode || "same");

  if (mobile && mobileMode === "off") {
    return { kind: p.poster ? "poster" : "none", src: p.poster || "", reason: "Scroll animation is switched off on mobile" };
  }
  if (mobile && mobileMode === "poster") {
    return { kind: p.poster ? "poster" : "none", src: p.poster || "", reason: "Mobile shows the poster image" };
  }

  const frameUrls = Array.isArray(p.frames) && p.frames.length > 1 ? p.frames : null;
  const frameCount = frameUrls ? frameUrls.length : parseInt(p.frameCount, 10) || 0;
  const usesFrames = p.renderMode === "frames" && frameCount > 1 && (!!p.framesId || !!frameUrls);
  if (usesFrames) {
    return { kind: "frames", frameUrls, frameCount, framesId: p.framesId || "", ext: p.frameExt || "webp" };
  }

  const src = mobile && p.mobileSrc ? p.mobileSrc : p.src || "";
  if (src) return { kind: "video", src, webm: p.webmSrc || "" };

  if (p.poster) return { kind: "poster", src: p.poster, reason: "No video or frame sequence — showing the poster" };
  return { kind: "none", src: "" };
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ *
 * Shown to the author in the editor, never to a visitor. Every entry says what
 * is wrong and what to do about it — a warning nobody can act on is noise.
 */

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const IMAGE_EXT = /\.(webp|jpe?g|png|avif|gif)(\?|#|$)/i;

function looksLikeUrl(value) {
  const v = String(value || "").trim();
  return v.startsWith("/") || /^https?:\/\//i.test(v) || v.startsWith("data:") || v.startsWith("blob:");
}

export function validateScrollVideo(p = {}) {
  const out = [];
  const err = (message, hint) => out.push({ level: "error", message, hint });
  const warn = (message, hint) => out.push({ level: "warning", message, hint });

  const source = resolveSource(p);

  if (source.kind === "none") {
    err(
      "This section has nothing to show.",
      "Choose a ready-made scroll animation, or upload a video, or at least set a poster image so the section is never blank."
    );
  }

  if (p.renderMode === "frames" && source.kind !== "frames") {
    err(
      "Set to play a frame sequence, but no usable sequence is attached.",
      "Pick one under “Start here — choose a ready-made animation”, or switch the playback source back to Video file."
    );
  }

  if (source.kind === "frames" && source.frameCount < 2) {
    err("A frame sequence needs at least two frames.", "Re-create it under Scroll Animations.");
  }

  // A frame sequence is one image per frame, and all of them have to arrive
  // before the animation is sharp all the way through. The loader fetches a
  // coarse spread first so the picture moves across the whole section
  // immediately, but on a phone connection a long sequence still means the
  // first pass through is rough — and it is the author, not the visitor, who
  // can decide whether that trade is worth making.
  if (source.kind === "frames" && source.frameCount > 90 && String(p.mobileMode || "same") === "same") {
    warn(
      `${source.frameCount} frames is a heavy download on a phone.`,
      "The animation still plays — it fetches a spread across the whole sequence first and sharpens as the rest arrive — but consider setting “On a phone” to the poster image, or rebuilding the animation with fewer frames."
    );
  }

  if (/\.(mov|m4v)(\?|#|$)/i.test(String(p.src || ""))) {
    warn(
      "This is a QuickTime file.",
      "Browsers often cannot play .mov at all — it is frequently HEVC, which Chrome and Firefox refuse. Re-upload it and it will be converted to MP4 automatically, or export an MP4 from your editor."
    );
  }

  if (p.src && !looksLikeUrl(p.src)) {
    err(`The video address “${String(p.src).slice(0, 60)}” is not a usable URL.`, "It should start with / for an uploaded file, or https:// for one elsewhere.");
  } else if (p.src && !VIDEO_EXT.test(p.src) && !p.src.startsWith("blob:") && !p.src.startsWith("data:")) {
    warn("That video file has an unusual extension.", "Browsers can play MP4 and WebM reliably; anything else may not play at all.");
  }
  if (p.mobileSrc && !looksLikeUrl(p.mobileSrc)) {
    err("The mobile video address is not a usable URL.", "It should start with / or https://.");
  }
  if (p.poster && !looksLikeUrl(p.poster)) {
    err("The poster address is not a usable URL.", "It should start with / or https://.");
  } else if (p.poster && !IMAGE_EXT.test(p.poster)) {
    warn("The poster does not look like an image file.", "Use a WebP, JPEG or PNG.");
  }

  if (!p.poster && source.kind !== "poster") {
    warn(
      "No poster image.",
      "The poster is what shows while the video loads, and what a visitor with reduced motion sees. Without one the section starts as a black rectangle."
    );
  }

  const duration = Number(p.scrollDuration);
  if (p.scrollDuration !== "" && p.scrollDuration != null && Number.isFinite(duration)) {
    if (duration <= 0) err("Scroll distance must be greater than zero.", "1 means one screen of scrolling past the pinned stage. Try 2 or 3.");
    else if (duration > 20) warn(`${duration} screens of scrolling is a very long section.`, "Most sections read well at 1–4.");
    else if (duration < 0.5) warn("Under half a screen of scroll is over almost instantly.", "The animation will read as a flash rather than a sequence.");
  } else if (p.scrollDuration && !Number.isFinite(duration)) {
    err(`“${p.scrollDuration}” is not a number of screens.`, "Enter a plain number, e.g. 2.");
  }

  const speed = Number(p.speed);
  if (p.speed && (!Number.isFinite(speed) || speed <= 0)) {
    err("Scroll speed must be a positive number.", "1 means the animation exactly follows the scroll.");
  }
  const smoothing = Number(p.smoothing);
  if (p.smoothing && (!Number.isFinite(smoothing) || smoothing <= 0 || smoothing > 1)) {
    err("Smoothing must be between 0.02 and 1.", "Lower is smoother; 0.18 is a good default.");
  }

  const start = Number(p.startOffset ?? 0);
  const end = Number(p.endOffset ?? 100);
  if (Number.isFinite(start) && Number.isFinite(end) && start >= end) {
    err(`The playback range starts at ${start}% and ends at ${end}%.`, "The start must be before the end, or nothing plays.");
  }

  const scenes = Array.isArray(p.scenes) ? p.scenes : [];
  scenes.forEach((s, i) => {
    const label = s?.heading ? `“${String(s.heading).slice(0, 30)}”` : `Scene ${i + 1}`;
    const a = Number(s?.start ?? 0);
    const b = Number(s?.end ?? 100);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      err(`${label} has a scroll range that is not a number.`, "Start and End are percentages of this section, e.g. 0 and 30.");
      return;
    }
    if (a >= b) err(`${label} starts at ${a}% and ends at ${b}%.`, "The start must be a smaller number than the end, or the scene never shows.");
    if (a < 0 || b > 100) warn(`${label} is set outside 0–100%.`, "Values outside that range are clamped.");
    if (!s?.heading && !s?.text && !s?.image && !s?.ctaLabel) {
      warn(`${label} is empty.`, "Give it a heading, some text, an image or a button — or remove it.");
    }
    if (s?.image && !looksLikeUrl(s.image)) err(`${label} has an image address that is not a usable URL.`, "It should start with / or https://.");
  });

  for (let i = 1; i < scenes.length; i++) {
    const prev = Number(scenes[i - 1]?.end ?? 100);
    const next = Number(scenes[i]?.start ?? 0);
    if (Number.isFinite(prev) && Number.isFinite(next) && next < prev - 1) {
      warn(`Scene ${i} and scene ${i + 1} overlap.`, "They will be on screen together. Set scene " + (i + 1) + " to start at " + prev + "% to hand over cleanly.");
      break;
    }
  }

  (Array.isArray(p.overlays) ? p.overlays : []).forEach((o, i) => {
    const label = `Overlay ${i + 1}`;
    if (o?.image && !looksLikeUrl(o.image)) err(`${label} has an image address that is not a usable URL.`, "It should start with / or https://.");
    if (!o?.text && !o?.image && !o?.html) warn(`${label} is empty.`, "Give it content or remove it.");
    const a = Number(o?.start ?? 0);
    const b = Number(o?.end ?? 100);
    if (Number.isFinite(a) && Number.isFinite(b) && a > b) {
      err(`${label} starts at ${a}% and ends at ${b}%.`, "Its animation would run backwards; swap the two.");
    }
  });

  if (p.sticky === false && (Array.isArray(p.scenes) ? p.scenes.length : 0) > 1) {
    warn(
      "Several scenes, but the section is not pinned.",
      "Without pinning the whole section scrolls past at once and the later scenes barely appear. Turn “Pin while scrolling” back on."
    );
  }

  if (!p.title && !p.subtitle && !scenes.length && !(Array.isArray(p.overlays) && p.overlays.length)) {
    warn(
      "No text anywhere in this section.",
      "Search engines and screen readers see nothing here. Add a heading — a scene or the overlay title will do."
    );
  }

  return out;
}
