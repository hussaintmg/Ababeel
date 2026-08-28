"use client";

/**
 * Anchored popover rendered into a portal.
 *
 * The block cards, their expand/collapse animation wrapper and the preview
 * column all clip their overflow, so an absolutely positioned dropdown inside
 * a field was cut off. Portalling to <body> and positioning with fixed
 * coordinates takes the popover out of every clipping ancestor; the placement
 * flips it above the field when there is not enough room below and always
 * keeps it inside the viewport.
 *
 * Placement is written straight to the node's style rather than held in state,
 * so following the field during a scroll costs no React renders. The space the
 * popover actually got is published as the `--picker-max-h` custom property,
 * which the content uses to size its own scroll area.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const GAP = 6;
const EDGE = 8;
const MIN_HEIGHT = 200;

// Portals need a DOM; this is false during SSR and true once hydrated.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

export default function PickerPopover({
  anchorRef,
  open,
  onClose,
  width = 340,
  maxHeight = 420,
  align = "end",
  // Match the anchor's width instead of using `width` — used by the inline
  // autocomplete list so it lines up with the input it belongs to.
  matchAnchorWidth = false,
  children,
}) {
  const isClient = useIsClient();
  const panelRef = useRef(null);

  const place = useCallback(() => {
    const anchor = anchorRef?.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const r = anchor.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const desired = matchAnchorWidth ? Math.max(r.width, 220) : width;
    const w = Math.min(desired, vw - EDGE * 2);

    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    // Flip upwards only when that genuinely gives more room.
    const up = below < MIN_HEIGHT && above > below;
    const height = Math.max(MIN_HEIGHT, Math.min(maxHeight, up ? above : below));

    let left = align === "end" ? r.right - w : r.left;
    left = Math.min(Math.max(EDGE, left), vw - w - EDGE);
    const top = up ? Math.max(EDGE, r.top - height - GAP) : r.bottom + GAP;

    panel.style.top = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.width = `${Math.round(w)}px`;
    panel.style.setProperty("--picker-max-h", `${Math.round(height)}px`);
    panel.style.visibility = "visible";
  }, [anchorRef, width, maxHeight, align, matchAnchorWidth]);

  // Position before paint so the panel never flashes in the wrong place, and
  // keep it pinned to the field while any ancestor scrolls.
  useEffect(() => {
    if (!open) return undefined;
    place();
    // `true` captures scrolls of the inner panes, not just the window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!isClient || !open) return null;

  return createPortal(
    <div
      ref={panelRef}
      // Marks an open popover so the floating Variables palette knows Escape
      // was meant for the popover, not for the palette.
      data-picker-popover=""
      // Hidden until the first measurement lands, so it cannot appear at 0,0.
      style={{ position: "fixed", top: 0, left: 0, width, zIndex: 1200, visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body
  );
}

/** The height the popover was given, for a child that scrolls its own content. */
export const PICKER_MAX_H = "var(--picker-max-h, 320px)";
