"use client";

/**
 * Floating, draggable Variables palette.
 *
 * It used to sit under the live preview, which pushed the preview off screen
 * and put the variables a long way from the field you were binding. As a
 * floating window it stays wherever you park it — next to the editor column —
 * while you scroll and edit, and variables can be dragged straight from it
 * into any field.
 *
 * Dragging the window is bound to its header only, so the HTML5 drag of the
 * variable rows inside is untouched. The position survives a reload.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripHorizontal, X, Minus, Square } from "lucide-react";
import VariablePicker from "@/Components/owner/cms/dynamic/VariablePicker";

const STORAGE_KEY = "cms.variablesPanel.position";
const WIDTH = 360;
const HEIGHT = 520;
const EDGE = 8;

function clampToViewport(x, y, w, h) {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  return {
    x: Math.min(Math.max(EDGE, x), Math.max(EDGE, vw - w - EDGE)),
    y: Math.min(Math.max(EDGE, y), Math.max(EDGE, vh - 48 - EDGE)),
  };
}

function loadPosition() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x !== "number" || typeof p?.y !== "number") return null;
    return clampToViewport(p.x, p.y, WIDTH, HEIGHT);
  } catch {
    return null;
  }
}

function defaultPosition() {
  if (typeof window === "undefined") return { x: 24, y: 120 };
  return clampToViewport(document.documentElement.clientWidth - WIDTH - 32, 120, WIDTH, HEIGHT);
}

export default function VariablesFloatingPanel({ open, onClose }) {
  const [pos, setPos] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const panelRef = useRef(null);
  const dragRef = useRef(null);

  // Positioned on first open, from the last place the user left it. Derived
  // during render (the same adjust-state-on-prop-change pattern the sidebar
  // uses) rather than in an effect, so the panel never paints at 0,0 first.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && !pos) setPos(loadPosition() || defaultPosition());
  }

  const startDrag = useCallback(
    (e) => {
      // Left button / touch only, and never from the header's own buttons.
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest("button")) return;
      const panel = panelRef.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    },
    []
  );

  const onDrag = useCallback((e) => {
    const d = dragRef.current;
    const panel = panelRef.current;
    if (!d || !panel) return;
    const next = clampToViewport(e.clientX - d.dx, e.clientY - d.dy, panel.offsetWidth, panel.offsetHeight);
    // Written straight to the node while dragging: no re-render per pointer move.
    panel.style.left = `${next.x}px`;
    panel.style.top = `${next.y}px`;
  }, []);

  const endDrag = useCallback((e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const panel = panelRef.current;
    if (!panel) return;
    const next = { x: parseInt(panel.style.left, 10) || 0, y: parseInt(panel.style.top, 10) || 0 };
    setPos(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode — the panel just forgets where it was */
    }
  }, []);

  // Keep it on screen when the window is resized.
  useEffect(() => {
    if (!open) return undefined;
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const next = clampToViewport(panel.offsetLeft, panel.offsetTop, panel.offsetWidth, panel.offsetHeight);
      panel.style.left = `${next.x}px`;
      panel.style.top = `${next.y}px`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !document.querySelector("[data-picker-popover]")) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "fixed", left: pos.x, top: pos.y, width: WIDTH, zIndex: 1100 }}
      className="rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
      role="dialog"
      aria-label="Variables"
    >
      <div
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <GripHorizontal size={14} className="opacity-80" />
        <span className="text-xs font-semibold">Variables</span>
        <span className="text-[11px] text-blue-100 truncate">drag me anywhere</span>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-white/20"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <Square size={12} /> : <Minus size={14} />}
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/20" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <>
          <VariablePicker
            fieldType={null}
            fullWidth
            hideHeader
            listMaxHeight={HEIGHT - 150}
            onPick={(name) => {
              // Clicking copies the token; dragging is the way to bind a field.
              navigator.clipboard?.writeText(`{{${name}}}`).catch(() => {});
            }}
            anchorClassName="!border-0 !shadow-none !rounded-none"
          />
          <p className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500">
            Drag a variable onto any field, or click one to copy its{" "}
            <code className="font-mono">{"{{token}}"}</code>.
          </p>
        </>
      )}
    </div>,
    document.body
  );
}
