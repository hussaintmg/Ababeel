"use client";

/**
 * The block editor's "Data" tab: everything that makes one block dynamic —
 * visibility conditions, conditional properties, dynamic style values and
 * (for ordinary blocks) a direct repeat over a collection.
 */
import { useRef, useState } from "react";
import { Plus, Trash2, Repeat, Palette, Braces } from "lucide-react";
import ConditionBuilder from "@/Components/owner/cms/dynamic/ConditionBuilder";
import VariablePicker from "@/Components/owner/cms/dynamic/VariablePicker";
import PickerPopover from "@/Components/owner/cms/dynamic/PickerPopover";
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
  const anchorRef = useRef(null);
  return (
    <div className="relative">
      <div ref={anchorRef} className="flex items-center gap-1">
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
      <PickerPopover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <VariablePicker
          fieldType={fieldType}
          onClose={() => setOpen(false)}
          onPick={(name) => {
            onChange(`{{${name}}}`);
            setOpen(false);
          }}
        />
      </PickerPopover>
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

  const hasListField = (def.fields || []).some((f) => f.type === "list");

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
            <div className="mt-3 space-y-3">
              {/* Preset Collection Quick Pick */}
              <div>
                <Label>Quick Select Database Collection</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    { id: "courses", label: "Courses (courses)", alias: "course" },
                    { id: "courseRef", label: "Courses (courseRef)", alias: "course" },
                    { id: "candidates", label: "Candidates", alias: "candidate" },
                    { id: "testimonials", label: "Testimonials", alias: "testimonial" },
                    { id: "teamMembers", label: "Team / Instructors", alias: "member" },
                  ].map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setRepeat({ source: col.id, alias: col.alias, item: col.alias })}
                      className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                        (repeat.source || "").toLowerCase() === col.id.toLowerCase()
                          ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Collection Source</Label>
                  <BoundInput
                    value={repeat.source}
                    onChange={(v) => {
                      const clean = v.replace(/[{}]/g, "");
                      setRepeat({
                        source: clean,
                        alias: repeat.alias && repeat.alias !== "item" ? repeat.alias : (clean.replace(/s$/, "") || "item"),
                        item: repeat.item && repeat.item !== "item" ? repeat.item : (clean.replace(/s$/, "") || "item"),
                      });
                    }}
                    fieldType="collection"
                    placeholder="courses"
                  />
                </div>
                <div>
                  <Label>Loop Alias (Variable Name)</Label>
                  <input
                    type="text"
                    value={repeat.alias || repeat.item || "item"}
                    onChange={(e) => setRepeat({ alias: e.target.value, item: e.target.value })}
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

                {hasListField ? (
                  <div className="sm:col-span-2">
                    <Label>Repeater Target</Label>
                    <select
                      value={repeat.target || "items"}
                      onChange={(e) => setRepeat({ target: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="items">Repeat inner cards/items (1 component, multiple cards)</option>
                      <option value="block">Repeat entire section/block (multiple sections)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-gray-500">
                      <b>Repeat inner cards</b> keeps one section header and repeats the cards from dynamic data.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Guidance for card variables */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                  <span>How to use fields in each card:</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Go to the <b>Content</b> tab of this block and bind any field using <code className="font-mono bg-blue-100 px-1 py-0.5 rounded font-bold">{repeat.item || "item"}.&lt;fieldName&gt;</code>:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] font-mono">
                  {["courseName", "coursePrice", "duration", "mode", "location", "referenceNumber", "thumbnail"].map((fn) => (
                    <span key={fn} className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-800">
                      {`{{${repeat.item || "item"}.${fn}}}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Empty state handling */}
              <div className="pt-2 border-t border-gray-200">
                <Label>When database collection is empty (0 records):</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div>
                    <select
                      value={repeat.emptyMode || "showSample"}
                      onChange={(e) => setRepeat({ emptyMode: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="showSample">Show Sample Card in Builder (Recommended)</option>
                      <option value="showEmptyMessage">Show Custom Message on Live Page</option>
                      <option value="hide">Hide Section Completely</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={repeat.emptyText ?? ""}
                      onChange={(e) => setRepeat({ emptyText: e.target.value })}
                      placeholder="Empty message, e.g. No courses currently available."
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  <b>Show Sample Card</b> keeps the section visible and editable in the builder even when your database currently has 0 courses.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400">
              For a full card layout use the <b>Repeat (Collection)</b> block instead — it can hold several blocks per record.
            </p>
          )}
        </div>
      ) : null}

      {/* ---------- single document source ---------- */}
      {!repeat.enabled ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-gray-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Single Document Data Source
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  _dataSource: block._dataSource?.enabled
                    ? { ...block._dataSource, enabled: false }
                    : {
                        enabled: true,
                        model: "Course",
                        mode: "single",
                        strategy: "slug",
                        lookupField: "slug",
                        paramValue: "route.params.slug",
                        alias: "course",
                      },
                })
              }
              className={`ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                block._dataSource?.enabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  block._dataSource?.enabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {block._dataSource?.enabled ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Model</Label>
                  <select
                    value={block._dataSource.model || "Course"}
                    onChange={(e) => {
                      const m = e.target.value;
                      const alias = m.charAt(0).toLowerCase() + m.slice(1);
                      onChange({
                        ...block,
                        _dataSource: { ...block._dataSource, model: m, alias },
                      });
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Course">Course</option>
                    <option value="Candidate">Candidate</option>
                    <option value="Post">Post</option>
                    <option value="User">User</option>
                    <option value="Order">Order</option>
                    <option value="SiteSettings">SiteSettings</option>
                  </select>
                </div>
                <div>
                  <Label>Context Variable Name</Label>
                  <input
                    type="text"
                    value={block._dataSource.alias || "course"}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        _dataSource: { ...block._dataSource, alias: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label>Document Strategy</Label>
                  <select
                    value={block._dataSource.strategy || "slug"}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        _dataSource: { ...block._dataSource, strategy: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="slug">Find by Slug</option>
                    <option value="id">Find by ID</option>
                    <option value="currentUser">Current Authenticated User</option>
                    <option value="first">First Published Record</option>
                  </select>
                </div>
                <div>
                  <Label>Lookup Path / Value</Label>
                  <input
                    type="text"
                    value={block._dataSource.paramValue ?? "route.params.slug"}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        _dataSource: { ...block._dataSource, paramValue: e.target.value },
                      })
                    }
                    placeholder="route.params.slug"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900">
                <p className="font-semibold text-blue-800">
                  Resolved single record: <code>{block._dataSource.alias || "course"}</code>
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                  Go to the <b>Content</b> tab to bind fields: <code>{`{{${block._dataSource.alias || "course"}.title}}`}</code>, <code>{`{{${block._dataSource.alias || "course"}.level.name}}`}</code>, etc.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400">
              Resolve a single document (e.g. for a detail page or hero) so Content can bind its fields.
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
