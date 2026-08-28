"use client";

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
 */

import { useEffect } from "react";
import { lockStep } from "./engine";

export default function useScrollLock({ wrapRef, scroller, progressRef, enabled }) {
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
