"use client";

/**
 * Variables & Data — the CMS page that shows everything the schema discovery
 * found, lets an owner annotate it, add custom variables, and import/export
 * definitions.
 */
import { useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, Download, Upload, Plus, Loader2, Database, Sparkles,
  ChevronRight, X, Copy, AlertTriangle, Trash2, Save, ArrowLeft, Layers,
} from "lucide-react";
import { useCmsVariables } from "@/context/CmsVariablesContext";
import { searchVariables } from "@/lib/cms/search";
import { TYPE_LIST, typeIcon, typeColor } from "@/lib/cms/types";
import { planImport } from "@/lib/cms/importExport";

const ALL = "All Variables";

function timeAgo(iso) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} day(s) ago`;
}

/* ---------------- explorer tree ---------------- */

function FieldRow({ field, basePath, onSelect, selected, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const path = `${basePath}.${field.name}`;
  const hasChildren = !!field.children?.length;
  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md pr-2 ${selected === path ? "bg-blue-50" : "hover:bg-gray-50"}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} className="p-0.5 text-gray-400 hover:text-gray-700">
            <ChevronRight size={13} className={`transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-[18px]" />
        )}
        <button
          onClick={() => onSelect({ ...field, fullPath: path })}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/x-cms-variable", path);
            e.dataTransfer.setData("text/plain", `{{${path}}}`);
          }}
          className="flex-1 flex items-center gap-2 py-1 text-left min-w-0"
        >
          <span aria-hidden>{typeIcon(field.type)}</span>
          <span className="text-xs font-mono text-gray-700 truncate">{field.name}</span>
          <span className={`ml-auto shrink-0 rounded border px-1 text-[10px] ${typeColor(field.type)}`}>{field.type}</span>
        </button>
      </div>
      {open && hasChildren
        ? field.children.map((c) => (
            <FieldRow
              key={c.name}
              field={c}
              basePath={field.isArray ? `${path}[]` : path}
              onSelect={onSelect}
              selected={selected}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  );
}

/* ---------------- detail panel ---------------- */

function DetailPanel({ variable, onSaved }) {
  const [description, setDescription] = useState(variable?.description || "");
  const [saving, setSaving] = useState(false);

  const isCustom = variable?.kind === "custom";
  const path = variable?.fullPath || variable?.name;

  const saveNote = async () => {
    setSaving(true);
    try {
      await axios.put(
        "/api/owner/cms/variables",
        {
          name: path,
          kind: "schema",
          description,
          label: variable.label,
          source: variable.source || variable.sourceModel || "",
          path: variable.path || "",
          type: variable.type,
          ref: variable.ref || "",
        },
        { withCredentials: true }
      );
      toast.success("Description saved");
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!variable) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
        Select a variable to see its type, source and usage.
      </div>
    );
  }

  const rows = [
    ["Variable", <code key="v" className="font-mono text-blue-700">{path}</code>],
    ["Type", <span key="t" className={`rounded border px-1.5 py-0.5 text-[11px] ${typeColor(variable.type)}`}>{variable.type}</span>],
    ["Source", variable.source || variable.sourceModel || (isCustom ? "Custom variable" : "—")],
    ["Path", variable.path || "—"],
    ["Reference", variable.ref || "—"],
    ["Required", variable.required ? "Yes" : "No"],
    ["Nullable", variable.nullable === false ? "No" : "Yes"],
    ["Options", variable.enumValues?.length ? variable.enumValues.join(", ") : "—"],
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span aria-hidden>{typeIcon(variable.type)}</span>
        <code className="text-sm font-mono text-gray-800 truncate">{path}</code>
        {variable.deprecated ? (
          <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
            <AlertTriangle size={10} /> deprecated
          </span>
        ) : null}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`{{${path}}}`);
            toast.success("Token copied");
          }}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-white"
          title="Copy the {{token}} to paste into a field"
        >
          <Copy size={12} /> Copy token
        </button>
      </div>

      <dl className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2 text-xs">
            <dt className="w-24 shrink-0 text-gray-400">{k}</dt>
            <dd className="text-gray-700 break-all">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="px-4 pb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does this field mean? Shown to page authors."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={saveNote}
          disabled={saving}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs hover:bg-gray-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save description
        </button>
      </div>
    </div>
  );
}

/* ---------------- custom variable form ---------------- */

function CustomVariableModal({ initial, onClose, onSaved }) {
  const editing = !!initial;
  const [form, setForm] = useState(
    initial || {
      name: "site.",
      type: "String",
      label: "",
      description: "",
      category: "Custom Variables",
      value: "",
      defaultValue: "",
      required: false,
      scope: "global",
    }
  );
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      if (editing) {
        await axios.put("/api/owner/cms/variables", { ...form, kind: "custom" }, { withCredentials: true });
      } else {
        await axios.post("/api/owner/cms/variables", form, { withCredentials: true });
      }
      toast.success(editing ? "Variable updated" : "Variable created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not save the variable");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{editing ? "Edit custom variable" : "New custom variable"}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
            <input
              value={form.name}
              disabled={editing}
              onChange={(e) => set("name", e.target.value)}
              placeholder="site.primaryColor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <p className="mt-1 text-[11px] text-gray-400">Dots create groups — <code className="font-mono">site.name</code>, <code className="font-mono">site.logo</code>.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
              >
                {TYPE_LIST.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Scope</label>
              <select
                value={form.scope}
                onChange={(e) => set("scope", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
              >
                <option value="global">Global</option>
                <option value="environment">Environment</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Value</label>
              <input
                value={form.value ?? ""}
                onChange={(e) => set("value", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default value</label>
              <input
                value={form.defaultValue ?? ""}
                onChange={(e) => set("defaultValue", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.required} onChange={(e) => set("required", e.target.checked)} />
            Required (page authors must provide a value)
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- import modal ---------------- */

function ImportModal({ onClose, onDone, existingNames, modelNames }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("skip");
  const [applying, setApplying] = useState(false);

  const plan = useMemo(() => {
    if (!text.trim()) return null;
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, error: "That is not valid JSON." };
    }
    return planImport(payload, { existingNames, modelNames, mode });
  }, [text, mode, existingNames, modelNames]);

  const apply = async () => {
    setApplying(true);
    try {
      const res = await axios.post(
        "/api/owner/cms/variables/import",
        { payload: JSON.parse(text), mode, apply: true },
        { withCredentials: true }
      );
      const r = res.data?.data?.results;
      toast.success(`Imported — ${r.created} created, ${r.replaced} replaced, ${r.skipped} skipped`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Import failed");
    } finally {
      setApplying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Import variables</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 cursor-pointer hover:bg-gray-50">
              <Upload size={13} /> Choose a .json file
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setText(await file.text());
                }}
              />
            </label>
            <span className="text-xs text-gray-400">or paste below</span>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[11px] text-gray-400">On conflict</span>
              {[
                { id: "skip", label: "Skip" },
                { id: "replace", label: "Replace" },
                { id: "createNew", label: "Create new" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${mode === m.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            spellCheck={false}
            placeholder={'{\n  "variables": [\n    { "name": "site.name", "type": "String", "value": "Ababeel" }\n  ]\n}'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />

          {plan && !plan.ok ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={12} /> {plan.error}
            </p>
          ) : null}

          {plan?.ok ? (
            <>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  ["Total", plan.summary.total, "text-gray-700"],
                  ["Create", plan.summary.create, "text-emerald-600"],
                  ["Replace", plan.summary.replace, "text-blue-600"],
                  ["Skip", plan.summary.skip, "text-gray-400"],
                  ["Invalid", plan.summary.invalid, "text-red-600"],
                ].map(([label, n, cls]) => (
                  <span key={label} className={cls}>
                    <b>{n}</b> {label}
                  </span>
                ))}
              </div>
              <div className="max-h-56 overflow-auto rounded-lg border border-gray-200">
                <table className="w-full text-[11px]">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-2 py-1">Name</th>
                      <th className="text-left px-2 py-1">Type</th>
                      <th className="text-left px-2 py-1">Action</th>
                      <th className="text-left px-2 py-1">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.items.map((item, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-2 py-1 font-mono text-gray-700">{item.variable.name || "—"}</td>
                        <td className="px-2 py-1 text-gray-500">{item.variable.type}</td>
                        <td className={`px-2 py-1 ${item.ok ? "text-gray-700" : "text-red-600"}`}>{item.action}</td>
                        <td className="px-2 py-1 text-gray-400">
                          {[...item.errors, ...item.warnings].join("; ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={apply}
            disabled={!plan?.ok || applying || plan.summary.total === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {applying ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Apply import
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- workbench ---------------- */

export default function VariablesWorkbench() {
  const { variables, tree, categories, registry, loading, error, reload, sync } = useCmsVariables();
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const existingNames = useMemo(() => new Set(variables.map((v) => v.name)), [variables]);
  const modelNames = useMemo(() => new Set(tree.map((m) => m.name)), [tree]);

  const filtered = useMemo(() => {
    const base = category === ALL ? variables : variables.filter((v) => v.category === category);
    return searchVariables(base, query, { limit: 400 });
  }, [variables, category, query]);

  const customVars = useMemo(() => variables.filter((v) => v.kind === "custom"), [variables]);
  const visibleModels = useMemo(
    () => (category === ALL ? tree : tree.filter((m) => m.category === category)),
    [tree, category]
  );

  const doSync = async () => {
    setSyncing(true);
    try {
      const result = await sync();
      toast.success(
        `Synced — ${result.models} models, ${result.variables} variables${result.deprecated.length ? `, ${result.deprecated.length} deprecated` : ""}`
      );
    } catch (e) {
      toast.error(e?.response?.data?.error || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const removeCustom = async (name) => {
    if (!window.confirm(`Delete the custom variable "${name}"? Pages using it will fall back to their fallback value.`)) return;
    try {
      await axios.delete(`/api/owner/cms/variables?name=${encodeURIComponent(name)}`, { withCredentials: true });
      toast.success("Variable deleted");
      reload();
      setSelected(null);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not delete");
    }
  };

  const sidebar = [{ name: ALL, count: variables.length }, ...categories];

  return (
    <div className="pb-16">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/owner/cms" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> All Pages
        </Link>
        <div className="h-5 w-px bg-gray-200" />
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            <Layers size={18} className="text-blue-600" /> Variables &amp; Data
          </h1>
          <p className="text-xs text-gray-400">
            Discovered from your MongoDB models — bind any of these in the page builder.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Upload size={15} /> Import
          </button>
          {/* These are file downloads from an API route, not page navigations,
              so a plain anchor (with the browser's download handling) is correct. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/owner/cms/variables/export?format=json"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={15} /> Export JSON
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/owner/cms/variables/export?format=csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={15} /> CSV
          </a>
          <button
            onClick={() => {
              setEditing(null);
              setShowCustom(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} /> Custom variable
          </button>
        </div>
      </div>

      {/* sync banner */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="text-xs">
          <p className="text-gray-400">Last synced</p>
          <p className="font-medium text-gray-800">{timeAgo(registry.lastSyncedAt)}</p>
        </div>
        <div className="text-xs">
          <p className="text-gray-400">Models</p>
          <p className="font-medium text-gray-800">{registry.modelCount || tree.length}</p>
        </div>
        <div className="text-xs">
          <p className="text-gray-400">Variables</p>
          <p className="font-medium text-gray-800">{registry.variableCount || variables.length}</p>
        </div>
        <button
          onClick={doSync}
          disabled={syncing}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60"
        >
          {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Sync Models
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)_minmax(0,0.9fr)] gap-5">
        {/* sidebar */}
        <aside className="rounded-xl border border-gray-200 bg-white p-2 h-fit lg:sticky lg:top-24">
          {sidebar.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${category === c.name ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {c.name === "Custom Variables" ? <Sparkles size={13} /> : <Database size={13} />}
              <span className="truncate">{c.name}</span>
              <span className={`ml-auto text-[11px] ${category === c.name ? "text-blue-100" : "text-gray-400"}`}>{c.count}</span>
            </button>
          ))}
        </aside>

        {/* explorer */}
        <section className="min-w-0">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email, price, thumbnail, instructor…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg cms-skeleton" />
              ))}
            </div>
          ) : query ? (
            <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
              {filtered.length ? (
                filtered.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelected(v)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-cms-variable", v.name);
                      e.dataTransfer.setData("text/plain", `{{${v.name}}}`);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span aria-hidden>{typeIcon(v.type)}</span>
                    <code className="text-xs font-mono text-gray-700 truncate">{v.name}</code>
                    <span className="text-[11px] text-gray-400 truncate hidden sm:inline">{v.description}</span>
                    <span className={`ml-auto shrink-0 rounded border px-1 text-[10px] ${typeColor(v.type)}`}>{v.type}</span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-gray-400">No variable matches “{query}”.</p>
              )}
            </div>
          ) : category === "Custom Variables" ? (
            <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
              {customVars.length ? (
                customVars.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                    <button onClick={() => setSelected(v)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      <span aria-hidden>{typeIcon(v.type)}</span>
                      <code className="text-xs font-mono text-gray-700 truncate">{v.name}</code>
                      <span className="text-[11px] text-gray-400 truncate">{String(v.value ?? "")}</span>
                    </button>
                    <span className={`shrink-0 rounded border px-1 text-[10px] ${typeColor(v.type)}`}>{v.type}</span>
                    <button
                      onClick={() => {
                        setEditing(v);
                        setShowCustom(true);
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500"
                      title="Edit"
                    >
                      <Save size={12} />
                    </button>
                    <button onClick={() => removeCustom(v.name)} className="p-1 rounded hover:bg-red-50 text-red-500" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-gray-400">
                  No custom variables yet — create <code className="font-mono">site.name</code>,{" "}
                  <code className="font-mono">site.primaryColor</code> and friends.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleModels.map((model) => (
                <div key={model.name} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <Database size={13} className="text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{model.label}</span>
                    <code className="ml-auto text-[11px] font-mono text-gray-400">
                      {model.key} · {model.collectionKey}
                    </code>
                  </div>
                  <div className="py-1">
                    {model.fields.map((f) => (
                      <FieldRow
                        key={f.name}
                        field={f}
                        basePath={model.key}
                        onSelect={(v) => setSelected({ ...v, source: model.name, category: model.category })}
                        selected={selected?.fullPath}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* detail */}
        <section className="min-w-0 lg:sticky lg:top-24 h-fit">
          <DetailPanel variable={selected} onSaved={reload} />
        </section>
      </div>

      <AnimatePresence>
        {showCustom ? (
          <CustomVariableModal
            initial={editing}
            onClose={() => {
              setShowCustom(false);
              setEditing(null);
            }}
            onSaved={reload}
          />
        ) : null}
        {showImport ? (
          <ImportModal
            onClose={() => setShowImport(false)}
            onDone={reload}
            existingNames={existingNames}
            modelNames={modelNames}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
