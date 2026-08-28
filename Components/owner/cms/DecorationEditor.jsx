"use client";

/**
 * Controls for a section's ::before / ::after layers.
 *
 * The pseudo-elements are where most decorative work on a section happens, and
 * writing them by hand is unforgiving: forget `content: ""` and nothing appears
 * at all, forget `position` and the layer lands somewhere else on the page.
 * These fields make the decisions instead, and lib/cms/decorations turns them
 * into CSS with those parts always right.
 *
 * Only the fields the chosen kind actually uses are shown — a solid colour has
 * no gradient angle, and a strip has no corner.
 */

import { Layers } from "lucide-react";
import {
  DECOR_KINDS, DECOR_LAYERS, DECOR_SIZES, DECOR_BLENDS, emptyDecoration, decorationRule,
} from "@/lib/cms/decorations";
import { blockScopeSelector } from "@/lib/cms/scopeCss";

function Field({ label, children }) {
  return (
    <div>
      <span className="block text-[11px] font-medium text-gray-500 mb-1">{label}</span>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500";

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Colour({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-300 bg-white p-0.5 shrink-0"
      />
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className={inputCls} placeholder="#000000 or rgba(...)" />
    </div>
  );
}

function LayerEditor({ which, value, onChange, blockId }) {
  const d = { ...emptyDecoration(), ...(value || {}) };
  const set = (key, v) => onChange({ ...d, [key]: v });
  const on = d.kind && d.kind !== "none";
  const strip = ["top", "bottom", "left", "right"].includes(d.size);

  return (
    <div className={`rounded-lg border p-3 ${on ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <code className="text-[11px] font-mono text-gray-500">::{which}</code>
        <div className="ml-auto w-44">
          <Select value={d.kind} onChange={(v) => set("kind", v)} options={DECOR_KINDS} />
        </div>
      </div>

      {on ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Depth">
              <Select value={d.layer} onChange={(v) => set("layer", v)} options={DECOR_LAYERS} />
            </Field>
            <Field label="Covers">
              <Select value={d.size} onChange={(v) => set("size", v)} options={DECOR_SIZES} />
            </Field>
          </div>

          {strip || d.size === "corner" ? (
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={d.size === "corner" ? "Shape size (px)" : "Thickness (px)"}>
                <input value={d.thickness} onChange={(e) => set("thickness", e.target.value)} className={inputCls} />
              </Field>
              {d.size === "corner" ? (
                <Field label="Corner">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Select
                      value={d.corner}
                      onChange={(v) => set("corner", v)}
                      options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]}
                    />
                    <Select
                      value={d.cornerY}
                      onChange={(v) => set("cornerY", v)}
                      options={[{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }]}
                    />
                  </div>
                </Field>
              ) : null}
            </div>
          ) : null}

          {d.kind === "color" || d.kind === "text" ? (
            <Field label="Colour">
              <Colour value={d.color} onChange={(v) => set("color", v)} />
            </Field>
          ) : null}

          {d.kind === "gradient" ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="From">
                  <Colour value={d.gradFrom} onChange={(v) => set("gradFrom", v)} />
                </Field>
                <Field label="To">
                  <Colour value={d.gradTo} onChange={(v) => set("gradTo", v)} />
                </Field>
              </div>
              <Field label="Angle (deg)">
                <input value={d.gradAngle} onChange={(e) => set("gradAngle", e.target.value)} className={inputCls} />
              </Field>
            </div>
          ) : null}

          {d.kind === "image" ? (
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Image URL">
                <input value={d.image} onChange={(e) => set("image", e.target.value)} className={inputCls} placeholder="/cms/home/hero.webp" />
              </Field>
              <Field label="Fit">
                <Select
                  value={d.fit}
                  onChange={(v) => set("fit", v)}
                  options={[{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }]}
                />
              </Field>
            </div>
          ) : null}

          {d.kind === "text" ? (
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Text or emoji">
                <input value={d.text} onChange={(e) => set("text", e.target.value)} className={inputCls} placeholder="SAFETY" />
              </Field>
              <Field label="Size (px)">
                <input value={d.fontSize} onChange={(e) => set("fontSize", e.target.value)} className={inputCls} />
              </Field>
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Field label="Opacity (%)">
              <input value={d.opacity} onChange={(e) => set("opacity", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Blend">
              <Select value={d.blend} onChange={(v) => set("blend", v)} options={DECOR_BLENDS} />
            </Field>
            <Field label="Radius (px)">
              <input value={d.radius} onChange={(e) => set("radius", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Rotate (deg)">
              <input value={d.rotate} onChange={(e) => set("rotate", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <details className="text-[11px]">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show the CSS this produces</summary>
            <pre className="mt-1.5 p-2 rounded bg-gray-900 text-gray-100 overflow-x-auto text-[10px] leading-relaxed">
              {decorationRule(blockScopeSelector(blockId), which, d) || "/* nothing to show yet */"}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}

export default function DecorationEditor({ style, setStyle, blockId }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
        <Layers size={13} className="mt-0.5 shrink-0" />
        Two decorative layers behind or in front of this section — a tint, a gradient fade, an edge
        strip, a corner shape or a watermark. These are the CSS <code className="font-mono">::before</code>{" "}
        and <code className="font-mono">::after</code> pseudo-elements, set up correctly for you.
      </p>
      <LayerEditor which="before" value={style.decorBefore} onChange={(v) => setStyle("decorBefore", v)} blockId={blockId} />
      <LayerEditor which="after" value={style.decorAfter} onChange={(v) => setStyle("decorAfter", v)} blockId={blockId} />
    </div>
  );
}
