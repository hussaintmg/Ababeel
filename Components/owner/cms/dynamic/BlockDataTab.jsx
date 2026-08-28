"use client";

/**
 * The block editor's "Data" tab: everything that makes one block dynamic —
 * visibility conditions, conditional properties, dynamic style values and
 * (for ordinary blocks) a direct repeat over a collection.
 */
import { useState } from "react";
import { Plus, Trash2, Repeat, Palette, Braces } from "lucide-react";
import ConditionBuilder from "@/Components/owner/cms/dynamic/ConditionBuilder";
import VariablePicker from "@/Components/owner/cms/dynamic/VariablePicker";
import { Label } from "@/Components/owner/cms/fields";
import { BLOCK_TYPES, isContainer } from "@/Components/cms/blockSchemas";
import { newGroup } from "@/lib/cms/conditions";
import { defaultRepeat } from "@/lib/cms/binding";

// Style keys that accept a bound value (colours, sizes, opacity…).
const DYNAMIC_STYLE_KEYS = [
  { key: "bgColor", label: "Background color", fieldType: "color" },
  { key: "textColor", label: "Text color", fieldType: "color" },
  { key: "bgImage", label: "Background image", fieldType: "image" },
  { key: "gradFrom", label: "Gradient from", fieldType: "color" },
  { key: "gradTo", label: "Gradient to", fieldType: "color" },
  { key: "minHeight", label: "Min height (px)", fieldType: "text" },
  { key: "maxWidth", label: "Max width (px)", fieldType: "text" },
  { key: "radius", label: "Corner radius (px)", fieldType: "text" },
  { key: "className", label: "CSS class", fieldType: "text" },
];

function BoundInput({ value, onChange, fieldType, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-cms-variable")) e.preventDefault();
          }}
          onDrop={(e) => {
            const name = e.dataTransfer.getData("application/x-cms-variable");
            if (!name) return;
            e.preventDefault();
            onChange(`{{${name}}}`);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
          title="Insert a variable"
        >
          <Braces size={13} />
        </button>
      </div>
      {open ? (
        <div className="absolute z-50 mt-1 right-0">
          <VariablePicker
            fieldType={fieldType}
            onClose={() => setOpen(false)}
            onPick={(name) => {
              onChange(`{{${name}}}`);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function BlockDataTab({ block, onChange, features = {} }) {
  const def = BLOCK_TYPES[block.type] || {};
  const style = block._style || {};
  const repeat = block._repeat || defaultRepeat();
  const condProps = Array.isArray(block._condProps) ? block._condProps : [];

  const propOptions = (def.fields || [])
    .filter((f) => ["text", "textarea", "richtext", "image", "video", "color", "select", "code"].includes(f.type))
    .map((f) => ({ key: f.key, label: f.label, fieldType: f.type }));

  const setRepeat = (patch) => onChange({ ...block, _repeat: { ...repeat, ...patch } });
  const setCondProps = (next) => onChange({ ...block, _condProps: next });

  return (
    <div className="space-y-4">
      {features.conditions !== false ? (
        <ConditionBuilder
          value={block._conditions}
          onChange={(v) => onChange({ ...block, _conditions: v })}
        />
      ) : null}

      {/* ---------- repeat this block ---------- */}
      {features.repeater !== false && !isContainer(block.type) ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-center gap-2">
            <Repeat size={14} className="text-gray-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Repeat this block for every record
            </span>
            <button
              type="button"
              onClick={() => setRepeat({ enabled: !repeat.enabled })}
              className={`ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${repeat.enabled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${repeat.enabled ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
          {repeat.enabled ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Collection</Label>
                <BoundInput
                  value={repeat.source}
                  onChange={(v) => setRepeat({ source: v.replace(/[{}]/g, "") })}
                  fieldType="collection"
                  placeholder="courses"
                />
              </div>
              <div>
                <Label>Item variable name</Label>
                <input
                  type="text"
                  value={repeat.item ?? "item"}
                  onChange={(e) => setRepeat({ item: e.target.value })}
                  placeholder="course"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label>Max items</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={repeat.limit ?? ""}
                  onChange={(e) => setRepeat({ limit: e.target.value })}
                  placeholder="blank = all"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label>Skip first</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={repeat.offset ?? ""}
                  onChange={(e) => setRepeat({ offset: e.target.value })}
                  placeholder="0"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400">
              For a full card layout use the <b>Repeat (Collection)</b> block instead — it can hold several blocks per record.
            </p>
          )}
        </div>
      ) : null}

      {/* ---------- dynamic style values ---------- */}
      {features.dynamicCss !== false ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={14} className="text-gray-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Dynamic style values</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DYNAMIC_STYLE_KEYS.map((s) => (
              <div key={s.key}>
                <Label>{s.label}</Label>
                <BoundInput
                  value={style[s.key]}
                  onChange={(v) => onChange({ ...block, _style: { ...style, [s.key]: v } })}
                  fieldType={s.fieldType}
                  placeholder={`{{site.primaryColor}}`}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            These are the same values as the Design tab, expressed as variables — drop a variable in, or
            leave a field blank to keep whatever the Design tab is set to.
          </p>
        </div>
      ) : null}

      {/* ---------- conditional properties ---------- */}
      {features.conditions !== false ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Conditional properties
            </span>
            <button
              type="button"
              onClick={() =>
                setCondProps([
                  ...condProps,
                  { prop: propOptions[0]?.key || "", target: "prop", group: newGroup(), then: "", else: "" },
                ])
              }
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-gray-300 text-[11px] text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              <Plus size={12} /> Add rule
            </button>
          </div>

          {!condProps.length ? (
            <p className="text-[11px] text-gray-400">
              Swap a property depending on the data — e.g. a featured record gets a different background.
            </p>
          ) : null}

          <div className="space-y-3">
            {condProps.map((rule, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={rule.target === "style" ? "style" : "prop"}
                    onChange={(e) => {
                      const next = [...condProps];
                      next[i] = { ...rule, target: e.target.value, prop: "" };
                      setCondProps(next);
                    }}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="prop">Content property</option>
                    <option value="style">Style value</option>
                  </select>
                  <select
                    value={rule.prop || ""}
                    onChange={(e) => {
                      const next = [...condProps];
                      next[i] = { ...rule, prop: e.target.value };
                      setCondProps(next);
                    }}
                    className="flex-1 min-w-[140px] px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">Choose…</option>
                    {(rule.target === "style" ? DYNAMIC_STYLE_KEYS : propOptions).map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCondProps(condProps.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500"
                    title="Remove rule"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="mt-2">
                  <ConditionBuilder
                    value={rule.group}
                    onChange={(g) => {
                      const next = [...condProps];
                      next[i] = { ...rule, group: g };
                      setCondProps(next);
                    }}
                    title="When"
                  />
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label>Then</Label>
                    <BoundInput
                      value={rule.then}
                      onChange={(v) => {
                        const next = [...condProps];
                        next[i] = { ...rule, then: v };
                        setCondProps(next);
                      }}
                      fieldType="text"
                      placeholder="#f59e0b or {{course.color}}"
                    />
                  </div>
                  <div>
                    <Label>Otherwise (optional)</Label>
                    <BoundInput
                      value={rule.else}
                      onChange={(v) => {
                        const next = [...condProps];
                        next[i] = { ...rule, else: v };
                        setCondProps(next);
                      }}
                      fieldType="text"
                      placeholder="leave blank to keep the normal value"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
