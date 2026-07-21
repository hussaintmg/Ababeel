"use client";

import { useState } from "react";
import { BLOCK_TYPES, defaultStyle } from "@/Components/cms/blockSchemas";
import {
  FieldRenderer, Label, TextInput, ColorInput, ImagePicker, SelectInput,
} from "@/Components/owner/cms/fields";
import { SlidersHorizontal, Palette } from "lucide-react";

export default function BlockEditor({ block, onChange }) {
  const def = BLOCK_TYPES[block.type];
  const [tab, setTab] = useState("content");
  if (!def) return <p className="text-sm text-red-500">Unknown block type: {block.type}</p>;

  const props = block.props || {};
  // Merge older _adv values into _style so nothing is lost on legacy blocks.
  const style = { ...defaultStyle(), ...(block._adv || {}), ...(block._style || {}) };

  const setProp = (key, v) => onChange({ ...block, props: { ...props, [key]: v } });
  const setStyle = (key, v) => onChange({ ...block, _style: { ...style, [key]: v } });
  // Update several style keys at once (single call — avoids the stale-closure
  // clobber you'd get from calling setStyle multiple times in one handler).
  const setStyleMany = (obj) => onChange({ ...block, _style: { ...style, ...obj } });

  return (
    <div>
      {/* Content / Design tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("content")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "content" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <SlidersHorizontal size={14} /> Content
        </button>
        <button
          onClick={() => setTab("design")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "design" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Palette size={14} /> Design
        </button>
      </div>

      {tab === "content" ? (
        <div className="space-y-4">
          {def.fields.map((field) => (
            <div key={field.key}>
              {field.type !== "boolean" ? <Label>{field.label}</Label> : null}
              <FieldRenderer field={field} value={props[field.key]} onChange={(v) => setProp(field.key, v)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-gray-500">
            Style this section visually — background, gradients, spacing, borders, animations and hover. No CSS required.
          </p>

          {/* ---------- Background ---------- */}
          <Section title="Background">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-3">
              {[
                { v: "solid", label: "Solid color" },
                { v: "gradient", label: "Gradient" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setStyle("bgType", o.v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${(style.bgType || "solid") === o.v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {(style.bgType || "solid") === "gradient" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Gradient from</Label>
                    <ColorInput value={style.gradFrom} onChange={(v) => setStyle("gradFrom", v)} />
                  </div>
                  <div>
                    <Label>Gradient to</Label>
                    <ColorInput value={style.gradTo} onChange={(v) => setStyle("gradTo", v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <NumBox label="Angle (deg)" value={style.gradAngle} onChange={(v) => setStyle("gradAngle", v)} placeholder="135" />
                  <div className="col-span-1 sm:col-span-3 flex items-end">
                    <div className="w-full flex flex-wrap gap-1.5">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.name}
                          title={g.name}
                          onClick={() => setStyleMany({ bgType: "gradient", gradFrom: g.from, gradTo: g.to, gradAngle: String(g.angle) })}
                          className="h-7 w-9 rounded-md border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                          style={{ backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Background color</Label>
                  <ColorInput value={style.bgColor} onChange={(v) => setStyle("bgColor", v)} />
                </div>
                <div>
                  <Label>Text color</Label>
                  <ColorInput value={style.textColor} onChange={(v) => setStyle("textColor", v)} />
                </div>
              </div>
            )}

            {(style.bgType || "solid") === "gradient" ? (
              <div className="mt-3">
                <Label>Text color</Label>
                <ColorInput value={style.textColor} onChange={(v) => setStyle("textColor", v)} />
              </div>
            ) : null}

            <div className="mt-3">
              <Label>Background image (optional)</Label>
              <ImagePicker value={style.bgImage} onChange={(v) => setStyle("bgImage", v)} />
            </div>
            {style.bgImage ? (
              <div className="mt-3 max-w-[200px]">
                <NumBox label="Image dark overlay (%)" value={style.bgOverlay} onChange={(v) => setStyle("bgOverlay", v)} placeholder="0–100" />
              </div>
            ) : null}
          </Section>

          {/* ---------- Spacing ---------- */}
          <Section title="Spacing">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumBox label="Padding ↕ (px)" value={style.paddingY} onChange={(v) => setStyle("paddingY", v)} />
              <NumBox label="Padding ↔ (px)" value={style.paddingX} onChange={(v) => setStyle("paddingX", v)} />
              <NumBox label="Margin top (px)" value={style.marginTop} onChange={(v) => setStyle("marginTop", v)} />
              <NumBox label="Margin bottom (px)" value={style.marginBottom} onChange={(v) => setStyle("marginBottom", v)} />
            </div>
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer select-none hover:text-gray-700">Per-side padding (advanced)</summary>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <NumBox label="Top" value={style.paddingTop} onChange={(v) => setStyle("paddingTop", v)} />
                <NumBox label="Right" value={style.paddingRight} onChange={(v) => setStyle("paddingRight", v)} />
                <NumBox label="Bottom" value={style.paddingBottom} onChange={(v) => setStyle("paddingBottom", v)} />
                <NumBox label="Left" value={style.paddingLeft} onChange={(v) => setStyle("paddingLeft", v)} />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">Any side you fill in overrides the simple ↕/↔ padding above.</p>
            </details>
          </Section>

          {/* ---------- Box ---------- */}
          <Section title="Box & border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumBox label="Max width (px)" value={style.maxWidth} onChange={(v) => setStyle("maxWidth", v)} placeholder="e.g. 1000" />
              <NumBox label="Min height (px)" value={style.minHeight} onChange={(v) => setStyle("minHeight", v)} />
              <NumBox label="Corner radius (px)" value={style.radius} onChange={(v) => setStyle("radius", v)} />
              <div>
                <Label>Shadow</Label>
                <SelectInput value={style.shadow || "none"} onChange={(v) => setStyle("shadow", v)} options={["none", "sm", "md", "lg", "xl"]} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <NumBox label="Border width (px)" value={style.borderWidth} onChange={(v) => setStyle("borderWidth", v)} />
              <div>
                <Label>Border color</Label>
                <ColorInput value={style.borderColor} onChange={(v) => setStyle("borderColor", v)} />
              </div>
              <div>
                <Label>Align</Label>
                <SelectInput value={style.align || ""} onChange={(v) => setStyle("align", v)} options={[{ value: "", label: "default" }, { value: "left", label: "left" }, { value: "center", label: "center" }, { value: "right", label: "right" }]} />
              </div>
              <div>
                <Label>Hover effect</Label>
                <SelectInput value={style.hover || "none"} onChange={(v) => setStyle("hover", v)} options={[{ value: "none", label: "none" }, { value: "lift", label: "lift" }, { value: "glow", label: "glow" }, { value: "zoom", label: "zoom" }]} />
              </div>
            </div>
          </Section>

          {/* ---------- Animation ---------- */}
          <Section title="Animation (on scroll)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Entrance</Label>
                <SelectInput
                  value={style.animation || "none"}
                  onChange={(v) => setStyle("animation", v)}
                  options={[
                    { value: "none", label: "none" },
                    { value: "fade", label: "fade in" },
                    { value: "fade-up", label: "fade up" },
                    { value: "fade-down", label: "fade down" },
                    { value: "fade-left", label: "fade from right" },
                    { value: "fade-right", label: "fade from left" },
                    { value: "zoom-in", label: "zoom in" },
                    { value: "zoom-out", label: "zoom out" },
                  ]}
                />
              </div>
              <NumBox label="Duration (ms)" value={style.animDuration} onChange={(v) => setStyle("animDuration", v)} placeholder="700" />
              <NumBox label="Delay (ms)" value={style.animDelay} onChange={(v) => setStyle("animDelay", v)} placeholder="0" />
            </div>
          </Section>

          {/* ---------- Advanced ---------- */}
          <Section title="Advanced (target with Custom CSS)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>CSS class</Label>
                <TextInput value={style.className} onChange={(v) => setStyle("className", v)} placeholder="my-section" />
              </div>
              <div>
                <Label>Anchor id</Label>
                <TextInput value={style.anchorId} onChange={(v) => setStyle("anchorId", v)} placeholder="section-1" />
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

// Handy gradient swatches for the Design tab.
const GRADIENT_PRESETS = [
  { name: "Ocean", from: "#2563eb", to: "#0f172a", angle: 135 },
  { name: "Sunset", from: "#f97316", to: "#db2777", angle: 135 },
  { name: "Emerald", from: "#10b981", to: "#065f46", angle: 135 },
  { name: "Violet", from: "#7c3aed", to: "#2563eb", angle: 135 },
  { name: "Aurora", from: "#06b6d4", to: "#3b82f6", angle: 120 },
  { name: "Fire", from: "#ef4444", to: "#f59e0b", angle: 135 },
  { name: "Midnight", from: "#0f172a", to: "#334155", angle: 160 },
  { name: "Candy", from: "#ec4899", to: "#8b5cf6", angle: 135 },
  { name: "Lime", from: "#84cc16", to: "#0d9488", angle: 120 },
  { name: "Steel", from: "#64748b", to: "#1e293b", angle: 135 },
];

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</p>
      {children}
    </div>
  );
}

function NumBox({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "0"}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
