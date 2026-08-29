"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/Components/ui/cn";

/**
 * Scroll-into-view reveal.
 *
 * Reuses the CMS's existing `[data-cms-anim]` CSS rather than introducing a
 * second animation system: those rules already define every entrance the page
 * builder offers, and already disable themselves under `prefers-reduced-motion`.
 * A parallel implementation would be one more place to keep that promise, and
 * the first place it would be forgotten.
 *
 * The visible class is added to the DOM node in an effect rather than through
 * React state, so the server and client render identical markup and there is no
 * hydration mismatch — the same approach `BlockRenderer`'s `AnimatedBlock`
 * takes, for the same reason.
 */
export function Reveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0,
  className = "",
  as: Tag = "div",
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!animation) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const view = el.ownerDocument?.defaultView || window;
    if (typeof view.IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return undefined;
    }

    const io = new view.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animation]);

  const style = {};
  if (delay) style["--cms-anim-delay"] = `${delay}ms`;
  if (duration) style["--cms-anim-duration"] = `${duration}ms`;

  return (
    <Tag
      ref={ref}
      data-cms-anim={animation || undefined}
      style={Object.keys(style).length ? style : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A list whose children reveal one after another.
 *
 * The stagger is capped: past about half a second the last card in a row is
 * still arriving after the visitor has started reading the first, which reads
 * as slow rather than considered.
 */
export function RevealStagger({
  children,
  animation = "fade-up",
  step = 70,
  maxDelay = 420,
  className = "",
  as: Tag = "div",
  ...rest
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <Tag className={cn(className)} {...rest}>
      {items.map((child, i) => (
        // h-full so the wrapper does not break a grid's equal-height rows: the
        // wrapper becomes the grid item, and without this the card inside it
        // shrinks to its own content and the buttons stop lining up.
        <Reveal
          key={child?.key ?? i}
          animation={animation}
          delay={Math.min(i * step, maxDelay)}
          className="h-full"
        >
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}

export default Reveal;
