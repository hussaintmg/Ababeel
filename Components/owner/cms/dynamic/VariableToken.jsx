"use client";

/**
 * The visual variable chip. Bound fields never show raw `{{user.email}}` text —
 * they show a typed, coloured, removable token that can also be dragged.
 */
import { X, AlertTriangle } from "lucide-react";
import { typeIcon, typeColor } from "@/lib/cms/types";

export function VariableToken({ variable, path, onRemove, draggable = true, size = "md", missing = false }) {
  const name = path || variable?.name || "";
  const type = variable?.type;
  const cls = missing ? "bg-amber-50 text-amber-800 border-amber-300" : typeColor(type);
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";

  return (
    <span
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-cms-variable", name);
        e.dataTransfer.setData("text/plain", `{{${name}}}`);
        e.dataTransfer.effectAllowed = "copy";
      }}
      title={missing ? `${name} — not found in the current schema` : `${name} · ${type || "Unknown"}`}
      className={`inline-flex items-center gap-1 rounded-md border font-mono ${pad} ${cls} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <span aria-hidden>{missing ? <AlertTriangle size={11} /> : typeIcon(type)}</span>
      <span className="truncate max-w-[180px]">{name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-60 hover:opacity-100"
          title="Remove this variable"
        >
          <X size={11} />
        </button>
      ) : null}
    </span>
  );
}

export default VariableToken;
