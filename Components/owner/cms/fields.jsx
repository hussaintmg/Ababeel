"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { Upload, Loader2, Link2, Bold, Italic, List, Heading2, Heading3 } from "lucide-react";

/* ---------------- primitive inputs ---------------- */

export function Label({ children }) {
  return <label className="block text-xs font-semibold text-gray-600 mb-1.5">{children}</label>;
}

export function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
    />
  );
}

export function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none capitalize"
    >
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 rounded border border-gray-300 cursor-pointer bg-white"
      />
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-3"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      {label ? <span className="text-sm text-gray-700">{label}</span> : null}
    </button>
  );
}

/* ---------------- image picker (upload + url) ---------------- */

export function ImagePicker({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("/api/owner/cms/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (res.data?.success && res.data.url) {
        onChange(res.data.url);
      } else {
        setError(res.data?.error || "Upload failed");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="preview"
            className="h-14 w-14 rounded-lg object-contain border border-gray-200 bg-gray-50"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs bg-gray-50">
            none
          </div>
        )}
        <div className="flex-1">
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL or upload →"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.ico,.svg"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        Maximum 50MB. Large JPG, PNG and WebP files are automatically optimized for fast loading.
      </p>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

/* ---------------- link input ({label, href}) ---------------- */

export function LinkInput({ value, onChange }) {
  const v = value || {};
  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        type="text"
        value={v.label ?? ""}
        onChange={(e) => onChange({ ...v, label: e.target.value })}
        placeholder="Button label"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="relative">
        <Link2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={v.href ?? ""}
          onChange={(e) => onChange({ ...v, href: e.target.value })}
          placeholder="/link or https://"
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

/* ---------------- rich text (textarea + toolbar) ---------------- */

export function RichTextArea({ value, onChange, rows = 8 }) {
  const ref = useRef(null);

  const wrap = (before, after = before) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = value || "";
    const selected = text.slice(start, end) || "text";
    const next = text.slice(0, start) + before + selected + after + text.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    });
  };

  const insertLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    const el = ref.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = value || "";
    const selected = text.slice(start, end) || "link text";
    const next =
      text.slice(0, start) + `<a href="${url}">` + selected + "</a>" + text.slice(end);
    onChange(next);
  };

  const btn = "p-1.5 rounded hover:bg-gray-200 text-gray-600";
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 bg-gray-50 border-b border-gray-200 px-1.5 py-1">
        <button type="button" className={btn} title="Bold" onClick={() => wrap("<strong>", "</strong>")}>
          <Bold size={15} />
        </button>
        <button type="button" className={btn} title="Italic" onClick={() => wrap("<em>", "</em>")}>
          <Italic size={15} />
        </button>
        <button type="button" className={btn} title="Heading 2" onClick={() => wrap("<h2>", "</h2>")}>
          <Heading2 size={15} />
        </button>
        <button type="button" className={btn} title="Heading 3" onClick={() => wrap("<h3>", "</h3>")}>
          <Heading3 size={15} />
        </button>
        <button type="button" className={btn} title="List item" onClick={() => wrap("<ul>\n  <li>", "</li>\n</ul>")}>
          <List size={15} />
        </button>
        <button type="button" className={btn} title="Link" onClick={insertLink}>
          <Link2 size={15} />
        </button>
        <span className="ml-auto text-[11px] text-gray-400 pr-1">HTML</span>
      </div>
      <textarea
        ref={ref}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 text-sm font-mono outline-none resize-y"
        spellCheck={false}
      />
      {value ? (
        <div className="border-t border-gray-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Preview</p>
          <div className="cms-prose text-sm" dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- generic field renderer (schema-driven) ---------------- */

export function FieldRenderer({ field, value, onChange }) {
  const set = (v) => onChange(v);
  switch (field.type) {
    case "textarea":
      return <TextArea value={value} onChange={set} placeholder={field.placeholder} />;
    case "richtext":
      return <RichTextArea value={value} onChange={set} />;
    case "code":
      return (
        <textarea
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-gray-900 text-gray-100"
        />
      );
    case "select":
      return <SelectInput value={value} onChange={set} options={field.options} />;
    case "color":
      return <ColorInput value={value} onChange={set} />;
    case "image":
      return <ImagePicker value={value} onChange={set} />;
    case "boolean":
      return <Toggle value={!!value} onChange={set} label={field.label} />;
    case "link":
      return <LinkInput value={value} onChange={set} />;
    case "list":
      return <ListEditor field={field} value={value} onChange={set} />;
    case "text":
    default:
      return <TextInput value={value} onChange={set} placeholder={field.placeholder} />;
  }
}

/* ---------------- repeatable list editor ---------------- */

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

export function ListEditor({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (i, key, v) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it));
    onChange(next);
  };
  const addItem = () => {
    const blank = {};
    field.itemFields.forEach((f) => {
      blank[f.key] = f.type === "boolean" ? false : f.type === "link" ? { label: "", href: "" } : "";
    });
    onChange([...items, blank]);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">
              {field.itemLabel || "Item"} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="p-1 rounded hover:bg-gray-200 text-gray-500" title="Move up">
                <ChevronUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="p-1 rounded hover:bg-gray-200 text-gray-500" title="Move down">
                <ChevronDown size={14} />
              </button>
              <button type="button" onClick={() => remove(i)} className="p-1 rounded hover:bg-red-100 text-red-500" title="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-2.5">
            {field.itemFields.map((f) => (
              <div key={f.key}>
                {f.type !== "boolean" ? <Label>{f.label}</Label> : null}
                <FieldRenderer field={f} value={item[f.key]} onChange={(v) => update(i, f.key, v)} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus size={15} /> Add {field.itemLabel || "item"}
      </button>
    </div>
  );
}
