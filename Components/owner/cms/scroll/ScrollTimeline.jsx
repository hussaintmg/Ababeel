"use client";

/**
 * The scroll section's timeline.
 *
 * The old way of building one of these was a list of scenes, each with a start
 * and end percentage of a scroll distance the author never chose. Nobody thinks
 * like that. With a frame sequence attached the author thinks in frames — "the
 * heading comes in at frame 12 and goes at frame 40" — and can see the frame
 * they are talking about.
 *
 * So: a scrubber across the sequence with the real frame under it, a track per
 * element showing exactly where it is on, and one panel to edit whichever
 * element is selected. Drag the scrubber, press Add, and the new element starts
 * where you are.
 *
 * Everything here writes the same `scenes` array the renderer already reads, in
 * frames rather than percentages, so nothing about the public page changes
 * except that the numbers now mean something to the person typing them.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Trash2, Copy, Type, Heading, Image as ImageIcon, MousePointerClick,
  ChevronLeft, ChevronRight, Film,
} from "lucide-react";
import { SCENE_ANIMATIONS, SCENE_POSITIONS, EASES, VISIBILITY, sceneRange } from "@/Components/cms/ScrollVideo";

const inputCls =
  "w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children, hint }) {
  return (
    <div>
      <span className="block text-[11px] font-medium text-gray-500 mb-1">{label}</span>
      {children}
      {hint ? <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

/** What you can put on the timeline, and what a fresh one looks like. */
const ELEMENT_KINDS = [
  { kind: "heading", label: "Heading", icon: Heading, seed: { heading: "Your heading", headingLevel: "h2" } },
  { kind: "text", label: "Paragraph", icon: Type, seed: { text: "A line of supporting text." } },
  { kind: "image", label: "Image", icon: ImageIcon, seed: { image: "" } },
  { kind: "button", label: "Button", icon: MousePointerClick, seed: { ctaLabel: "Find out more", ctaHref: "/contact-us" } },
];

const TRACK_COLOURS = ["#f26722", "#2563eb", "#10b981", "#a855f7", "#ef4444", "#0ea5e9"];

export default function ScrollTimeline({ props, onChange }) {
  const frames = Array.isArray(props.frames) ? props.frames : [];
  const frameCount = frames.length || parseInt(props.frameCount, 10) || 0;
  const scenes = useMemo(() => (Array.isArray(props.scenes) ? props.scenes : []), [props.scenes]);

  const [frame, setFrame] = useState(1);
  const [selected, setSelected] = useState(-1);
  const railRef = useRef(null);

  // Keep the playhead inside the sequence when the sequence itself changes.
  useEffect(() => {
    setFrame((f) => Math.min(Math.max(f, 1), Math.max(frameCount, 1)));
  }, [frameCount]);

  const setScenes = (next) => onChange({ ...props, scenes: next });
  const patch = (i, key, value) => setScenes(scenes.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));

  const add = (spec) => {
    // Two seconds of scrolling is a sensible first guess: long enough to read,
    // short enough that the author immediately wants to adjust it.
    const span = Math.max(Math.round(frameCount / 5), 2);
    const next = {
      startFrame: String(frame),
      endFrame: String(Math.min(frame + span, Math.max(frameCount, frame + span))),
      start: "", end: "",
      animation: "fade-up",
      exitAnimation: "same",
      ease: "power2.out",
      distance: "40",
      position: "center",
      align: "center",
      visibility: "both",
      textColor: "#ffffff",
      ...spec.seed,
    };
    setScenes([...scenes, next]);
    setSelected(scenes.length);
  };

  const remove = (i) => {
    setScenes(scenes.filter((_, idx) => idx !== i));
    setSelected(-1);
  };

  const duplicate = (i) => {
    const copy = { ...scenes[i] };
    setScenes([...scenes.slice(0, i + 1), copy, ...scenes.slice(i + 1)]);
    setSelected(i + 1);
  };

  if (!frameCount) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <Film size={18} className="mx-auto mb-2 text-gray-300" />
        <p className="text-xs text-gray-500">Choose a scroll animation above to build its timeline.</p>
        <p className="mt-1 text-[11px] text-gray-400">
          Once frames are attached you can scrub through them and add text, images and buttons at
          the exact frame you want them.
        </p>
      </div>
    );
  }

  const pct = frameCount > 1 ? ((frame - 1) / (frameCount - 1)) * 100 : 0;
  const current = frames[Math.min(frame - 1, frames.length - 1)] || "";

  /** Where a scene sits on the rail, as left/width percentages. */
  const barFor = (scene) => {
    const { start, end } = sceneRange(scene, frameCount);
    return { left: `${start * 100}%`, width: `${Math.max((end - start) * 100, 1.2)}%` };
  };

  const nudge = (delta) => setFrame((f) => Math.min(Math.max(f + delta, 1), frameCount));

  const scrubTo = (clientX) => {
    const rail = railRef.current;
    if (!rail) return;
    const box = rail.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
    setFrame(Math.round(ratio * (frameCount - 1)) + 1);
  };

  const sel = selected >= 0 && selected < scenes.length ? scenes[selected] : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <Film size={14} className="text-fuchsia-600" />
        <span className="text-xs font-medium text-gray-700">Timeline</span>
        <span className="ml-auto text-[11px] text-gray-400">{frameCount} frames</span>
      </div>

      {/* The frame under the playhead, so "frame 24" means something you can see. */}
      <div className="bg-gray-900 p-3">
        <div className="relative mx-auto max-w-[520px] rounded overflow-hidden bg-black">
          {current ? (
            <img src={current} alt="" className="w-full h-auto block" />
          ) : (
            <div className="aspect-video w-full" />
          )}
          {/* Everything that is on at this frame, drawn where it will sit. */}
          {scenes.map((s, i) => {
            const { start, end } = sceneRange(s, frameCount);
            const at = frameCount > 1 ? (frame - 1) / (frameCount - 1) : 0;
            if (at < start || at > end) return null;
            const pos = String(s.position || "center");
            const v = pos.startsWith("top") ? "flex-start" : pos.startsWith("bottom") ? "flex-end" : "center";
            const h = pos.endsWith("left") || pos === "left" ? "flex-start" : pos.endsWith("right") || pos === "right" ? "flex-end" : "center";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className="absolute inset-0 flex flex-col p-3 text-left"
                style={{ justifyContent: v, alignItems: h }}
                title="Edit this element"
              >
                <span
                  className={`max-w-[80%] rounded px-2 py-1 ${selected === i ? "outline outline-2 outline-fuchsia-400" : ""}`}
                  style={{ color: s.textColor || "#fff", textShadow: "0 1px 3px rgba(0,0,0,.6)" }}
                >
                  {s.heading ? <span className="block text-lg font-bold leading-tight">{s.heading}</span> : null}
                  {s.text ? <span className="block text-xs opacity-90">{s.text}</span> : null}
                  {s.ctaLabel ? (
                    <span className="mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: s.accent || props.accent || "#f26722" }}>
                      {s.ctaLabel}
                    </span>
                  ) : null}
                  {s.image ? <img src={s.image} alt="" className="mt-1 max-h-16 w-auto" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrubber + tracks */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => nudge(-1)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Previous frame">
            <ChevronLeft size={14} />
          </button>
          <input
            type="range"
            min={1}
            max={Math.max(frameCount, 1)}
            value={frame}
            onChange={(e) => setFrame(Number(e.target.value))}
            aria-label="Scrub through the frames"
            className="flex-1 accent-fuchsia-600"
          />
          <button type="button" onClick={() => nudge(1)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Next frame">
            <ChevronRight size={14} />
          </button>
          <span className="w-24 text-right text-[11px] font-mono text-gray-500">
            frame {frame} / {frameCount}
          </span>
        </div>

        {/* One row per element. The bar is where it is on screen. */}
        <div
          ref={railRef}
          className="relative rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-1.5"
          onClick={(e) => {
            if (e.target === e.currentTarget) scrubTo(e.clientX);
          }}
        >
          {scenes.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-gray-400">
              Nothing on the timeline yet — scrub to a frame and add something below.
            </p>
          ) : (
            scenes.map((s, i) => {
              const bar = barFor(s);
              const colour = TRACK_COLOURS[i % TRACK_COLOURS.length];
              const label = s.heading || s.text || s.ctaLabel || (s.image ? "Image" : `Element ${i + 1}`);
              return (
                <div key={i} className="relative h-6">
                  <div className="absolute inset-0 rounded bg-gray-200/60" />
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`absolute top-0 h-6 rounded px-2 text-[10px] font-medium text-white truncate text-left ${
                      selected === i ? "ring-2 ring-offset-1 ring-gray-800" : ""
                    }`}
                    style={{ ...bar, background: colour }}
                    title={`${label} — frames ${s.startFrame || 1}–${s.endFrame || frameCount}`}
                  >
                    {label}
                  </button>
                </div>
              );
            })
          )}
          {/* The playhead, across every track. */}
          <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-fuchsia-600" style={{ left: `calc(8px + ${pct}% * (100% - 16px) / 100%)` }} />
        </div>

        {/* Add something at the current frame */}
        <div className="flex flex-wrap gap-1.5">
          {ELEMENT_KINDS.map((spec) => {
            const Icon = spec.icon;
            return (
              <button
                key={spec.kind}
                type="button"
                onClick={() => add(spec)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:border-fuchsia-400 hover:text-fuchsia-700"
              >
                <Plus size={11} /> <Icon size={12} /> {spec.label}
              </button>
            );
          })}
          <span className="self-center text-[10px] text-gray-400">starts at frame {frame}</span>
        </div>
      </div>

      {/* The selected element */}
      {sel ? (
        <div className="border-t border-gray-100 p-3 space-y-2.5 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-700">Selected element</span>
            <button type="button" onClick={() => duplicate(selected)} className="ml-auto p-1 rounded hover:bg-gray-200 text-gray-500" title="Duplicate">
              <Copy size={13} />
            </button>
            <button type="button" onClick={() => remove(selected)} className="p-1 rounded hover:bg-red-100 text-red-500" title="Remove">
              <Trash2 size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="From frame">
              <input value={sel.startFrame ?? ""} onChange={(e) => patch(selected, "startFrame", e.target.value)} className={inputCls} />
            </Field>
            <Field label="To frame" hint={`Stays on for ${Math.max((Number(sel.endFrame) || frameCount) - (Number(sel.startFrame) || 1), 0)} frames`}>
              <input value={sel.endFrame ?? ""} onChange={(e) => patch(selected, "endFrame", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => patch(selected, "startFrame", String(frame))}
              className="flex-1 rounded-lg border border-gray-300 py-1 text-[10px] text-gray-600 hover:border-fuchsia-400"
            >
              Start here (frame {frame})
            </button>
            <button
              type="button"
              onClick={() => patch(selected, "endFrame", String(frame))}
              className="flex-1 rounded-lg border border-gray-300 py-1 text-[10px] text-gray-600 hover:border-fuchsia-400"
            >
              End here (frame {frame})
            </button>
          </div>

          <Field label="Heading">
            <input value={sel.heading ?? ""} onChange={(e) => patch(selected, "heading", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Text">
            <textarea value={sel.text ?? ""} onChange={(e) => patch(selected, "text", e.target.value)} rows={2} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Button label">
              <input value={sel.ctaLabel ?? ""} onChange={(e) => patch(selected, "ctaLabel", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Button link">
              <input value={sel.ctaHref ?? ""} onChange={(e) => patch(selected, "ctaHref", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Image URL">
            <input value={sel.image ?? ""} onChange={(e) => patch(selected, "image", e.target.value)} className={inputCls} placeholder="/cms/…" />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Entry animation">
              <Select value={sel.animation} onChange={(v) => patch(selected, "animation", v)} options={SCENE_ANIMATIONS} />
            </Field>
            <Field label="Exit animation">
              <Select
                value={sel.exitAnimation}
                onChange={(v) => patch(selected, "exitAnimation", v)}
                options={[{ value: "same", label: "Leave the way it arrived" }, ...SCENE_ANIMATIONS]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Easing">
              <Select value={sel.ease} onChange={(v) => patch(selected, "ease", v)} options={EASES} />
            </Field>
            <Field label="Position on the stage">
              <Select value={sel.position} onChange={(v) => patch(selected, "position", v)} options={SCENE_POSITIONS} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Alignment">
              <Select value={sel.align} onChange={(v) => patch(selected, "align", v)} options={["left", "center", "right"]} />
            </Field>
            <Field label="Show on">
              <Select value={sel.visibility} onChange={(v) => patch(selected, "visibility", v)} options={VISIBILITY} />
            </Field>
            <Field label="Text colour">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(sel.textColor || "") ? sel.textColor : "#ffffff"}
                onChange={(e) => patch(selected, "textColor", e.target.value)}
                className="h-8 w-full rounded border border-gray-300 bg-white p-0.5"
              />
            </Field>
          </div>
        </div>
      ) : scenes.length ? (
        <p className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-400">
          Pick an element on the timeline, or on the frame above, to edit it.
        </p>
      ) : null}
    </div>
  );
}
