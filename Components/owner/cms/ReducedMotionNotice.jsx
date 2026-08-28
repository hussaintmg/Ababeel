"use client";

/**
 * Says so when the editor's own browser has "reduce motion" switched on.
 *
 * This setting is the single most confusing thing about a scroll animation:
 * with it on, the section used to render one frozen frame, which is
 * indistinguishable from a broken animation. The author sees a picture that
 * never changes, checks their frames, re-uploads them, and finds nothing wrong
 * — because nothing is.
 *
 * Windows puts it under Accessibility → Visual effects → Animation effects and
 * plenty of machines have it off, so this is not an edge case worth leaving
 * unexplained.
 */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { reducedMotionMode } from "@/Components/cms/ScrollVideo";

export default function ReducedMotionNotice({ props }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  if (!reduced) return null;
  const mode = reducedMotionMode(props);

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-900">
        <AlertTriangle size={14} /> Your browser has &ldquo;reduce motion&rdquo; switched on
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-900/90">
        {mode === "still" ? (
          <>
            This section is set to show <strong>a single still frame</strong> to visitors with that
            setting — which is what you are seeing here, and why the picture never changes however
            far you scroll. Change &ldquo;If the visitor has reduced motion switched on&rdquo; below
            to see it play.
          </>
        ) : mode === "full" ? (
          <>
            This section is set to play as normal regardless, so what you see is what everyone sees.
          </>
        ) : (
          <>
            The frames still follow your scroll; the eased catch-up and the scroll hold are switched
            off. That is what visitors with this setting get. Turn the setting off in Windows
            (Accessibility → Visual effects → Animation effects) or on macOS (Accessibility →
            Display → Reduce motion) to see it exactly as everyone else does.
          </>
        )}
      </p>
    </div>
  );
}
