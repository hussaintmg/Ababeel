"use client";

/**
 * The preview, rendered inside an iframe at a chosen device width.
 *
 * Narrowing a `<div>` does not preview a phone. Tailwind's breakpoints — and
 * every `@media` rule on the page — are answered by the browser window, so a
 * 390px-wide div in a 1600px window still lays out as desktop, only squashed.
 * The one element with its own viewport is an iframe, so the preview renders
 * into one: at 390px the iframe *is* 390px wide and the mobile rules fire.
 *
 * The React tree is portalled into the frame rather than re-mounted from a URL,
 * so editing a field still updates the preview on the next keystroke, and the
 * page's stylesheets are mirrored across (and kept mirrored, so a dev-time
 * hot reload does not leave the frame unstyled).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Widths worth previewing, and what each is standing in for. */
export const DEVICES = [
  { id: "mobile", label: "Mobile", width: 390, title: "iPhone-class, 390px" },
  { id: "tablet", label: "Tablet", width: 820, title: "iPad-class, 820px" },
  { id: "desktop", label: "Desktop", width: 1440, title: "Laptop, 1440px" },
  { id: "fluid", label: "Fit", width: 0, title: "Fills the panel" },
];

/** Copy the parent's stylesheets into the frame, and keep them in step. */
function useMirroredStyles(doc) {
  useEffect(() => {
    if (!doc) return undefined;

    const sync = () => {
      const wanted = [...document.querySelectorAll('style,link[rel="stylesheet"]')];
      const head = doc.head;
      // Cheap identity: tag + href/text length. Enough to notice a hot reload
      // without re-cloning every stylesheet on every mutation.
      const key = (n) => `${n.tagName}:${n.getAttribute("href") || n.textContent?.length || 0}`;
      const have = new Set([...head.querySelectorAll("style,link")].map(key));
      const want = new Set(wanted.map(key));
      if (have.size === want.size && [...want].every((k) => have.has(k))) return;

      head.querySelectorAll("style,link").forEach((n) => n.remove());
      for (const node of wanted) head.appendChild(node.cloneNode(true));
      // The frame is a document of its own: it gets none of the host page's
      // resets, so give it the ones the blocks assume.
      const base = doc.createElement("style");
      base.textContent =
        "html,body{margin:0;padding:0;background:#fff;min-height:0 !important;height:auto !important;} " +
        "body{overflow-x:hidden;overflow-x:clip;} " +
        "img,video,canvas{max-width:100%;} " +
        "[data-cms-selected='true']{outline:3px solid #2563eb !important;outline-offset:3px !important;border-radius:12px !important;position:relative !important;box-shadow:0 0 0 4px rgba(37,99,235,0.2) !important;transition:all 0.25s ease-in-out !important;} " +
        "[data-cms-selected='true']::after{content:'Selected Section';position:absolute;top:10px;right:14px;background:#2563eb;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.02em;padding:3px 9px;border-radius:6px;box-shadow:0 4px 10px rgba(0,0,0,0.2);z-index:99999;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;} ";
      head.appendChild(base);
    };

    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.head, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [doc]);
}

/**
 * @param width            device width in px, or 0 to fill the panel
 * @param height           visible height of the panel
 * @param zoom             scales an oversized device down to the panel width
 * @param selectedBlockId  currently active block id to focus and highlight
 * @param onSelectBlock    callback when clicking a section in preview
 * @param onDocument       called with the frame's document once it exists
 */
export default function PreviewFrame({
  width = 0,
  height = 520,
  zoom = true,
  selectedBlockId = null,
  onSelectBlock = null,
  onDocument,
  children,
}) {
  const ref = useRef(null);
  const [doc, setDoc] = useState(null);
  const [panel, setPanel] = useState(0);
  const [inner, setInner] = useState(height);
  const holder = useRef(null);

  // The frame is written once; after that React owns its body.
  useEffect(() => {
    const frame = ref.current;
    if (!frame) return undefined;
    const attach = () => {
      const d = frame.contentDocument;
      if (d?.body) setDoc(d);
    };
    attach();
    frame.addEventListener("load", attach);
    return () => frame.removeEventListener("load", attach);
  }, []);

  useMirroredStyles(doc);

  // Focus and scroll active selected block into view
  useEffect(() => {
    if (!doc?.body) return;
    doc.querySelectorAll("[data-cms-selected='true']").forEach((el) => {
      el.removeAttribute("data-cms-selected");
    });
    if (!selectedBlockId) return;
    const target = doc.querySelector(`[data-cms-id="${selectedBlockId}"]`);
    if (target) {
      target.setAttribute("data-cms-selected", "true");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [doc, selectedBlockId]);

  // Click any section in preview to select it in the builder
  useEffect(() => {
    if (!doc?.body || !onSelectBlock) return;
    const handleClick = (e) => {
      const blockEl = e.target.closest("[data-cms-id]");
      if (blockEl) {
        const id = blockEl.getAttribute("data-cms-id");
        if (id) onSelectBlock(id);
      }
    };
    doc.body.addEventListener("click", handleClick);
    return () => doc.body.removeEventListener("click", handleClick);
  }, [doc, onSelectBlock]);

  // Hand the document up: the HTML tab reads a section's markup out of it.
  useEffect(() => {
    onDocument?.(doc);
  }, [doc, onDocument]);

  // Track the panel width so an oversized device can be scaled to fit.
  useEffect(() => {
    const el = holder.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([e]) => setPanel(e.contentRect.width));
    ro.observe(el);
    setPanel(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Follow the content's own height, eliminating runaway bottom whitespace
  useEffect(() => {
    if (!doc?.body || typeof ResizeObserver === "undefined") return undefined;
    const updateHeight = () => {
      const root = doc.getElementById("cms-preview-content") || doc.body;
      const elements = Array.from(root.children).filter(
        (el) => el.tagName !== "STYLE" && el.tagName !== "SCRIPT"
      );
      if (!elements.length) {
        setInner(height);
        return;
      }
      let maxBottom = 0;
      for (const el of elements) {
        const compStyle = doc.defaultView?.getComputedStyle(el);
        if (compStyle?.position === "fixed") continue;
        const bottom = el.offsetTop + el.offsetHeight;
        if (bottom > maxBottom) maxBottom = bottom;
      }
      const targetHeight = Math.max(maxBottom + 24, height);
      setInner((prev) => (Math.abs(prev - targetHeight) > 6 ? targetHeight : prev));
    };

    const ro = new ResizeObserver(updateHeight);
    ro.observe(doc.body);
    const content = doc.getElementById("cms-preview-content");
    if (content) ro.observe(content);
    updateHeight();
    return () => ro.disconnect();
  }, [doc, height]);

  const deviceWidth = width || panel || 0;
  const scale = useMemo(() => {
    if (!zoom || !width || !panel || width <= panel) return 1;
    return panel / width;
  }, [zoom, width, panel]);

  return (
    <div ref={holder} className="w-full bg-gray-100" style={{ height, overflow: "auto" }}>
      <div
        style={{
          width: deviceWidth ? deviceWidth * scale : "100%",
          height: inner * scale,
          margin: "0 auto",
        }}
      >
        <iframe
          ref={ref}
          title="Page preview"
          src="about:blank"
          scrolling="no"
          style={{
            width: deviceWidth || "100%",
            height: inner,
            border: 0,
            display: "block",
            background: "#fff",
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      {doc?.body
        ? createPortal(
            <div id="cms-preview-content" style={{ minHeight: "100%", width: "100%", overflow: "visible" }}>
              {children}
            </div>,
            doc.body
          )
        : null}
    </div>
  );
}
