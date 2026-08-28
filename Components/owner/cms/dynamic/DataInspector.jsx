"use client";

/**
 * Developer data inspector.
 *
 * Shows the resolved data context the preview is rendering with, plus, per
 * block, which variables it binds and what each one resolved to — which is the
 * fastest way to find out why a value came out blank.
 */
import { useMemo, useState } from "react";
import { ChevronRight, Bug, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { pageBindings, probePath } from "@/lib/cms/binding";
import { BLOCK_TYPES } from "@/Components/cms/blockSchemas";
import { inferTypeFromValue, typeIcon } from "@/lib/cms/types";

function preview(value) {
  if (value === null) return "null";
  if (value === undefined) return "—";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return `{ ${Object.keys(value).slice(0, 3).join(", ")}${Object.keys(value).length > 3 ? ", …" : ""} }`;
  const s = String(value);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

function TreeNode({ name, value, depth = 0, filter }) {
  const [open, setOpen] = useState(depth < 1);
  const isBranch = value !== null && typeof value === "object";
  const entries = isBranch ? (Array.isArray(value) ? value.map((v, i) => [String(i), v]) : Object.entries(value)) : [];

  if (filter && !String(name).toLowerCase().includes(filter) && depth > 0 && !isBranch) return null;

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div className="flex items-center gap-1.5 py-0.5">
        {isBranch && entries.length ? (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-gray-400 hover:text-gray-700">
            <ChevronRight size={12} className={`transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-3" />
        )}
        <span className="text-[11px]" aria-hidden>{typeIcon(inferTypeFromValue(value))}</span>
        <span className="text-[11px] font-mono text-gray-700">{name}</span>
        <span className="text-[11px] text-gray-400 truncate">{preview(value)}</span>
      </div>
      {open && isBranch
        ? entries.slice(0, 50).map(([k, v]) => (
            <TreeNode key={k} name={k} value={v} depth={depth + 1} filter={filter} />
          ))
        : null}
    </div>
  );
}

export default function DataInspector({ context, blocks, meta = {} }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("context");
  const bindings = useMemo(() => pageBindings(blocks), [blocks]);
  const filter = query.trim().toLowerCase();

  const rootEntries = useMemo(() => Object.entries(context || {}), [context]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <Bug size={14} className="text-emerald-600" />
        <span className="text-sm font-medium text-gray-800">Data inspector</span>
        <div className="ml-auto flex gap-1">
          {[
            { id: "context", label: "Context" },
            { id: "bindings", label: `Bindings (${bindings.length})` },
            { id: "sources", label: "Sources" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${tab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "context" ? (
        <>
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter keys…"
                className="w-full pl-7 pr-2 py-1 rounded-md border border-gray-200 text-[11px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-auto p-3">
            {rootEntries.length ? (
              rootEntries.map(([k, v]) => <TreeNode key={k} name={k} value={v} filter={filter} />)
            ) : (
              <p className="py-6 text-center text-xs text-gray-400">
                No data yet. Add a data source, or switch the preview to Sample data.
              </p>
            )}
          </div>
        </>
      ) : tab === "bindings" ? (
        <div className="max-h-72 overflow-auto p-3 space-y-2">
          {bindings.length ? (
            bindings.map((b) => (
              <div key={b.id} className="rounded-lg border border-gray-200 p-2">
                <p className="text-[11px] font-semibold text-gray-700">
                  {BLOCK_TYPES[b.type]?.label || b.type}
                  <span className="ml-1 font-mono text-gray-400">#{b.id}</span>
                </p>
                <ul className="mt-1 space-y-0.5">
                  {b.paths.map((p) => {
                    const probe = probePath(context || {}, p);
                    return (
                      <li key={p} className="flex items-center gap-1.5 text-[11px]">
                        {probe.found ? (
                          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                        )}
                        <code className="font-mono text-gray-700">{p}</code>
                        <span className="text-gray-400 truncate">→ {preview(probe.value)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-gray-400">No blocks on this page bind to a variable yet.</p>
          )}
        </div>
      ) : (
        <div className="max-h-72 overflow-auto p-3">
          {Object.keys(meta).length ? (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="py-1">Variable</th>
                  <th>Model</th>
                  <th>Mode</th>
                  <th>Records</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(meta).map(([key, m]) => (
                  <tr key={key} className="border-t border-gray-100">
                    <td className="py-1 font-mono text-gray-700">{key}</td>
                    <td className="text-gray-500">{m.model}</td>
                    <td className="text-gray-500">{m.mode}</td>
                    <td className="text-gray-500">{m.total}</td>
                    <td className={m.error ? "text-red-500" : "text-emerald-600"}>{m.error || "ok"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-xs text-gray-400">No data sources ran for this preview.</p>
          )}
        </div>
      )}
    </div>
  );
}
