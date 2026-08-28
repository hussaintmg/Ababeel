"use client";

/**
 * One persistent layer over the video — a logo, a standing headline, a
 * watermark, a button, a scrap of custom HTML.
 *
 * Unlike a scene, an overlay item is always mounted. What changes as the
 * visitor scrolls is how far through its own animation it is, which is what
 * makes a logo that drifts up and fades across the whole section possible
 * without it competing with the scenes for the stage.
 */

import { overlayStyle } from "./engine";

const ALIGN = { left: "text-left items-start", center: "text-center items-center", right: "text-right items-end" };

const PLACE = {
  "top-left": { top: 0, left: 0 },
  top: { top: 0, left: 0, right: 0 },
  "top-right": { top: 0, right: 0 },
  left: { top: 0, bottom: 0, left: 0 },
  center: { inset: 0 },
  right: { top: 0, bottom: 0, right: 0 },
  "bottom-left": { bottom: 0, left: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  "bottom-right": { bottom: 0, right: 0 },
};

export default function VideoOverlay({ item, progress, reduced = false }) {
  if (!item) return null;
  const kind = item.kind || (item.image ? "image" : item.html ? "html" : "text");
  const hasContent = item.text || item.image || item.html || item.ctaLabel;
  if (!hasContent) return null;

  const place = PLACE[item.position] || PLACE.center;
  const align = ALIGN[item.align] || ALIGN.center;
  const style = {
    position: "absolute",
    ...place,
    zIndex: parseInt(item.zIndex, 10) || 2,
    padding: item.padding ? `${parseInt(item.padding, 10) || 0}px` : "24px",
    color: item.color || undefined,
    maxWidth: item.width ? (String(item.width).includes("%") ? item.width : `${parseInt(item.width, 10) || 0}px`) : undefined,
    ...overlayStyle(item, progress, { reduced }),
    // The video is the section's surface; an overlay never intercepts a click
    // unless it carries something clickable.
    pointerEvents: item.ctaHref || item.html ? "auto" : "none",
  };

  return (
    <div className={`flex flex-col justify-center ${align}`} style={style}>
      {kind === "image" && item.image ? (
        <img src={item.image} alt={item.alt || ""} style={{ maxWidth: "100%", height: "auto" }} loading="lazy" />
      ) : null}
      {kind === "heading" && item.text ? (
        <h3 className="text-2xl md:text-4xl font-bold drop-shadow">{item.text}</h3>
      ) : null}
      {kind === "text" && item.text ? <p className="text-base md:text-lg drop-shadow">{item.text}</p> : null}
      {kind === "button" && item.ctaLabel ? (
        <a
          href={item.ctaHref || "#"}
          className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03]"
          style={{ background: item.accent || "#f26722", color: item.buttonTextColor || "#fff" }}
        >
          {item.ctaLabel}
        </a>
      ) : null}
      {/* Owner-authored, exactly like the Custom HTML block, and sanitised by
          the same policy the CMS applies when the page is saved. */}
      {kind === "html" && item.html ? <div dangerouslySetInnerHTML={{ __html: item.html }} /> : null}
    </div>
  );
}
