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
        "html,body{margin:0;padding:0;background:#fff;} " +
        "body{overflow-x:hidden;overflow-x:clip;} " +
        "img,video,canvas{max-width:100%;}";
      head.appendChild(base);
    };

    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.head, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [doc]);
}

/**
 * @param width       device width in px, or 0 to fill the panel
 * @param height      visible height of the panel
 * @param zoom        scales an oversized device down to the panel width
 * @param onDocument  called with the frame's document once it exists
 */
export default function PreviewFrame({ width = 0, height = 520, zoom = true, onDocument, children }) {
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

  // Follow the content's own height, so the frame scrolls with the panel
  // instead of trapping a second scrollbar inside it.
  useEffect(() => {
    if (!doc?.body || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => setInner(doc.body.scrollHeight || height));
    ro.observe(doc.body);
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
          // about:blank keeps the frame same-origin, which is what lets React
          // portal into it and the stylesheets be cloned across.
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
      {doc?.body ? createPortal(children, doc.body) : null}
    </div>
  );
}
