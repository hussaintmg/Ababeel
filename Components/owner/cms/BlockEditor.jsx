"use client";

import { useState } from "react";
import { BLOCK_TYPES, defaultStyle } from "@/Components/cms/blockSchemas";
import {
  FieldRenderer, Label, TextInput, ColorInput, ImagePicker, SelectInput,
} from "@/Components/owner/cms/fields";
import DynamicField from "@/Components/owner/cms/dynamic/DynamicField";
import BlockDataTab from "@/Components/owner/cms/dynamic/BlockDataTab";
import ScrollVideoStudio from "@/Components/owner/cms/dynamic/ScrollVideoStudio";
import FrameGenerator from "@/Components/owner/cms/dynamic/FrameGenerator";
import AnimationPicker from "@/Components/owner/cms/scroll/AnimationPicker";
import ScrollTimeline from "@/Components/owner/cms/scroll/ScrollTimeline";
import VideoRepair from "@/Components/owner/cms/scroll/VideoRepair";
import { SlidersHorizontal, Palette, Database, Code2, ChevronRight } from "lucide-react";
import CodeTab from "@/Components/owner/cms/CodeTab";
import DecorationEditor from "@/Components/owner/cms/DecorationEditor";
import ReducedMotionNotice from "@/Components/owner/cms/ReducedMotionNotice";
import { scopeCss } from "@/lib/cms/scopeCss";

export default function BlockEditor({ block, onChange, features = {}, scopeHint = "", previewDoc = null }) {
  const def = BLOCK_TYPES[block.type];
  const [tab, setTab] = useState("content");
  if (!def) return <p className="text-sm text-red-500">Unknown block type: {block.type}</p>;

  const props = block.props || {};
  // Merge older _adv values into _style so nothing is lost on legacy blocks.
  const style = { ...defaultStyle(), ...(block._adv || {}), ...(block._style || {}) };
  const dynamicEnabled = features.dynamicCms !== false && features.variables !== false;
  const showDataTab =
    dynamicEnabled &&
    (features.conditions !== false || features.repeater !== false || features.liveData !== false);

  // Anything the scoper cannot make sense of is dropped rather than emitted, so
  // say so instead of leaving the author wondering why nothing changed.
  const cssError =
    style.css && !scopeCss(style.css, block.id)
      ? "Nothing applied yet — check for a missing } or : ."
      : "";

  const setProp = (key, v) => onChange({ ...block, props: { ...props, [key]: v } });
  const setStyle = (key, v) => onChange({ ...block, _style: { ...style, [key]: v } });
  // Update several style keys at once (single call — avoids the stale-closure
  // clobber you'd get from calling setStyle multiple times in one handler).
  const setStyleMany = (obj) => onChange({ ...block, _style: { ...style, ...obj } });

  const fallbacks = block._fallbacks || {};
  const setFallback = (key, v) => {
    const next = { ...fallbacks };
    if (v) next[key] = v;
    else delete next[key];
    onChange({ ...block, _fallbacks: next });
  };

  // Every leaf property gets the Static/Dynamic/Formula control; list fields
  // recurse so items inside a Card Grid can be bound too.
  const renderLeaf = (field, value, onValue, pathKey) => {
    // Rendered at the top of the panel instead, where it is the first thing an
    // author sees rather than the seventh.
    if (field.type === "animation") return null;
    if (field.type === "list") {
      return <FieldRenderer field={field} value={value} onChange={onValue} renderField={renderLeaf} />;
    }
    return (
      <DynamicField
        field={field}
        value={value}
        onChange={onValue}
        enabled={dynamicEnabled}
        fallback={fallbacks[pathKey || field.key]}
        onFallbackChange={(v) => setFallback(pathKey || field.key, v)}
      />
    );
  };

  return (
    <div>
      {/* Content / Design / Data tabs */}
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
        {showDataTab ? (
          <button
            onClick={() => setTab("data")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "data" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Database size={14} /> Data
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setTab("code")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "code" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Code2 size={14} /> HTML
        </button>
      </div>

      {tab === "content" ? (
        <div className="space-y-4">
          {scopeHint ? (
            <p className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-700">
              Inside a Repeat — use <code className="font-mono">{scopeHint}</code> to reach the current record.
            </p>
          ) : null}
          {block.type === "scrollVideo" ? (
            <>
              {/* The picker comes first. Someone who has already built a
                  sequence under Scroll Animations only needs to choose it, and
                  it used to sit seventh in the list, below the video upload and
                  a "generate frames" panel that needs a video to do anything —
                  so the finished sequence looked unreachable. */}
              <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/40 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700">
                  Start here — choose a ready-made animation
                </p>
                <AnimationPicker
                  value={props.animationId}
                  onApply={(patch) => onChange({ ...block, props: { ...props, ...patch } })}
                />
                {props.animationId ? (
                  <p className="mt-2 text-[11px] text-green-700">
                    {props.frameCount || 0} frames attached. Save the page, then scroll the live page
                    to play it.
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-gray-500">
                    Or build one from a video below — that needs ffmpeg on the server.
                  </p>
                )}
              </div>
              <ReducedMotionNotice props={props} />
              <VideoRepair props={props} />
              {/* The timeline is where the section is actually built: scrub to
                  a frame, add a heading or a button there, say how long it
                  stays and how it leaves. It comes before the settings because
                  it is the work; the settings are adjustments to it. */}
              <ScrollTimeline props={props} onChange={(next) => onChange({ ...block, props: next })} />
              <ScrollVideoStudio props={props} />
              <details className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <summary className="cursor-pointer select-none px-3 py-2.5 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100">
                  Build a sequence from a video file
                </summary>
                <div className="p-3">
                  <FrameGenerator
                    props={props}
                    onApply={(patch) => onChange({ ...block, props: { ...props, ...patch } })}
                  />
                </div>
              </details>
            </>
          ) : null}
          <FieldList fields={def.fields} props={props} setProp={setProp} renderLeaf={renderLeaf} block={block} />
        </div>
      ) : tab === "code" ? (
        <CodeTab block={block} onChange={onChange} previewDoc={previewDoc} />
      ) : tab === "data" ? (
        <BlockDataTab block={block} onChange={onChange} features={features} />
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

          {/* ---------- Decorative layers ---------- */}
          <Section title="Decorative layers (::before / ::after)">
            <DecorationEditor style={style} setStyle={setStyle} blockId={block.id} />
          </Section>

          {/* ---------- This section's own CSS ---------- */}
          <Section title="Custom CSS for this section">
            <p className="text-[11px] text-gray-500 mb-2">
              Applies to this section only — no class name needed, and nothing leaks onto the rest of
              the page. Write <code className="font-mono">&amp;</code> for the section itself, or any
              selector to match inside it. Media queries work.
            </p>
            <textarea
              value={style.css || ""}
              onChange={(e) => setStyle("css", e.target.value)}
              rows={7}
              spellCheck={false}
              placeholder={"h2 { letter-spacing: -.02em }\n& { border-top: 4px solid #f26722 }\n@media (max-width: 640px) {\n  h2 { font-size: 24px }\n}"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
            />
            {cssError ? (
              <p className="mt-1.5 text-[11px] text-amber-600">{cssError}</p>
            ) : style.css ? (
              <p className="mt-1.5 text-[11px] text-green-600">
                {scopeCss(style.css, block.id).split("\n").filter(Boolean).length} rule(s) applied to this section.
              </p>
            ) : null}
          </Section>

          {/* ---------- Advanced ---------- */}
          <Section title="Advanced">
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

/**
 * The block's own fields.
 *
 * A short block lists them flat, exactly as before. A long one — Scroll Video
 * now has sixty-odd settings across sources, scroll behaviour, scenes, overlays
 * and a separate mobile configuration — groups them into collapsible sections,
 * because a sixty-field wall is a settings panel nobody reads to the bottom of.
 *
 * Grouping is opt-in per field (`group: "Scroll behaviour"`), so every existing
 * block renders unchanged. The first group opens by default; the rest stay shut
 * until they are wanted.
 */
function FieldList({ fields, props, setProp, renderLeaf, block }) {
  // Scroll Video builds its scenes on the timeline above, so the raw list of
  // scenes would be the same thing twice — and the one that is harder to use.
  // Everything else still gets its fields.
  const usesTimeline = block?.type === "scrollVideo";
  const one = (field) => (
    <div key={field.key}>
      {field.type !== "boolean" && field.type !== "animation" ? <Label>{field.label}</Label> : null}
      {renderLeaf(field, props[field.key], (v) => setProp(field.key, v), field.key)}
      {field.help ? <p className="mt-1 text-[11px] text-gray-400">{field.help}</p> : null}
    </div>
  );

  const shown = usesTimeline ? fields.filter((f) => f.key !== "scenes") : fields;
  const grouped = shown.some((f) => f.group);
  if (!grouped) return <>{shown.map(one)}</>;

  const order = [];
  const byGroup = new Map();
  shown.forEach((f) => {
    const key = f.group || "Other";
    if (!byGroup.has(key)) {
      byGroup.set(key, []);
      order.push(key);
    }
    byGroup.get(key).push(f);
  });

  return (
    <div className="space-y-2">
      {order.map((name, i) => (
        <details key={name} open={i === 0} className="rounded-xl border border-gray-200 bg-white overflow-hidden group">
          <summary className="cursor-pointer select-none px-3 py-2.5 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2">
            <ChevronRight size={13} className="text-gray-400 transition-transform group-open:rotate-90" />
            {name}
            <span className="ml-auto text-[10px] font-normal text-gray-400">{byGroup.get(name).length}</span>
          </summary>
          <div className="p-3 space-y-4">{byGroup.get(name).map(one)}</div>
        </details>
      ))}
    </div>
  );
}
