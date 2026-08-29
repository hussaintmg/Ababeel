"use client";

/**
 * Static | Dynamic | Formula control wrapped around any block property.
 *
 *  - Static   the original editor for that field type, untouched.
 *  - Dynamic  a variable composer: free text mixed with variable tokens.
 *  - Formula  a safe expression, e.g. {{= course.price * 0.8 }}.
 *
 * The stored value is always a plain string, so an unbound field is byte-for-
 * byte what it was before this feature existed.
 */
import { useMemo, useRef, useState } from "react";
import { Braces, Sigma, Type as TypeIcon, X, CornerDownLeft, AlertTriangle } from "lucide-react";
import { FieldRenderer, Label } from "@/Components/owner/cms/fields";
import VariablePicker from "@/Components/owner/cms/dynamic/VariablePicker";
import PickerPopover, { PICKER_MAX_H } from "@/Components/owner/cms/dynamic/PickerPopover";
import VariableToken from "@/Components/owner/cms/dynamic/VariableToken";
import { useCmsVariables } from "@/context/CmsVariablesContext";
import { isDynamic, tokenizeTemplate, parseExpressionSource, resolveTemplate } from "@/lib/cms/expression";
import { autocompletePaths } from "@/lib/cms/search";
import { isCompatible } from "@/lib/cms/types";

const FORMULA_RE = /^\{\{=([\s\S]*)\}\}$/;

export function modeOf(value) {
  if (typeof value !== "string") return "static";
  if (FORMULA_RE.test(value.trim())) return "formula";
  return isDynamic(value) ? "dynamic" : "static";
}

/**
 * Whether an author's explicit mode choice is still consistent with the stored
 * value. It stays consistent while they are mid-edit (Dynamic with no token
 * inserted yet, Formula with the expression cleared) and stops the moment the
 * value clearly belongs to another mode.
 */
export function modeMatches(mode, value) {
  const actual = modeOf(value);
  if (mode === actual) return true;
  if (mode === "dynamic" && actual === "static") return true;
  if (mode === "formula" && actual === "static") return true;
  return false;
}

/* ---------------- token strip ---------------- */

function TokenStrip({ template, onChange, lookup }) {
  // Each segment carries its token ordinal, computed once — never mutated
  // while rendering.
  const segments = useMemo(() => {
    const raw = tokenizeTemplate(template);
    return raw.map((seg, i) =>
      seg.kind === "token"
        ? { ...seg, tokenIndex: raw.slice(0, i).filter((s) => s.kind === "token").length }
        : seg
    );
  }, [template]);

  if (!segments.some((s) => s.kind === "token")) return null;

  const removeToken = (index) => {
    let out = "";
    let seen = -1;
    for (const seg of segments) {
      if (seg.kind === "token") {
        seen += 1;
        if (seen === index) continue;
        out += `{{${seg.value}}}`;
      } else {
        out += seg.value;
      }
    }
    onChange(out);
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-2 py-1.5">
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          return seg.value ? (
            <span key={i} className="text-xs text-gray-600 whitespace-pre-wrap">{seg.value}</span>
          ) : null;
        }
        const idx = seg.tokenIndex;
        const path = seg.value.replace(/^=/, "").split("|")[0].trim();
        const variable = lookup(path);
        return (
          <VariableToken
            key={i}
            path={seg.value}
            variable={variable || { type: "Unknown" }}
            missing={!variable}
            size="sm"
            onRemove={() => removeToken(idx)}
          />
        );
      })}
    </div>
  );
}

/* ---------------- composer ---------------- */

function Composer({ value, onChange, fieldType, multiline }) {
  const { variables, lookup } = useCmsVariables();
  const ref = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const text = typeof value === "string" ? value : "";
  const fieldRef = useRef(null);

  const insertAtCaret = (snippet) => {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + snippet + text.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      const caret = start + snippet.length;
      el?.setSelectionRange?.(caret, caret);
    });
  };

  // Autocomplete after the user types an opening token.
  const refreshSuggestions = (nextText, caret) => {
    const before = nextText.slice(0, caret);
    const open = before.lastIndexOf("{{");
    const close = before.lastIndexOf("}}");
    if (open === -1 || close > open) {
      setSuggestions([]);
      return;
    }
    const partial = before.slice(open + 2).replace(/^=/, "").trimStart();
    if (/[|\s]/.test(partial)) {
      setSuggestions([]);
      return;
    }
    setSuggestions(autocompletePaths(variables, partial, { limit: 8 }));
  };

  const applySuggestion = (name) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret);
    const open = before.lastIndexOf("{{");
    if (open === -1) return;
    const next = `${text.slice(0, open)}{{${name}}}${text.slice(caret)}`;
    onChange(next);
    setSuggestions([]);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = open + name.length + 4;
      el?.setSelectionRange?.(pos, pos);
    });
  };

  const InputTag = multiline ? "textarea" : "input";

  return (
    <div className="relative">
      <div
        ref={fieldRef}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("application/x-cms-variable")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          const name = e.dataTransfer.getData("application/x-cms-variable");
          setDragOver(false);
          if (!name) return;
          e.preventDefault();
          const variable = lookup(name);
          if (variable && !isCompatible(fieldType, variable.type)) return;
          insertAtCaret(`{{${name}}}`);
        }}
        className={`relative rounded-lg ${dragOver ? "ring-2 ring-blue-500" : ""}`}
      >
        <InputTag
          ref={ref}
          value={text}
          rows={multiline ? 3 : undefined}
          onChange={(e) => {
            onChange(e.target.value);
            refreshSuggestions(e.target.value, e.target.selectionStart ?? e.target.value.length);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSuggestions([]);
          }}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          placeholder="Type text and drop variables in, e.g. Hello {{user.firstName}}"
          className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <button
          type="button"
          onClick={() => setShowPicker((s) => !s)}
          title="Insert a variable"
          className="absolute right-1.5 top-1.5 p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <Braces size={14} />
        </button>
      </div>

      <PickerPopover
        anchorRef={fieldRef}
        open={suggestions.length > 0}
        onClose={() => setSuggestions([])}
        matchAnchorWidth
        maxHeight={260}
        align="start"
      >
        <div
          className="rounded-lg border border-gray-200 bg-white shadow-xl overflow-y-auto"
          style={{ maxHeight: PICKER_MAX_H }}
        >
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applySuggestion(s.name)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50"
            >
              <span className="text-xs font-mono text-gray-700 truncate">{s.name}</span>
              <span className="ml-auto text-[10px] text-gray-400">{s.type}</span>
              <CornerDownLeft size={11} className="text-gray-300" />
            </button>
          ))}
        </div>
      </PickerPopover>

      <PickerPopover anchorRef={fieldRef} open={showPicker} onClose={() => setShowPicker(false)}>
        <VariablePicker
          fieldType={fieldType}
          onClose={() => setShowPicker(false)}
          onPick={(name) => {
            insertAtCaret(`{{${name}}}`);
            setShowPicker(false);
          }}
        />
      </PickerPopover>

      <TokenStrip template={text} onChange={onChange} lookup={lookup} />
    </div>
  );
}

/* ---------------- formula ---------------- */

function FormulaEditor({ value, onChange }) {
  const { variables } = useCmsVariables();
  // The expression lives in the block's value; this component only reads it.
  const text = FORMULA_RE.exec(String(value || "").trim())?.[1] ?? "";
  const error = useMemo(() => {
    if (!text.trim()) return "";
    try {
      parseExpressionSource(text);
      return "";
    } catch (err) {
      return err.message;
    }
  }, [text]);

  const commit = (next) => onChange(`{{=${next}}}`);

  // Live sanity check against one sample row so authors see the shape of the
  // result without leaving the editor.
  const sample = useMemo(() => {
    try {
      const ctx = Object.fromEntries(
        variables.filter((v) => !v.name.includes(".")).map((v) => [v.name, {}])
      );
      return String(resolveTemplate(`{{=${text}}}`, ctx) ?? "");
    } catch {
      return "";
    }
  }, [text, variables]);

  return (
    <div>
      <div className="flex items-start gap-2">
        <span className="mt-2 text-gray-400"><Sigma size={15} /></span>
        <textarea
          value={text}
          onChange={(e) => commit(e.target.value)}
          rows={2}
          spellCheck={false}
          placeholder="course.price * 0.8"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error ? (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-red-600">
          <AlertTriangle size={11} /> {error}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-gray-400">
          Numbers, text, <code className="font-mono">+ - * / %</code>, comparisons, <code className="font-mono">? :</code> and the built-in
          functions. No JavaScript is executed{sample ? ` · sample result: ${sample}` : ""}.
        </p>
      )}
    </div>
  );
}

/* ---------------- the control ---------------- */

const MULTILINE_TYPES = new Set(["textarea", "richtext", "code"]);
const BINDABLE_TYPES = new Set(["text", "textarea", "richtext", "code", "image", "video", "color", "link", "select", "collection"]);

/**
 * Collection fields (the Repeat block's source) always hold a bare variable
 * path — `courses`, `course.lessons` — so they get a dedicated picker limited
 * to Array variables rather than the Static/Dynamic/Formula switch.
 */
function CollectionField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const { lookup } = useCmsVariables();
  const path = String(value || "");
  const variable = lookup(path);

  return (
    <div className="relative">
      <div ref={anchorRef} className="flex items-center gap-1.5">
        <input
          type="text"
          value={path}
          onChange={(e) => onChange(e.target.value.replace(/[{}\s]/g, ""))}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-cms-variable")) e.preventDefault();
          }}
          onDrop={(e) => {
            const name = e.dataTransfer.getData("application/x-cms-variable");
            if (!name) return;
            e.preventDefault();
            const dropped = lookup(name);
            if (dropped && !isCompatible("collection", dropped.type)) return;
            onChange(name);
          }}
          placeholder="courses"
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
          title="Pick a collection"
        >
          <Braces size={14} />
        </button>
      </div>
      {path ? (
        <p className="mt-1 text-[11px] text-gray-400">
          {variable ? (
            <>Bound to <b>{variable.type}</b>{variable.ref ? ` of ${variable.ref}` : ""} — items are available as the item variable below.</>
          ) : (
            <span className="text-amber-600">
              No variable named <code className="font-mono">{path}</code> — add a data source with this name, or pick one below.
            </span>
          )}
        </p>
      ) : null}
      <PickerPopover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <VariablePicker
          fieldType="collection"
          onClose={() => setOpen(false)}
          onPick={(name) => {
            onChange(name);
            setOpen(false);
          }}
        />
      </PickerPopover>
    </div>
  );
}

export function isBindableField(field) {
  return BINDABLE_TYPES.has(field?.type);
}

export default function DynamicField({
  field,
  value,
  onChange,
  fallback,
  onFallbackChange,
  enabled = true,
}) {
  const bindable = enabled && isBindableField(field);
  // The mode is derived from the stored value, with the author's explicit
  // choice remembered for as long as it still fits — no effect, no flicker.
  const [manualMode, setManualMode] = useState(null);
  const mode = manualMode && modeMatches(manualMode, value) ? manualMode : modeOf(value);

  if (!bindable) {
    return <FieldRenderer field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "collection") {
    return <CollectionField value={value} onChange={onChange} />;
  }

  const switchTo = (next) => {
    setManualMode(next);
    if (next === "static" && typeof value === "string" && isDynamic(value)) onChange("");
    if (next === "formula" && !FORMULA_RE.test(String(value || "").trim())) onChange("{{=}}");
    if (next === "dynamic" && FORMULA_RE.test(String(value || "").trim())) onChange("");
  };

  const isLink = field.type === "link";

  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        {[
          { id: "static", label: "Static", icon: TypeIcon },
          { id: "dynamic", label: "Dynamic", icon: Braces },
          { id: "formula", label: "Formula", icon: Sigma },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => switchTo(m.id)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
              mode === m.id ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <m.icon size={11} /> {m.label}
          </button>
        ))}
      </div>

      {mode === "static" ? (
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-cms-variable")) e.preventDefault();
          }}
          onDrop={(e) => {
            const name = e.dataTransfer.getData("application/x-cms-variable");
            if (!name) return;
            e.preventDefault();
            setManualMode("dynamic");
            onChange(`{{${name}}}`);
          }}
        >
          <FieldRenderer field={field} value={value} onChange={onChange} />
        </div>
      ) : mode === "formula" ? (
        <FormulaEditor value={value} onChange={onChange} />
      ) : isLink ? (
        <div className="space-y-2">
          <Composer
            value={typeof value === "object" ? value?.label || "" : ""}
            onChange={(v) => onChange({ ...(value || {}), label: v })}
            fieldType="text"
          />
          <Composer
            value={typeof value === "object" ? value?.href || "" : ""}
            onChange={(v) => onChange({ ...(value || {}), href: v })}
            fieldType="link"
          />
        </div>
      ) : (
        <Composer
          value={value}
          onChange={onChange}
          fieldType={field.type}
          multiline={MULTILINE_TYPES.has(field.type)}
        />
      )}

      {mode !== "static" && onFallbackChange ? (
        <div className="mt-2">
          <Label>Fallback when the variable is empty</Label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fallback ?? ""}
              onChange={(e) => onFallbackChange(e.target.value)}
              placeholder={field.type === "image" ? "/ababeel-logo.svg" : "—"}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fallback ? (
              <button
                type="button"
                onClick={() => onFallbackChange("")}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                title="Clear fallback"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
