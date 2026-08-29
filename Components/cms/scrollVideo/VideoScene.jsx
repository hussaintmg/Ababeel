"use client";

/**
 * One scene: a slice of the section's scroll with its own content.
 *
 * Scenes hand over to each other. Each owns a Start %–End % of the section, and
 * inside that range it eases in, holds, and eases out again — so a section can
 * tell three or four beats of a story while one video plays underneath, rather
 * than showing one caption for the whole thing.
 *
 * The heading is a real heading in the markup, at the level the author chose,
 * so the text is in the page for search engines and screen readers whether or
 * not the animation ever runs.
 */

import { sceneStyle, scenePlacement } from "./engine";

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" };

export default function VideoScene({ scene, progress, reduced = false, isMobile = false, accent = "#f26722", frameCount = 0 }) {
  if (!scene) return null;

  const visibility = scene.visibility || "both";
  if (visibility === "desktop" && isMobile) return null;
  if (visibility === "mobile" && !isMobile) return null;

  const { active, style } = sceneStyle(scene, progress, { reduced, frameCount });
  const place = scenePlacement(scene.position);
  const align = ALIGN[scene.align] || ALIGN.center;
  const Heading = ["h1", "h2", "h3", "h4"].includes(scene.headingLevel) ? scene.headingLevel : "h2";

  return (
    <div
      className="absolute inset-0 flex flex-col px-6 py-10"
      style={{
        ...place,
        // Kept in the DOM but out of the accessibility tree and out of the way
        // of clicks while it is off — removing it entirely would make the exit
        // transition impossible and would churn the DOM on every scroll.
        ...style,
        pointerEvents: active && style.opacity > 0.5 ? "auto" : "none",
        color: scene.textColor || "#ffffff",
        zIndex: 3,
      }}
      aria-hidden={active && style.opacity > 0.1 ? undefined : "true"}
    >
      <div className={`max-w-3xl ${align}`} style={{ pointerEvents: "inherit" }}>
        {scene.eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: scene.accent || accent }}>
            {scene.eyebrow}
          </p>
        ) : null}
        {scene.heading ? (
          <Heading className="text-3xl md:text-5xl font-bold leading-tight drop-shadow">{scene.heading}</Heading>
        ) : null}
        {scene.text ? <p className="mt-4 text-base md:text-xl opacity-90 drop-shadow">{scene.text}</p> : null}
        {scene.image ? (
          <img
            src={scene.image}
            alt={scene.imageAlt || ""}
            className="mt-6 mx-auto max-h-[38vh] w-auto rounded-xl shadow-2xl"
            loading="lazy"
          />
        ) : null}
        {scene.ctaLabel ? (
          <a
            href={scene.ctaHref || "#"}
            className="mt-6 inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03]"
            style={{ background: scene.accent || accent, color: scene.ctaTextColor || "#ffffff" }}
          >
            {scene.ctaLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
