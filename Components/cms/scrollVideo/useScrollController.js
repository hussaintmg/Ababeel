"use client";

/**
 * The scroll controller.
 *
 * One instance per section. It measures the track against whatever scrolls it,
 * turns that into 0–1 progress, and hands the progress to the renderer. It also
 * repairs the single most common reason a scroll section "does nothing": an
 * ancestor that quietly turns itself into a scroll container and takes the
 * sticky pin with it.
 *
 * Why not GSAP/ScrollTrigger: the project does not carry GSAP, and adding it
 * would mean a second animation runtime alongside framer-motion for one
 * section. What ScrollTrigger provides that matters here — a pin that does not
 * depend on ancestor overflow, scrub, snap, configurable start/end triggers,
 * and cleanup that actually happens — is provided here directly, in about a
 * tenth of the bytes, with the maths in engine.js where it can be tested.
 *
 * Every listener is passive except the scroll hold, every one is removed on
 * unmount, and the rAF loop stops the moment the section leaves the screen —
 * so navigating away, or ten of these on one page, costs nothing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { computeProgress, snapTarget } from "./engine";

/**
 * Nearest ancestor that actually scrolls this element.
 *
 * Only a genuine scroll container counts: an element with a scrolling overflow
 * *and* more content than fits. An ancestor with `overflow: hidden` clips
 * without scrolling — it breaks the pin but is not the scroller — so it is
 * reported separately.
 */
function inspectAncestors(el) {
  let scroller = null;
  const clippers = [];
  let node = el?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const scrolls = /(auto|scroll|overlay)/.test(cs.overflowY);
    if (!scroller && scrolls && node.scrollHeight > node.clientHeight + 1) {
      scroller = node;
    } else if (!scroller && (cs.overflowY === "hidden" || cs.overflowX === "hidden")) {
      // `overflow-x: hidden` computes overflow-y to `auto`, which is the
      // classic accidental way to kill a sticky child. `clip` does not, which
      // is exactly what the repair below swaps it for.
      clippers.push(node);
    }
    node = node.parentElement;
  }
  return { scroller, clippers };
}

/**
 * Stop an ancestor from clipping this section, without changing what it does
 * for everything else on the page.
 *
 * `overflow: hidden` and `overflow: clip` guard against overflowing content in
 * the same way; only `hidden` creates a scrollport, and only a scrollport
 * breaks `position: sticky`. Swapping one for the other is therefore a repair
 * with no visual consequence — and it is reversed on unmount, so a wrapper the
 * rest of the page relies on is left exactly as it was found.
 */
function unclip(nodes) {
  const undo = [];
  nodes.forEach((node) => {
    const cs = getComputedStyle(node);
    const before = ["overflow-x", "overflow-y"].map((prop) => ({
      prop,
      value: node.style.getPropertyValue(prop),
      priority: node.style.getPropertyPriority(prop),
    }));
    let changed = false;
    // `!important` on the offending rule is not unusual — a theme or a
    // hand-written page CSS reaching for it is exactly the kind of wrapper that
    // breaks a pin — and a plain inline style loses to it. The repair has to
    // win, so it matches the priority.
    if (cs.overflowX === "hidden") {
      node.style.setProperty("overflow-x", "clip", "important");
      changed = true;
    }
    if (cs.overflowY === "hidden") {
      node.style.setProperty("overflow-y", "clip", "important");
      changed = true;
    }
    if (changed) {
      undo.push(() => {
        before.forEach(({ prop, value, priority }) => {
          node.style.removeProperty(prop);
          if (value) node.style.setProperty(prop, value, priority);
        });
      });
    }
  });
  return () => undo.forEach((fn) => fn());
}

/**
 * @param wrapRef       the track element
 * @param onProgress    called with 0–1 whenever the position changes
 * @param enabled       false in the builder, where a scrubber owns the position
 * @param settings      { start, end, snap, snapDuration, pauseOutside }
 */
export default function useScrollController({ wrapRef, onProgress, enabled = true, settings = {} }) {
  const [scroller, setScroller] = useState(null);
  // What the controller found and did, so the editor can say why a section is
  // not behaving rather than leaving the author to guess.
  const [diagnosis, setDiagnosis] = useState({ pinRepaired: 0, scroller: false, trackPx: 0, viewPx: 0 });
  const visibleRef = useRef(false);
  const rafRef = useRef(0);
  const snapRef = useRef(0);
  const progressRef = useRef(0);

  const { start = "top top", end = "bottom bottom", snap = false, snapDuration = 400 } = settings;

  const emit = useCallback(
    (value) => {
      progressRef.current = value;
      onProgress(value);
    },
    [onProgress]
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!enabled || !wrap || typeof window === "undefined") return undefined;

    const { scroller: found, clippers } = inspectAncestors(wrap);
    const restore = unclip(clippers);
    setScroller((prev) => (prev === found ? prev : found));

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const view = found
        ? { top: found.getBoundingClientRect().top, height: found.clientHeight }
        : { top: 0, height: window.innerHeight };
      return { rect, view };
    };

    const compute = () => {
      const { rect, view } = measure();
      return computeProgress({
        rectTop: rect.top,
        rectHeight: rect.height,
        viewTop: view.top,
        viewHeight: view.height,
        start,
        end,
      });
    };

    // Scroll events fire far faster than frames render; coalescing them into
    // one rAF is what keeps a long sequence smooth on a phone.
    let queued = false;
    const onScroll = () => {
      if (!visibleRef.current || queued) return;
      queued = true;
      rafRef.current = requestAnimationFrame(() => {
        queued = false;
        emit(compute());
      });
    };

    /* ---- settling on a scene boundary ---- */
    let settleTimer = 0;
    let settleRaf = 0;
    const cancelSettle = () => {
      clearTimeout(settleTimer);
      cancelAnimationFrame(settleRaf);
    };
    const scheduleSnap = () => {
      if (!snap) return;
      cancelSettle();
      settleTimer = setTimeout(() => {
        const target = snapTarget(progressRef.current, settings.scenes, { enabled: true, frameCount: settings.frameCount });
        if (target === null) return;
        const { rect, view } = measure();
        const span = rect.height - view.height;
        if (span <= 0) return;
        // Where the page has to be for progress to equal `target`.
        const delta = (target - progressRef.current) * span;
        const from = found ? found.scrollTop : window.scrollY;
        const to = from + delta;
        const ms = Math.max(Number(snapDuration) || 400, 80);
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min((now - t0) / ms, 1);
          const eased = 1 - (1 - k) ** 3;
          const y = from + (to - from) * eased;
          if (found) found.scrollTop = y;
          else window.scrollTo(0, y);
          if (k < 1) settleRaf = requestAnimationFrame(step);
        };
        settleRaf = requestAnimationFrame(step);
      }, 140);
    };

    const onScrollAndSnap = () => {
      // A new gesture cancels a settle in progress: nothing is more annoying
      // than a page pulling against the reader's own scrolling.
      cancelSettle();
      onScroll();
      scheduleSnap();
    };

    /* ---- run only while on screen ---- */
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                visibleRef.current = e.isIntersecting;
                if (e.isIntersecting) onScroll();
              });
            },
            { root: found, rootMargin: "150px 0px" }
          )
        : null;
    if (io) io.observe(wrap);
    else visibleRef.current = true;

    /* ---- re-measure when the layout moves under us ----
       A font loading, an image arriving, a sibling section growing: any of
       these changes where the track sits, and progress computed against the
       old measurement is wrong for the rest of the visit. */
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            visibleRef.current = true;
            emit(compute());
          })
        : null;
    ro?.observe(wrap);
    if (document.body) ro?.observe(document.body);

    // Capture phase: `scroll` does not bubble, so this is what lets a section
    // inside the builder's preview pane be driven by that pane's scrolling.
    window.addEventListener("scroll", onScrollAndSnap, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("orientationchange", onScroll, { passive: true });

    // First measurement, and one more after layout has settled — a webfont or
    // a late image commonly moves the track between these two.
    emit(compute());
    const settle = setTimeout(() => emit(compute()), 350);

    const { rect, view } = measure();
    setDiagnosis({ pinRepaired: clippers.length, scroller: !!found, trackPx: Math.round(rect.height), viewPx: Math.round(view.height) });

    return () => {
      window.removeEventListener("scroll", onScrollAndSnap, { capture: true });
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("orientationchange", onScroll);
      io?.disconnect();
      ro?.disconnect();
      clearTimeout(settle);
      cancelSettle();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      snapRef.current = 0;
      visibleRef.current = false;
      // Put every ancestor back exactly as it was found. Leaving a repair
      // behind after the section unmounts is how one page's fix becomes
      // another page's bug.
      restore();
    };
    // `settings.scenes` is read inside the snap callback only; re-subscribing
    // every keystroke in the editor would tear the listeners down mid-drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapRef, enabled, emit, start, end, snap, snapDuration]);

  return { scroller, progressRef, visibleRef, diagnosis };
}
