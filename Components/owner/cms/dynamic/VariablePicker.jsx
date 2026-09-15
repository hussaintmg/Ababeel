"use client";

/**
 * The fx variable picker: a searchable, type-aware tree of every variable the
 * CMS discovered, plus custom variables. Incompatible variables are shown
 * greyed out and cannot be selected, which is what stops broken bindings (an
 * Array dropped into a Heading, a Boolean dropped into an Image).
 *
 * Enhanced for repeater scopes: When inside a repeater, current item fields
 * (e.g. {{item.courseName}}) are displayed right at the top for instant 1-click binding.
 */
import { useMemo, useState, useRef } from "react";
import { Search, ChevronRight, X, Database, Sparkles, Loader2, ListOrdered, Check } from "lucide-react";
import { useCmsVariables } from "@/context/CmsVariablesContext";
import { searchVariables } from "@/lib/cms/search";
import { typeIcon, typeColor, isCompatible, isArrayType } from "@/lib/cms/types";

/* ---------------- tree node ---------------- */

function FieldNode({ field, basePath, fieldType, onPick, depth = 0, query, scopeHint = "" }) {
  const [manuallyOpen, setManuallyOpen] = useState(false);
  // A live search expands the tree; otherwise the author's own toggle decides.
  const open = manuallyOpen || !!query;
  const setOpen = setManuallyOpen;
  const path = `${basePath}.${field.name}`;
  const hasChildren = !!field.children?.length;
  const compatible = isCompatible(fieldType, field.type);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md pr-1 ${compatible ? "hover:bg-blue-50" : "opacity-40"}`}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-0.5 text-gray-400 hover:text-gray-700"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronRight size={13} className={`transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-[18px]" />
        )}
        <button
          type="button"
          disabled={!compatible}
          draggable={compatible}
          onDragStart={(e) => {
            e.dataTransfer.setData("application/x-cms-variable", path);
            e.dataTransfer.setData("text/plain", `{{${path}}}`);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => compatible && onPick(path, field)}
          className="flex-1 flex items-center gap-2 py-1 text-left min-w-0 disabled:cursor-not-allowed"
          title={compatible ? `Insert {{${path}}}` : `${field.type} cannot be used here`}
        >
          <span className="text-[13px]" aria-hidden>{typeIcon(field.type)}</span>
          <span className="text-xs font-mono text-gray-700 truncate">{field.name}</span>
          <span className={`ml-auto shrink-0 rounded border px-1 text-[10px] ${typeColor(field.type)}`}>
            {field.type}
          </span>
        </button>
      </div>
      {open && hasChildren ? (
        <div>
          {field.children.map((child) => (
            <FieldNode
              key={child.name}
              field={child}
              basePath={field.isArray ? `${path}[0]` : path}
              fieldType={fieldType}
              onPick={onPick}
              depth={depth + 1}
              query={query}
              scopeHint={scopeHint}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- picker ---------------- */

export default function VariablePicker({
  fieldType = "text",
  onPick,
  onClose,
  scopeHint = "",
  activeSource = "",
  anchorClassName = "",
  // Height available for the scrolling list — a number or any CSS length. The
  // popover publishes the space it was given as --picker-max-h, so the picker
  // always fits on screen.
  listMaxHeight = "calc(var(--picker-max-h, 400px) - 150px)",
  fullWidth = false,
  // The floating palette supplies its own title bar, so it hides this one.
  hideHeader = false,
}) {
  const { variables, tree, loading } = useCmsVariables();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("models");
  const inputRef = useRef(null);

  const custom = useMemo(() => variables.filter((v) => v.kind === "custom"), [variables]);
  const results = useMemo(
    () => (query ? searchVariables(variables, query, { limit: 60 }) : []),
    [variables, query]
  );

  // Match the active model from the collection source
  const activeModel = useMemo(() => {
    if (!activeSource && !scopeHint) return null;
    const s = String(activeSource || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (s) {
      const match = tree.find(
        (m) =>
          m.key.toLowerCase().replace(/[^a-z0-9]/g, "") === s ||
          m.collectionKey.toLowerCase().replace(/[^a-z0-9]/g, "") === s ||
          m.name.toLowerCase().replace(/[^a-z0-9]/g, "") === s
      );
      if (match) return match;
    }
    if (s.includes("course")) {
      const match = tree.find((m) => m.name.toLowerCase().includes("course"));
      if (match) return match;
    }
    if (scopeHint && scopeHint.toLowerCase().includes("course")) {
      const match = tree.find((m) => m.name.toLowerCase().includes("course"));
      if (match) return match;
    }
    return null;
  }, [activeSource, scopeHint, tree]);

  // Quick fields to show when in repeat mode
  const quickFields = useMemo(() => {
    if (activeModel?.fields?.length) {
      return activeModel.fields;
    }
    // Fallback common fields for courses or general lists
    return [
      { name: "courseName", type: "String", label: "Course Name" },
      { name: "coursePrice", type: "Number", label: "Price" },
      { name: "currencySymbol", type: "String", label: "Currency" },
      { name: "duration", type: "String", label: "Duration" },
      { name: "mode", type: "String", label: "Delivery Mode" },
      { name: "location", type: "String", label: "Location" },
      { name: "referenceNumber", type: "String", label: "Ref Number" },
      { name: "seats", type: "Number", label: "Available Seats" },
      { name: "thumbnail", type: "Image", label: "Thumbnail / Image" },
      { name: "description", type: "String", label: "Description" },
      { name: "startDate", type: "Date", label: "Start Date" },
    ];
  }, [activeModel]);

  return (
    <div className={`${fullWidth ? "w-full" : "w-[360px] max-w-[94vw]"} rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col ${anchorClassName}`}>
      {hideHeader ? null : (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
          <Database size={14} className="text-blue-600" />
          <span className="text-xs font-semibold text-gray-700">Insert a variable</span>
          {onClose ? (
            <button type="button" onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-200 text-gray-500">
              <X size={14} />
            </button>
          ) : null}
        </div>
      )}

      {/* Repeater Scope Quick-Pick banner */}
      {scopeHint ? (
        <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 mb-1">
            <Sparkles size={13} className="text-blue-600 shrink-0" />
            <span>Card Record Variables (<code>{scopeHint}</code>)</span>
            {activeSource ? (
              <span className="ml-auto text-[10px] bg-blue-200/70 text-blue-900 px-1.5 py-0.5 rounded font-mono font-medium">
                {activeSource}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-blue-700 leading-tight mb-2">
            Click any field to bind each repeated card dynamically:
          </p>
          <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
            {quickFields.map((f) => {
              const itemPath = `${scopeHint}.${f.name}`;
              const compatible = isCompatible(fieldType, f.type);
              return (
                <button
                  key={f.name}
                  type="button"
                  disabled={!compatible}
                  onClick={() => compatible && onPick(itemPath, f)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                    compatible
                      ? "bg-white hover:bg-blue-600 hover:text-white border-blue-200 text-blue-900 shadow-xs cursor-pointer"
                      : "opacity-40 border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  title={compatible ? `Insert {{${itemPath}}}` : `${f.type} cannot be used here`}
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="text-[9px] opacity-60">({f.type})</span>
                </button>
              );
            })}
            {/* Built-in index helpers */}
            {["index", "number", "isFirst", "isLast"].map((idxKey) => (
              <button
                key={idxKey}
                type="button"
                onClick={() => onPick(idxKey, { name: idxKey, type: "Number" })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-indigo-200 bg-indigo-50/70 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-all shadow-xs cursor-pointer"
                title={`Insert {{${idxKey}}}`}
              >
                <span>{idxKey}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, price, thumbnail…"
            className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {!query ? (
        <div className="flex gap-1 px-2 pt-2">
          {[
            { id: "models", label: "Database", icon: Database },
            { id: "custom", label: `Custom (${custom.length})`, icon: Sparkles },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${tab === t.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-y-auto p-2 flex-1" style={{ maxHeight: listMaxHeight }}>
        {loading ? (
          <div className="py-8 flex items-center justify-center text-gray-400 text-xs">
            <Loader2 size={14} className="animate-spin mr-2" /> Loading variables…
          </div>
        ) : query ? (
          results.length ? (
            results.map((v) => {
              const compatible = isCompatible(fieldType, v.type);
              return (
                <button
                  key={v.name}
                  type="button"
                  disabled={!compatible}
                  draggable={compatible}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-cms-variable", v.name);
                    e.dataTransfer.setData("text/plain", `{{${v.name}}}`);
                  }}
                  onClick={() => compatible && onPick(v.name, v)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left ${compatible ? "hover:bg-blue-50" : "opacity-40 cursor-not-allowed"}`}
                >
                  <span aria-hidden>{typeIcon(v.type)}</span>
                  <span className="text-xs font-mono text-gray-700 truncate">{v.name}</span>
                  <span className={`ml-auto shrink-0 rounded border px-1 text-[10px] ${typeColor(v.type)}`}>{v.type}</span>
                </button>
              );
            })
          ) : (
            <p className="py-8 text-center text-xs text-gray-400">No variable matches “{query}”.</p>
          )
        ) : tab === "custom" ? (
          custom.length ? (
            custom.map((v) => {
              const compatible = isCompatible(fieldType, v.type);
              return (
                <button
                  key={v.name}
                  type="button"
                  disabled={!compatible}
                  onClick={() => compatible && onPick(v.name, v)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left ${compatible ? "hover:bg-blue-50" : "opacity-40 cursor-not-allowed"}`}
                >
                  <span aria-hidden>{typeIcon(v.type)}</span>
                  <span className="text-xs font-mono text-gray-700 truncate">{v.name}</span>
                  <span className={`ml-auto shrink-0 rounded border px-1 text-[10px] ${typeColor(v.type)}`}>{v.type}</span>
                </button>
              );
            })
          ) : (
            <p className="py-8 text-center text-xs text-gray-400">
              No custom variables yet. Create them in <b>Variables &amp; Data</b>.
            </p>
          )
        ) : (
          tree.map((model) => (
            <ModelGroup
              key={model.name}
              model={model}
              fieldType={fieldType}
              onPick={onPick}
              scopeHint={scopeHint}
              activeSource={activeSource}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ModelGroup({ model, fieldType, onPick, scopeHint = "", activeSource = "" }) {
  const [open, setOpen] = useState(false);
  const listType = "Array<Reference>";
  const listCompatible = isCompatible(fieldType, listType);
  const isCurrentRepeaterSource =
    activeSource &&
    (model.key.toLowerCase() === activeSource.toLowerCase() ||
      model.collectionKey.toLowerCase() === activeSource.toLowerCase() ||
      model.name.toLowerCase().includes(activeSource.toLowerCase()));

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-left transition-colors ${
          isCurrentRepeaterSource ? "bg-blue-50/70 hover:bg-blue-100/70" : "hover:bg-gray-100"
        }`}
      >
        <ChevronRight size={13} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">{model.label}</span>
        {isCurrentRepeaterSource ? (
          <span className="px-1 py-0.2 rounded text-[9px] bg-blue-200 text-blue-800 font-bold uppercase">Active</span>
        ) : null}
        <span className="ml-auto text-[10px] text-gray-400 font-mono">{model.key}</span>
      </button>
      {open ? (
        <div className="pb-1 pl-1">
          <button
            type="button"
            disabled={!listCompatible}
            draggable={listCompatible}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-cms-variable", model.collectionKey);
              e.dataTransfer.setData("text/plain", `{{${model.collectionKey}}}`);
            }}
            onClick={() => listCompatible && onPick(model.collectionKey, { name: model.collectionKey, type: listType })}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left ${listCompatible ? "hover:bg-blue-50" : "opacity-40 cursor-not-allowed"}`}
            title={`A list of ${model.label} records (use as Repeat source)`}
          >
            <span aria-hidden>{typeIcon(listType)}</span>
            <span className="text-xs font-mono text-gray-700">{model.collectionKey}</span>
            <span className={`ml-auto rounded border px-1 text-[10px] ${typeColor(listType)}`}>List</span>
          </button>
          {model.fields.map((f) => (
            <FieldNode
              key={f.name}
              field={f}
              basePath={model.key}
              fieldType={fieldType}
              onPick={onPick}
              scopeHint={scopeHint}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { isArrayType };
