"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Star, Check, Quote, AlertTriangle } from "lucide-react";
import ScrollVideo from "@/Components/cms/ScrollVideo";
import { expandBlocks } from "@/lib/cms/binding";
import { scopeCss, blockScopeId, blockScopeSelector } from "@/lib/cms/scopeCss";
import { decorationCss } from "@/lib/cms/decorations";

/* ---------- Tailwind runtime (for Custom HTML blocks) ---------- */
// Loads the Tailwind browser build once so arbitrary Tailwind utility classes
// written in Custom HTML blocks are compiled at runtime.
let _twLoading = null;
function loadTailwindRuntime() {
  if (typeof window === "undefined") return;
  if (window.__cmsTailwind) return;
  if (_twLoading) return _twLoading;
  _twLoading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "/cms/tailwind-browser.js";
    s.async = true;
    s.onload = () => {
      window.__cmsTailwind = true;
      resolve();
    };
    s.onerror = resolve;
    document.head.appendChild(s);
  });
  return _twLoading;
}

/* ---------- helpers ---------- */

function SmartLink({ href, className, children, style }) {
  if (!href) return <span className={className} style={style}>{children}</span>;
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  if (isInternal) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} style={style} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({ children, className, style, id }) {
  return (
    <motion.div
      id={id || undefined}
      className={className}
      style={style}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

/* ---------- block components ---------- */

/**
 * A block's own vertical padding, unless the author set some.
 *
 * Every block ships with a `py-*` that suits it on its own. The Design tab's
 * padding lands on the wrapper *outside* that, so setting it there used to add
 * to the built-in figure rather than replace it: an author asking for 8px got
 * 8px plus the block's own 56px and could not understand why the band stayed
 * tall. When they have said what they want, the block's default gets out of the
 * way.
 *
 * @param s         the block's _style
 * @param fallback  the class to use when the author has not set padding
 */
function padY(s, fallback) {
  const set = (k) => {
    const v = s?.[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  };
  return set("paddingY") || set("paddingTop") || set("paddingBottom") ? "" : fallback;
}

/**
 * A block's accent colour — the one used for buttons, numerals, icon chips and
 * rules. Blocks that never set it keep the original blue, so existing pages
 * look exactly as they did.
 */
function accentOf(p) {
  return p.accent || "#2563eb";
}

/** Same colour at low opacity, for chip and rule backgrounds. */
function tint(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return `rgba(37,99,235,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function HeroBlock({ p }) {
  const align = p.align === "left" ? "items-start text-left" : "items-center text-center";
  // Background: gradient > solid color.
  const bg = {};
  if (p.bgType === "gradient" && (p.gradFrom || p.gradTo)) {
    const angle = parseInt(p.gradAngle, 10);
    bg.backgroundImage = `linear-gradient(${Number.isNaN(angle) ? 135 : angle}deg, ${p.gradFrom || "#2563eb"}, ${p.gradTo || "#0f172a"})`;
  } else {
    bg.backgroundColor = p.bgColor || "#0f172a";
  }
  bg.color = p.textColor || "#fff";
  const minH = parseInt(p.minHeight, 10);
  const overlay = p.overlay != null && p.overlay !== "" ? Math.min(parseInt(p.overlay, 10) || 0, 100) / 100 : 0.55;
  const padY = p.padY ? `${parseInt(p.padY, 10)}px` : undefined;
  // "Professional Training | Practical Learning | Workplace Safety" — the row of
  // short claims a hero usually carries under its buttons.
  const badges = String(p.badges || "")
    .split(/[|\n]/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <section
      className={`relative overflow-hidden ${p.rounded ? "rounded-3xl" : ""}`}
      style={{ ...bg, minHeight: Number.isNaN(minH) ? undefined : minH }}
    >
      {p.image ? (
        <>
          <img src={p.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {/* A flat wash over a photograph flattens it; angling the scrim away
              from the text keeps the picture readable as a picture. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                p.align === "left"
                  ? `linear-gradient(100deg, ${tint(p.bgColor, Math.min(overlay + 0.3, 0.96))} 0%, ${tint(p.bgColor, overlay)} 45%, ${tint(p.bgColor, Math.max(overlay - 0.3, 0))} 100%)`
                  : `rgba(0,0,0,${overlay})`,
            }}
          />
        </>
      ) : null}
      <div
        className={`relative ${p.align === "left" ? "max-w-6xl" : "max-w-5xl"} mx-auto px-6 flex flex-col ${align} ${Number.isNaN(minH) ? "py-20 md:py-28" : "flex-1 justify-center py-16"}`}
        style={{ paddingTop: padY, paddingBottom: padY, minHeight: Number.isNaN(minH) ? undefined : "inherit" }}
      >
        {p.eyebrow ? (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase backdrop-blur"
            style={p.accent ? { backgroundColor: accentOf(p), color: "#fff" } : { backgroundColor: "rgba(255,255,255,.15)" }}
          >
            {p.eyebrow}
          </motion.span>
        ) : null}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-3xl"
        >
          {p.title}
        </motion.h1>
        {p.subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-base md:text-lg opacity-90 max-w-2xl"
          >
            {p.subtitle}
          </motion.p>
        ) : null}
        {(p.primaryCta?.label || p.secondaryCta?.label) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`mt-8 flex flex-wrap gap-4 ${p.align === "left" ? "" : "justify-center"}`}
          >
            {p.primaryCta?.label ? (
              <SmartLink
                href={p.primaryCta.href}
                className="px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
                style={p.accent ? { backgroundColor: accentOf(p), color: "#fff" } : { backgroundColor: "#fff", color: "#111827" }}
              >
                {p.primaryCta.label}
              </SmartLink>
            ) : null}
            {p.secondaryCta?.label ? (
              <SmartLink
                href={p.secondaryCta.href}
                className="px-7 py-3.5 rounded-xl border border-white/60 font-semibold hover:bg-white/10 transition-colors"
              >
                {p.secondaryCta.label}
              </SmartLink>
            ) : null}
          </motion.div>
        )}
        {badges.length ? (
          <div className={`mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium opacity-90 ${p.align === "left" ? "" : "justify-center"}`}>
            {badges.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                <Check size={16} style={{ color: accentOf(p) }} />
                {b}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HeadingBlock({ p }) {
  const Tag = p.level === "1" ? "h1" : p.level === "3" ? "h3" : "h2";
  const size =
    p.level === "1"
      ? "text-3xl md:text-5xl"
      : p.level === "3"
      ? "text-xl md:text-2xl"
      : "text-2xl md:text-4xl";
  return (
    <Reveal className={`max-w-5xl mx-auto px-6 py-10 ${alignClass[p.align] || "text-center"}`}>
      <Tag className={`${size} font-bold text-gray-900`}>{p.text}</Tag>
      {p.subtitle ? <p className="mt-3 text-gray-600 max-w-2xl mx-auto">{p.subtitle}</p> : null}
    </Reveal>
  );
}

function RichTextBlock({ p }) {
  const width = p.maxWidth === "full" ? "max-w-6xl" : "max-w-3xl";
  return (
    <Reveal className={`${width} mx-auto px-6 py-8`}>
      <div
        className={`cms-prose ${alignClass[p.align] || "text-left"}`}
        dangerouslySetInnerHTML={{ __html: p.html || "" }}
      />
    </Reveal>
  );
}

function ImageBlock({ p }) {
  const full = p.maxWidth === "full";
  const style = full ? {} : { maxWidth: `${parseInt(p.maxWidth || "800", 10) || 800}px` };
  return (
    <Reveal className="px-6 py-8 flex flex-col items-center">
      {p.src ? (
        <img
          src={p.src}
          alt={p.alt || ""}
          style={style}
          className={`w-full h-auto ${p.rounded ? "rounded-2xl" : ""} shadow-md`}
        />
      ) : (
        <div className="w-full max-w-md h-48 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image selected
        </div>
      )}
      {p.caption ? <p className="mt-3 text-sm text-gray-500">{p.caption}</p> : null}
    </Reveal>
  );
}

function CardGridBlock({ p, s }) {
  const cols =
    p.columns === "2"
      ? "sm:grid-cols-2"
      : p.columns === "4"
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";
  const items = Array.isArray(p.items) ? p.items : [];
  const accent = accentOf(p);
  // "numbered" replaces the icon with 01…06 in the accent colour, which is what
  // a list of reasons or steps wants; "plain" is the original card.
  const numbered = p.variant === "numbered";
  const inherit = !!s?.textColor;
  return (
    <section className={`max-w-6xl mx-auto px-6 ${padY(s, "py-12")}`}>
      {p.title || p.eyebrow ? (
        <Reveal className="text-center mb-10">
          {p.eyebrow ? (
            <div className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: accent }}>
              {p.eyebrow}
            </div>
          ) : null}
          {p.title ? <h2 className={`text-2xl md:text-4xl font-bold ${inherit ? "" : "text-gray-900"}`}>{p.title}</h2> : null}
          {p.subtitle ? <p className={`mt-3 max-w-2xl mx-auto ${inherit ? "opacity-80" : "text-gray-600"}`}>{p.subtitle}</p> : null}
        </Reveal>
      ) : null}
      <motion.div
        className={`grid grid-cols-1 ${cols} gap-6`}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {items.map((it, i) => {
          const inner = (
            <motion.div
              variants={reveal}
              // Each card may override the block's colours; an untouched card
              // inherits them, so nothing changes until an author asks it to.
              className={`group/card relative h-full rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-7 overflow-hidden ${
                it.bgColor ? "" : "bg-white"
              } ${it.bgColor ? "border-transparent" : "border-gray-100"}`}
              style={{ backgroundColor: it.bgColor || undefined, color: it.textColor || undefined }}
            >
              {/* A rule in the accent colour that fills out on hover — enough to
                  make a grid of cards feel deliberate rather than generic. */}
              <span
                className="absolute left-0 top-0 h-1 w-12 group-hover/card:w-full transition-all duration-500"
                style={{ backgroundColor: it.accent || accent }}
              />
              {numbered ? (
                <div className="text-3xl font-extrabold tabular-nums mb-4" style={{ color: it.accent || accent }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
              ) : it.image ? (
                <img src={it.image} alt={it.title || ""} className="w-full h-40 object-cover rounded-xl mb-5" />
              ) : it.icon ? (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                  style={{ backgroundColor: tint(it.accent || accent, 0.1) }}
                >
                  {it.icon}
                </div>
              ) : null}
              {it.title ? (
                <h3 className={`text-lg font-semibold ${it.textColor ? "" : "text-gray-900"}`}>{it.title}</h3>
              ) : null}
              {it.text ? (
                <p className={`mt-2 text-sm leading-relaxed ${it.textColor ? "opacity-80" : "text-gray-600"}`}>{it.text}</p>
              ) : null}
              {it.href && it.linkLabel ? (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: it.accent || accent }}>
                  {it.linkLabel}
                  <ChevronRight size={15} className="group-hover/card:translate-x-1 transition-transform" />
                </span>
              ) : null}
            </motion.div>
          );
          return it.href ? (
            <SmartLink key={i} href={it.href} className="block h-full">
              {inner}
            </SmartLink>
          ) : (
            <div key={i} className="h-full">
              {inner}
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}

function StatsBlock({ p, s }) {
  const items = Array.isArray(p.items) ? p.items : [];
  // On a dark band the author sets a text colour in the Design tab; the numbers
  // and labels follow it instead of their built-in blue/grey, which would be
  // unreadable there.
  const inherit = !!s?.textColor;
  const accent = p.accent || "";
  return (
    <section style={{ backgroundColor: p.bgColor || "#f1f5f9" }}>
      <div className={`max-w-6xl mx-auto px-6 ${padY(s, "py-14")}`}>
        {p.title || p.subtitle ? (
          <div className="text-center mb-10">
            {p.title ? (
              <h2 className={`text-2xl md:text-3xl font-bold ${inherit ? "" : "text-gray-900"}`}>{p.title}</h2>
            ) : null}
            {p.subtitle ? (
              <p className={`mt-3 max-w-2xl mx-auto ${inherit ? "opacity-80" : "text-gray-600"}`}>{p.subtitle}</p>
            ) : null}
          </div>
        ) : null}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-y-10"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {items.map((it, i) => (
            <motion.div
              key={i}
              variants={reveal}
              // Hairline dividers turn four numbers into one band instead of
              // four floating figures.
              className={`text-center px-4 ${i > 0 ? "md:border-l" : ""} ${i % 2 === 1 ? "border-l md:border-l" : ""}`}
              style={{
                borderColor: inherit ? "rgba(255,255,255,.18)" : "rgba(15,23,42,.1)",
                backgroundColor: it.bgColor || undefined,
                color: it.textColor || undefined,
              }}
            >
              <div
                className={`text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums ${
                  it.accent || accent || inherit ? "" : "text-blue-600"
                }`}
                style={it.accent || accent ? { color: it.accent || accent } : undefined}
              >
                {it.value}
                {it.suffix ? <span className="text-2xl md:text-3xl align-top">{it.suffix}</span> : null}
              </div>
              <div
                className={`mt-2 text-sm md:text-base font-medium ${
                  it.textColor ? "opacity-90" : inherit ? "opacity-85" : "text-gray-600"
                }`}
              >
                {it.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** A 0–100 setting, with a fallback for anything unparseable. */
function clampPct(value, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, 0), 100);
}

/**
 * One card.
 *
 * The card grid takes a fixed list typed into the editor; this is a single card
 * meant to sit inside a Repeat, so a page can render one per record and bind
 * its fields — which is how a course list becomes a course list rather than
 * eleven cards somebody kept in step by hand.
 *
 * The variants are the ways a card usefully differs, not a palette of themes:
 * where the emphasis sits (a photo, a badge, a price), and how much weight the
 * card carries against its neighbours.
 */
function CardBlock({ p, s: st }) {
  const accent = accentOf(p);
  const variant = p.variant || "elevated";
  const dark = variant === "dark";
  const overlay = variant === "overlay";
  const meta = Array.isArray(p.meta) ? p.meta.filter((m) => m?.label || m?.value) : [];

  const shell =
    variant === "outline"
      ? "bg-white border-2 border-gray-200 hover:border-transparent"
      : variant === "glass"
      ? "bg-white/70 backdrop-blur border border-white/60"
      : dark
      ? "bg-[#0b2a4a] border border-white/10"
      : "bg-white border border-gray-100";

  const body = (
    <div
      className={`group/card relative flex h-full flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${shell}`}
      style={variant === "outline" ? { "--tw-ring-color": accent } : undefined}
    >
      {/* An accent rule that fills out on hover — the one shared gesture that
          makes a grid of cards feel like one component. */}
      {variant !== "overlay" ? (
        <span
          className="absolute left-0 top-0 z-10 h-1 w-12 transition-all duration-500 group-hover/card:w-full"
          style={{ backgroundColor: accent }}
        />
      ) : null}

      {p.image ? (
        <div className={`relative overflow-hidden ${overlay ? "flex-1 min-h-[280px]" : "h-44"}`}>
          <img
            src={p.image}
            alt={p.title || ""}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
          />
          {overlay ? <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" /> : null}
          {p.badge ? (
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow"
              style={{ backgroundColor: accent }}
            >
              {p.badge}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className={`flex flex-1 flex-col p-6 ${overlay ? "absolute inset-x-0 bottom-0 text-white" : ""}`}>
        {!p.image && p.icon ? (
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: tint(accent, 0.12) }}
          >
            {p.icon}
          </div>
        ) : null}

        {p.eyebrow ? (
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
            {p.eyebrow}
          </div>
        ) : null}
        {!p.image && p.badge ? (
          <span
            className="mb-3 inline-block self-start rounded-full px-3 py-1 text-[11px] font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            {p.badge}
          </span>
        ) : null}

        {p.title ? (
          <h3 className={`text-lg font-semibold leading-snug ${overlay || dark ? "text-white" : "text-gray-900"}`}>
            {p.title}
          </h3>
        ) : null}
        {p.text ? (
          <p className={`mt-2 text-sm leading-relaxed ${overlay ? "text-white/80" : dark ? "text-white/70" : "text-gray-600"}`}>
            {p.text}
          </p>
        ) : null}

        {meta.length ? (
          <dl className={`mt-4 space-y-1.5 text-xs ${overlay || dark ? "text-white/75" : "text-gray-500"}`}>
            {meta.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3">
                <dt>{m.label}</dt>
                <dd className={`font-semibold ${overlay || dark ? "text-white" : "text-gray-800"}`}>{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* The footer is pushed down so a row of cards lines up its prices and
            buttons however uneven the text above them is. */}
        <div className="mt-auto pt-5">
          {p.price ? (
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tabular-nums" style={{ color: overlay || dark ? "#fff" : accent }}>
                {p.price}
              </span>
              {p.priceNote ? (
                <span className={`text-xs ${overlay || dark ? "text-white/70" : "text-gray-400"}`}>{p.priceNote}</span>
              ) : null}
            </div>
          ) : null}
          {p.href && p.linkLabel ? (
            p.buttonStyle === "solid" ? (
              <SmartLink
                href={p.href}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition-transform hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: accent }}
              >
                {p.linkLabel}
                <ChevronRight size={15} />
              </SmartLink>
            ) : (
              <SmartLink href={p.href} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: accent }}>
                {p.linkLabel}
                <ChevronRight size={15} className="transition-transform group-hover/card:translate-x-1" />
              </SmartLink>
            )
          ) : null}
        </div>
      </div>
    </div>
  );

  // A card inside a Repeat has no section chrome of its own; one placed
  // directly on a page still needs its margins.
  return st?._inRepeat ? body : <div className="px-6 py-4">{body}</div>;
}

/**
 * Two photographs, one over the other, with a handle that wipes between them.
 *
 * The upper image is clipped rather than faded, so both are at full opacity at
 * the seam and the comparison stays honest — a cross-fade makes the "after"
 * look better simply by being brighter partway through.
 *
 * Draggable with a pointer, and focusable with arrow-key control, because a
 * comparison nobody can operate from the keyboard is a picture of one image.
 */
function BeforeAfterBlock({ p, s: st }) {
  const accent = accentOf(p);
  const inherit = !!st?.textColor;
  const start = clampPct(p.startAt, 50);
  const [pos, setPos] = useState(start);
  const [dragging, setDragging] = useState(false);
  const frame = useRef(null);

  // The author can move the starting point while editing, and the handle should
  // follow — but not while a visitor is dragging it. Derived during render
  // rather than in an effect, so there is no extra pass and no flash of the
  // old position.
  const [appliedStart, setAppliedStart] = useState(start);
  if (!dragging && appliedStart !== start) {
    setAppliedStart(start);
    setPos(start);
  }

  const moveTo = (clientX) => {
    const el = frame.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    setPos(Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100));
  };

  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => moveTo(e.touches ? e.touches[0].clientX : e.clientX);
    const stop = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging]);

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setPos((v) => Math.max(v - step, 0));
    else if (e.key === "ArrowRight") setPos((v) => Math.min(v + step, 100));
    else if (e.key === "Home") setPos(0);
    else if (e.key === "End") setPos(100);
    else return;
    e.preventDefault();
  };

  const height = parseInt(p.height, 10) || 520;
  const hasPair = !!p.beforeImage && !!p.afterImage;

  return (
    <section style={p.bgColor ? { backgroundColor: p.bgColor } : undefined}>
      <div className={`max-w-5xl mx-auto px-6 ${padY(st, "py-14")}`}>
        {p.title || p.eyebrow ? (
          <Reveal className="text-center mb-8">
            {p.eyebrow ? (
              <div className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: accent }}>
                {p.eyebrow}
              </div>
            ) : null}
            {p.title ? <h2 className={`text-2xl md:text-4xl font-bold ${inherit ? "" : "text-gray-900"}`}>{p.title}</h2> : null}
            {p.subtitle ? (
              <p className={`mt-3 max-w-2xl mx-auto ${inherit ? "opacity-80" : "text-gray-600"}`}>{p.subtitle}</p>
            ) : null}
          </Reveal>
        ) : null}

        {hasPair ? (
          <Reveal>
            <div
              ref={frame}
              className="relative overflow-hidden shadow-xl select-none"
              style={{
                height,
                borderRadius: `${Math.max(parseInt(p.radius, 10) >= 0 ? parseInt(p.radius, 10) : 16, 0)}px`,
                cursor: dragging ? "grabbing" : "ew-resize",
                touchAction: "pan-y",
              }}
              onPointerDown={(e) => {
                setDragging(true);
                moveTo(e.clientX);
              }}
            >
              {/* After sits underneath and is revealed as the clip narrows. */}
              <img src={p.afterImage} alt={p.afterLabel || "After"} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                <img src={p.beforeImage} alt={p.beforeLabel || "Before"} className="w-full h-full object-cover" draggable={false} />
              </div>

              {p.beforeLabel ? (
                <span
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur pointer-events-none"
                  style={{ backgroundColor: p.beforeChipBg || "rgba(0,0,0,.6)", color: p.beforeChipText || "#fff" }}
                >
                  {p.beforeLabel}
                </span>
              ) : null}
              {p.afterLabel ? (
                <span
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur pointer-events-none"
                  style={{ backgroundColor: p.afterChipBg || accent, color: p.afterChipText || "#fff" }}
                >
                  {p.afterLabel}
                </span>
              ) : null}

              <div
                className="absolute inset-y-0 pointer-events-none"
                style={{
                  left: `${pos}%`,
                  width: Math.max(parseInt(p.dividerWidth, 10) || 2, 1),
                  backgroundColor: p.dividerColor || "#fff",
                  boxShadow: "0 0 0 1px rgba(0,0,0,.25)",
                }}
              />
              <button
                type="button"
                role="slider"
                aria-label={`Reveal ${p.afterLabel || "after"}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pos)}
                onKeyDown={onKeyDown}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragging(true);
                }}
                className="absolute top-1/2 w-11 h-11 rounded-full flex items-center justify-center focus:outline-none focus:ring-4"
                // Centred on the seam by transform rather than a negative
                // margin, so it stays on the line at every width.
                style={{
                  left: `${pos}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: p.handleColor || "#ffffff",
                  color: p.handleColor ? "#ffffff" : accent,
                  boxShadow: "0 4px 16px rgba(0,0,0,.3)",
                }}
              >
                <ChevronLeft size={15} />
                <ChevronRight size={15} />
              </button>
            </div>
            {p.showHint === false ? null : (
              <p className={`mt-3 text-center text-xs ${inherit ? "opacity-70" : "text-gray-400"}`}>
                Drag the handle, or focus it and use the arrow keys.
              </p>
            )}
          </Reveal>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 py-20 text-center text-sm text-gray-400">
            Choose a before and an after image for this section.
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Picture on one side, a claim and a checklist on the other.
 *
 * The layout most "here is what we do for you" sections actually want, and the
 * one a stack of centred headings and paragraphs cannot produce.
 */
function SplitBlock({ p, s: st }) {
  const accent = accentOf(p);
  const inherit = !!st?.textColor;
  const right = p.imageSide === "right";
  const bullets = Array.isArray(p.bullets)
    ? p.bullets.map((b) => (typeof b === "string" ? b : b?.text)).filter(Boolean)
    : String(p.bullets || "")
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean);

  return (
    <section style={p.bgColor ? { backgroundColor: p.bgColor } : undefined}>
      <div className={`max-w-6xl mx-auto px-6 ${padY(st, "py-16 md:py-20")}`}>
        <div className={`grid gap-10 md:gap-14 items-center ${p.image ? "md:grid-cols-2" : ""}`}>
          {p.image ? (
            <Reveal className={`relative ${right ? "md:order-2" : ""}`}>
              <img
                src={p.image}
                alt={p.imageAlt || p.title || ""}
                className="w-full aspect-[4/3] object-cover rounded-2xl shadow-xl"
              />
              {/* A block of accent behind one corner: cheap, and it stops the
                  photograph reading as a stock image dropped on a page. */}
              <span
                aria-hidden
                className={`absolute -z-10 w-2/3 h-2/3 rounded-2xl ${right ? "-right-5 -bottom-5" : "-left-5 -bottom-5"}`}
                style={{ backgroundColor: tint(accent, 0.16) }}
              />
              {p.badgeValue ? (
                <div
                  className={`absolute -bottom-6 rounded-2xl px-6 py-4 shadow-2xl text-white ${right ? "left-6" : "right-6"}`}
                  style={{ backgroundColor: accent }}
                >
                  <div className="text-3xl font-extrabold leading-none tabular-nums">{p.badgeValue}</div>
                  {p.badgeLabel ? <div className="mt-1 text-xs font-medium opacity-90">{p.badgeLabel}</div> : null}
                </div>
              ) : null}
            </Reveal>
          ) : null}

          <Reveal className={right ? "md:order-1" : ""}>
            {p.eyebrow ? (
              <div className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: accent }}>
                {p.eyebrow}
              </div>
            ) : null}
            {p.title ? (
              <h2 className={`text-2xl md:text-4xl font-bold leading-tight ${inherit ? "" : "text-gray-900"}`}>
                {p.title}
              </h2>
            ) : null}
            {p.text ? (
              <div
                className={`cms-prose mt-5 ${inherit ? "opacity-85" : "text-gray-600"}`}
                dangerouslySetInnerHTML={{ __html: p.text }}
              />
            ) : null}
            {bullets.length ? (
              <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-sm ${inherit ? "opacity-90" : "text-gray-700"}`}>
                    <Check size={17} className="shrink-0 mt-0.5" style={{ color: accent }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {p.cta?.label ? (
              <SmartLink
                href={p.cta.href}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
                style={{ backgroundColor: accent }}
              >
                {p.cta.label}
                <ChevronRight size={17} />
              </SmartLink>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** A grid of photographs, each captioned over the picture itself. */
function ImageTilesBlock({ p, s: st }) {
  const items = Array.isArray(p.items) ? p.items : [];
  const accent = accentOf(p);
  const inherit = !!st?.textColor;
  const cols = p.columns === "2" ? "sm:grid-cols-2" : p.columns === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section style={p.bgColor ? { backgroundColor: p.bgColor } : undefined}>
      <div className={`max-w-6xl mx-auto px-6 ${padY(st, "py-16")}`}>
        {p.title || p.eyebrow ? (
          <Reveal className="text-center mb-10">
            {p.eyebrow ? (
              <div className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: accent }}>
                {p.eyebrow}
              </div>
            ) : null}
            {p.title ? <h2 className={`text-2xl md:text-4xl font-bold ${inherit ? "" : "text-gray-900"}`}>{p.title}</h2> : null}
            {p.subtitle ? (
              <p className={`mt-3 max-w-2xl mx-auto ${inherit ? "opacity-80" : "text-gray-600"}`}>{p.subtitle}</p>
            ) : null}
          </Reveal>
        ) : null}
        <motion.div
          className={`grid grid-cols-1 ${cols} gap-5`}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {items.map((it, i) => {
            const tile = (
              <motion.div variants={reveal} className="group relative h-full overflow-hidden rounded-2xl shadow-md">
                {it.image ? (
                  <img
                    src={it.image}
                    alt={it.title || ""}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100" />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: it.bgColor
                      ? `linear-gradient(to top, ${it.bgColor}, transparent)`
                      : "linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.25) 45%, transparent)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5" style={{ color: it.textColor || "#fff" }}>
                  <span className="block h-1 w-9 mb-3 rounded-full" style={{ backgroundColor: it.accent || accent }} />
                  {it.title ? <h3 className="text-lg font-semibold">{it.title}</h3> : null}
                  {it.text ? <p className="mt-1.5 text-sm opacity-80 leading-relaxed">{it.text}</p> : null}
                </div>
              </motion.div>
            );
            return it.href ? (
              <SmartLink key={i} href={it.href} className="block h-full">
                {tile}
              </SmartLink>
            ) : (
              <div key={i} className="h-full">
                {tile}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FaqBlock({ p, s: st }) {
  const items = Array.isArray(p.items) ? p.items : [];
  const [open, setOpen] = useState(null);
  const accent = accentOf(p);
  const two = p.columns === "2";
  return (
    <section className={`${two ? "max-w-6xl" : "max-w-3xl"} mx-auto px-6 ${padY(st, "py-12")}`}>
      {p.title ? (
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-3">{p.title}</h2>
      ) : null}
      {p.subtitle ? <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">{p.subtitle}</p> : null}
      {!p.subtitle && p.title ? <div className="mb-8" /> : null}
      <div className={two ? "grid md:grid-cols-2 gap-x-6 gap-y-3 items-start" : "space-y-3"}>
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <Reveal
              key={i}
              className={`border rounded-xl overflow-hidden ${it.bgColor ? "border-transparent" : "border-gray-200 bg-white"}`}
              style={{ backgroundColor: it.bgColor || undefined, color: it.textColor || undefined }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold ${
                  it.textColor ? "" : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span>{it.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  style={{ color: it.accent || accent }}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className={`px-5 pb-5 leading-relaxed ${it.textColor ? "opacity-80" : "text-gray-600"}`}>{it.a}</p>
              </motion.div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function ColumnsBlock({ p }) {
  const cols = Array.isArray(p.columns) ? p.columns : [];
  const grid = cols.length >= 3 ? "md:grid-cols-3" : cols.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className={`grid grid-cols-1 ${grid} gap-8`}>
        {cols.map((c, i) => (
          <Reveal key={i}>
            <div className="cms-prose" dangerouslySetInnerHTML={{ __html: c.html || "" }} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CtaBlock({ p }) {
  return (
    <section className="px-6 py-12">
      <Reveal
        className="max-w-6xl mx-auto rounded-3xl px-8 py-16 text-center shadow-xl"
        style={{ backgroundColor: p.bgColor || "#2563eb", color: p.textColor || "#fff" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold">{p.title}</h2>
        {p.text ? <p className="mt-3 opacity-90 max-w-2xl mx-auto">{p.text}</p> : null}
        {p.button?.label || p.secondaryButton?.label ? (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {p.button?.label ? (
              <SmartLink
                href={p.button.href}
                className="inline-block px-8 py-3.5 rounded-xl bg-white text-gray-900 font-semibold shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
              >
                {p.button.label}
              </SmartLink>
            ) : null}
            {p.secondaryButton?.label ? (
              <SmartLink
                href={p.secondaryButton.href}
                className="inline-block px-8 py-3.5 rounded-xl border-2 border-white/70 font-semibold hover:bg-white/10 transition-colors"
              >
                {p.secondaryButton.label}
              </SmartLink>
            ) : null}
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}

function BannerBlock({ p }) {
  const content = <span className="text-sm md:text-base font-medium">{p.text}</span>;
  return (
    <div style={{ backgroundColor: p.bgColor || "#111827", color: p.textColor || "#fff" }} className="w-full">
      <div className="max-w-6xl mx-auto px-6 py-3 text-center">
        {p.href ? (
          <SmartLink href={p.href} className="hover:underline">
            {content}
          </SmartLink>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

function SpacerBlock({ p }) {
  return <div style={{ height: `${parseInt(p.size || "48", 10) || 48}px` }} />;
}

/* ---------- Image slider / carousel ---------- */
const CAROUSEL_VARIANTS = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  zoom: { initial: { opacity: 0, scale: 1.08 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } },
  slide: { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } },
  "slide-up": { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -60 } },
};

const CONTENT_ALIGN = {
  bottom: "justify-end items-start text-left",
  center: "justify-center items-center text-center",
  left: "justify-center items-start text-left",
};

function CarouselBlock({ p }) {
  const slides = Array.isArray(p.slides) ? p.slides : [];
  const [i, setI] = useState(0);
  const count = slides.length;
  const go = (n) => setI((prev) => (count ? (prev + n + count) % count : 0));
  const goTo = (n) => setI(n);

  useEffect(() => {
    if (!p.autoplay || count <= 1) return;
    const ms = (parseFloat(p.interval) || 4) * 1000;
    const t = setInterval(() => setI((prev) => (prev + 1) % count), ms);
    return () => clearInterval(t);
  }, [p.autoplay, p.interval, count]);

  const h = parseInt(p.height, 10) || 440;
  const variant = CAROUSEL_VARIANTS[p.variant] || CAROUSEL_VARIANTS.fade;
  const kenBurns = p.kenBurns === true || p.variant === "kenburns";
  const overlay =
    p.overlay != null && p.overlay !== "" ? Math.min(parseInt(p.overlay, 10) || 0, 100) / 100 : null;
  const contentPos = CONTENT_ALIGN[p.contentAlign] || CONTENT_ALIGN.bottom;
  const full = p.fullWidth === true;
  const wrapCls = full ? "w-full" : "max-w-6xl mx-auto px-6 py-8";

  if (!count) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400" style={{ height: h }}>
          Add slides to the carousel
        </div>
      </div>
    );
  }
  return (
    <div className={wrapCls}>
      <div className={`relative overflow-hidden ${p.rounded && !full ? "rounded-2xl" : ""} shadow-lg`} style={{ height: h }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={i}
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {slides[i].image ? (
              <img
                src={slides[i].image}
                alt={slides[i].title || ""}
                className={`w-full h-full object-cover ${kenBurns ? "cms-kenburns" : ""}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
            )}
            {overlay != null ? (
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
            ) : null}
            {(slides[i].title || slides[i].caption) && (
              <div className={`absolute inset-0 flex flex-col p-6 md:p-12 text-white ${contentPos} ${overlay == null ? "bg-gradient-to-t from-black/70 via-black/10 to-transparent" : ""}`}>
                {slides[i].title ? <h3 className="text-2xl md:text-4xl font-bold drop-shadow max-w-2xl">{slides[i].title}</h3> : null}
                {slides[i].caption ? <p className="mt-2 max-w-xl opacity-90 drop-shadow">{slides[i].caption}</p> : null}
                {slides[i].href ? (
                  <SmartLink href={slides[i].href} className="mt-4 inline-block w-fit px-5 py-2.5 rounded-lg bg-white text-gray-900 font-semibold hover:scale-105 transition-transform">
                    {slides[i].ctaLabel || "Learn more"}
                  </SmartLink>
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {p.showArrows && count > 1 ? (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center shadow">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 flex items-center justify-center shadow">
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}

        {p.showDots && count > 1 ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, n) => (
              <button
                key={n}
                onClick={() => goTo(n)}
                aria-label={`Go to slide ${n + 1}`}
                className={`h-2.5 rounded-full transition-all ${n === i ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white/90"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Gallery ---------- */
function GalleryBlock({ p }) {
  const images = Array.isArray(p.images) ? p.images : [];
  const cols = p.columns === "2" ? "sm:grid-cols-2" : p.columns === "4" ? "grid-cols-2 md:grid-cols-4" : "sm:grid-cols-2 md:grid-cols-3";
  const gap = parseInt(p.gap, 10);
  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <motion.div
        className={`grid grid-cols-1 ${cols}`}
        style={{ gap: Number.isNaN(gap) ? 12 : gap }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {images.map((im, n) => (
          <motion.figure key={n} variants={reveal} className="overflow-hidden group">
            {im.src ? (
              <img
                src={im.src}
                alt={im.alt || ""}
                className={`w-full h-56 object-cover ${p.rounded ? "rounded-xl" : ""} group-hover:scale-105 transition-transform duration-500`}
              />
            ) : (
              <div className={`w-full h-56 bg-gray-100 ${p.rounded ? "rounded-xl" : ""}`} />
            )}
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------- Testimonials slider / grid ---------- */
function TestimonialCard({ t }) {
  const rating = parseInt(t.rating, 10) || 5;
  const star = t.accent || "";
  return (
    <div
      className={`h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow p-6 text-left flex flex-col ${
        t.bgColor ? "border-transparent" : "bg-white border-gray-100"
      }`}
      style={{ backgroundColor: t.bgColor || undefined, color: t.textColor || undefined }}
    >
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, n) => (
          <Star
            key={n}
            size={15}
            className={star ? "" : n < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
            style={star ? { color: n < rating ? star : "rgba(0,0,0,.15)", fill: n < rating ? star : "transparent" } : undefined}
          />
        ))}
      </div>
      <p className={`leading-relaxed flex-1 ${t.textColor ? "" : "text-gray-700"}`}>“{t.quote}”</p>
      <div className="mt-4 flex items-center gap-3">
        {t.avatar ? (
          <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-blue-500">
            {(t.name || "?").charAt(0)}
          </div>
        )}
        <div>
          <div className={`font-semibold text-sm ${t.textColor ? "" : "text-gray-900"}`}>{t.name}</div>
          {t.role ? <div className={`text-xs ${t.textColor ? "opacity-70" : "text-gray-500"}`}>{t.role}</div> : null}
        </div>
      </div>
    </div>
  );
}

function TestimonialsBlock({ p, s: st }) {
  const items = Array.isArray(p.items) ? p.items : [];
  const [i, setI] = useState(0);
  const count = items.length;
  useEffect(() => {
    if (count <= 1 || p.layout === "grid") return;
    const t = setInterval(() => setI((prev) => (prev + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count, p.layout]);
  if (!count) return null;

  // Grid layout — show every testimonial as a card.
  if (p.layout === "grid") {
    const cols = count >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : count === 2 ? "sm:grid-cols-2" : "";
    return (
      <section className={`max-w-6xl mx-auto px-6 ${padY(st, "py-14")}`}>
        {p.title ? <h2 className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-10">{p.title}</h2> : null}
        <motion.div
          className={`grid grid-cols-1 ${cols} gap-6`}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          {items.map((t, n) => (
            <motion.div key={n} variants={reveal}>
              <TestimonialCard t={t} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    );
  }

  const t = items[i];
  const rating = parseInt(t.rating, 10) || 5;
  return (
    <section className={`max-w-3xl mx-auto px-6 ${padY(st, "py-14")} text-center`}>
      {p.title ? <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-8">{p.title}</h2> : null}
      <Quote className="mx-auto text-blue-200 mb-4" size={40} />
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">“{t.quote}”</p>
          <div className="mt-4 flex justify-center gap-0.5">
            {Array.from({ length: 5 }).map((_, n) => (
              <Star key={n} size={16} className={n < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            {t.avatar ? <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" /> : null}
            <div className="text-left">
              <div className="font-semibold text-gray-900">{t.name}</div>
              {t.role ? <div className="text-sm text-gray-500">{t.role}</div> : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {count > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, n) => (
            <button key={n} onClick={() => setI(n)} aria-label={`Testimonial ${n + 1}`} className={`h-2.5 rounded-full transition-all ${n === i ? "w-7 bg-blue-600" : "w-2.5 bg-gray-300 hover:bg-gray-400"}`} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Pricing ---------- */
function PricingBlock({ p }) {
  const tiers = Array.isArray(p.tiers) ? p.tiers : [];
  const grid = tiers.length >= 3 ? "md:grid-cols-3" : tiers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      {p.title ? (
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{p.title}</h2>
          {p.subtitle ? <p className="mt-3 text-gray-600 max-w-2xl mx-auto">{p.subtitle}</p> : null}
        </div>
      ) : null}
      <div className={`grid grid-cols-1 ${grid} gap-6 items-stretch`}>
        {tiers.map((t, n) => {
          const feats = String(t.features || "").split("\n").map((f) => f.trim()).filter(Boolean);
          return (
            <motion.div
              key={n}
              variants={reveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className={`rounded-2xl border p-7 flex flex-col ${t.highlighted ? "border-blue-500 shadow-xl ring-1 ring-blue-200 relative" : "border-gray-200 shadow-sm"}`}
            >
              {t.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">Popular</span>
              ) : null}
              <h3 className="text-lg font-semibold text-gray-900">{t.name}</h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">{t.price}</span>
                {t.period ? <span className="text-gray-500 mb-1">{t.period}</span> : null}
              </div>
              <ul className="mt-6 space-y-2.5 flex-1">
                {feats.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {t.cta?.label ? (
                <SmartLink
                  href={t.cta.href}
                  className={`mt-7 text-center px-5 py-3 rounded-xl font-semibold transition-colors ${t.highlighted ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}
                >
                  {t.cta.label}
                </SmartLink>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Logo cloud ---------- */
function LogosBlock({ p }) {
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      {p.title ? <p className="text-center text-sm font-medium uppercase tracking-wider text-gray-400 mb-8">{p.title}</p> : null}
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {items.map((it, n) =>
          it.image ? (
            <img key={n} src={it.image} alt={it.alt || ""} className="h-9 md:h-11 object-contain opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition" />
          ) : (
            <div key={n} className="h-9 w-28 bg-gray-100 rounded" />
          )
        )}
      </div>
    </section>
  );
}

/* ---------- Team ---------- */
function TeamBlock({ p }) {
  const members = Array.isArray(p.members) ? p.members : [];
  const cols = p.columns === "2" ? "sm:grid-cols-2" : p.columns === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      {p.title ? <h2 className="text-center text-2xl md:text-4xl font-bold text-gray-900 mb-10">{p.title}</h2> : null}
      <motion.div className={`grid grid-cols-1 ${cols} gap-6`} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
        {members.map((m, n) => (
          <motion.div key={n} variants={reveal} className="text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-shadow">
            {m.photo ? (
              <img src={m.photo} alt={m.name} className="w-24 h-24 rounded-full object-cover mx-auto" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mx-auto flex items-center justify-center text-2xl font-bold text-blue-500">
                {(m.name || "?").charAt(0)}
              </div>
            )}
            <h3 className="mt-4 font-semibold text-gray-900">{m.name}</h3>
            {m.role ? <p className="text-sm text-blue-600">{m.role}</p> : null}
            {m.bio ? <p className="mt-2 text-sm text-gray-500">{m.bio}</p> : null}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------- Video embed ---------- */
function toEmbedUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean).pop()}`;
    return url;
  } catch {
    return url;
  }
}
function VideoBlock({ p }) {
  const src = toEmbedUrl(p.url);
  const mw = parseInt(p.maxWidth, 10) || 900;
  return (
    <section className="px-6 py-10 flex flex-col items-center">
      <div className="w-full" style={{ maxWidth: mw }}>
        {src ? (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingTop: "56.25%" }}>
            <iframe src={src} title={p.title || "video"} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400" style={{ paddingTop: "56.25%", position: "relative" }}>
            <span className="absolute inset-0 flex items-center justify-center">Add a video URL</span>
          </div>
        )}
        {p.title ? <p className="mt-3 text-sm text-gray-500 text-center">{p.title}</p> : null}
      </div>
    </section>
  );
}

/* ---------- Custom HTML + Tailwind ---------- */
function CustomCodeBlock({ p }) {
  const ref = useRef(null);
  useEffect(() => {
    if (p.tailwind !== false) {
      loadTailwindRuntime();
      // nudge the runtime to rescan after content mounts
      const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
      return () => clearTimeout(t);
    }
  }, [p.tailwind, p.html]);
  return <div ref={ref} className="cms-custom-html" dangerouslySetInnerHTML={{ __html: p.html || "" }} />;
}

/* ---------- Repeat (collection) ---------- */
// The binding engine has already unrolled the collection into
// `props._items = [{ key, blocks }]`; this only lays the results out.
function RepeaterBlock({ p, s }) {
  const items = Array.isArray(p._items) ? p._items : [];

  if (!items.length) {
    if (p.showEmpty === false) return null;
    return (
      <section className="px-6 py-10 text-center text-gray-400 text-sm">
        {p.emptyText || "Nothing to show yet."}
      </section>
    );
  }

  const gap = parseInt(p.gap, 10);
  const style = { gap: Number.isNaN(gap) ? 20 : gap };
  const cols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" };
  const layout =
    p.layout === "list"
      ? "flex flex-col"
      : `grid ${cols[String(p.columns || "3")] || cols[3]}`;

  return (
    <section className={`px-6 ${padY(s, "py-10")}`}>
      <div className={`max-w-6xl mx-auto items-stretch ${layout}`} style={style}>
        {items.map((item) => (
          // A flex cell, not `h-full`: a percentage height cannot resolve
          // against a grid item that the grid itself stretched, so the child
          // stayed as short as its own text and the buttons in a row never
          // lined up. Flex stretches it for real.
          <div key={item.key} className="min-w-0 flex">
            {item.blocks.map((b, i) => (
              <BlockView
                key={b.id || `${item.key}-${i}`}
                // The repeat owns the grid and its gaps, so a child drops the
                // page margins it would use standing on its own.
                block={{ ...b, _style: { ...(b._style || {}), _inRepeat: true } }}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Scroll Video ---------- */
// The wrapper deliberately does not clip (see STICKY_BLOCK_TYPES), so a corner
// radius is applied to the pinned stage instead — same look, sticky intact.
function ScrollVideoBlock({ p, s }) {
  return <ScrollVideo p={p} radius={s?.radius} />;
}

const RENDERERS = {
  hero: HeroBlock,
  heading: HeadingBlock,
  richText: RichTextBlock,
  image: ImageBlock,
  cardGrid: CardGridBlock,
  split: SplitBlock,
  imageTiles: ImageTilesBlock,
  beforeAfter: BeforeAfterBlock,
  card: CardBlock,
  stats: StatsBlock,
  faq: FaqBlock,
  columns: ColumnsBlock,
  cta: CtaBlock,
  banner: BannerBlock,
  spacer: SpacerBlock,
  carousel: CarouselBlock,
  gallery: GalleryBlock,
  testimonials: TestimonialsBlock,
  pricing: PricingBlock,
  logos: LogosBlock,
  team: TeamBlock,
  video: VideoBlock,
  repeater: RepeaterBlock,
  scrollVideo: ScrollVideoBlock,
  customCode: CustomCodeBlock,
};

// Blocks that pin themselves with position: sticky. Their wrapper must not
// clip or become a scroll container, because `position: sticky` resolves
// against the nearest scrolling ancestor — an `overflow: hidden` wrapper makes
// that wrapper the scrollport and the section silently stops pinning.
const STICKY_BLOCK_TYPES = new Set(["scrollVideo"]);

const SHADOWS = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.06)",
  md: "0 4px 12px rgba(0,0,0,.08)",
  lg: "0 12px 32px rgba(0,0,0,.12)",
  xl: "0 24px 60px rgba(0,0,0,.18)",
};

const HOVER_CLASS = {
  lift: "cms-hover-lift",
  glow: "cms-hover-glow",
  zoom: "cms-hover-zoom",
};

// Build wrapper styles from the block's Design settings (_style), with
// backward-compatibility for the older _adv shape.
function buildWrapper(block) {
  const s = block._style || {};
  const adv = block._adv || {};
  const pins = STICKY_BLOCK_TYPES.has(block.type);
  const px = (v) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : `${n}px`;
  };
  const style = {};

  // ----- background: gradient > image > solid color -----
  if (s.bgType === "gradient" && (s.gradFrom || s.gradTo)) {
    const from = s.gradFrom || "#2563eb";
    const to = s.gradTo || "#0f172a";
    const angle = parseInt(s.gradAngle, 10);
    style.backgroundImage = `linear-gradient(${Number.isNaN(angle) ? 135 : angle}deg, ${from}, ${to})`;
  } else if (s.bgColor) {
    style.backgroundColor = s.bgColor;
  }
  if (s.bgImage) {
    const overlay = parseInt(s.bgOverlay, 10);
    const layers = [];
    if (!Number.isNaN(overlay) && overlay > 0) {
      const a = Math.min(overlay, 100) / 100;
      layers.push(`linear-gradient(rgba(0,0,0,${a}), rgba(0,0,0,${a}))`);
    }
    layers.push(`url(${s.bgImage})`);
    style.backgroundImage = layers.join(", ");
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (s.textColor) style.color = s.textColor;

  // ----- spacing (four sides override the simple X/Y) -----
  const py = px(s.paddingY ?? adv.paddingY);
  if (py) {
    style.paddingTop = py;
    style.paddingBottom = py;
  }
  const pxx = px(s.paddingX);
  if (pxx) {
    style.paddingLeft = pxx;
    style.paddingRight = pxx;
  }
  const pt = px(s.paddingTop);
  if (pt) style.paddingTop = pt;
  const pr = px(s.paddingRight);
  if (pr) style.paddingRight = pr;
  const pb = px(s.paddingBottom);
  if (pb) style.paddingBottom = pb;
  const pl = px(s.paddingLeft);
  if (pl) style.paddingLeft = pl;

  const mt = px(s.marginTop);
  if (mt) style.marginTop = mt;
  const mb = px(s.marginBottom);
  if (mb) style.marginBottom = mb;

  if (s.align) style.textAlign = s.align;
  if (s.shadow && s.shadow !== "none") style.boxShadow = SHADOWS[s.shadow] || undefined;

  const minH = px(s.minHeight);
  if (minH && !pins) {
    style.minHeight = minH;
    style.display = "flex";
    style.flexDirection = "column";
    style.justifyContent = "center";
  }

  const bw = px(s.borderWidth);
  if (bw) {
    style.borderStyle = "solid";
    style.borderWidth = bw;
    style.borderColor = s.borderColor || "#e5e7eb";
  }

  // maxWidth wraps the block in a centered container.
  const mw = px(s.maxWidth);
  const radius = px(s.radius);
  if (radius && !pins) {
    style.borderRadius = radius;
    style.overflow = "hidden";
  }

  const classes = [];
  if (s.className || adv.className) classes.push(s.className || adv.className);
  if (s.hover && HOVER_CLASS[s.hover]) classes.push(HOVER_CLASS[s.hover]);
  // Block bodies carry their own Tailwind text colours (text-gray-900 and so
  // on), which beat the wrapper's inline `color`. Without this an author who
  // sets a dark background and white text in the Design tab gets dark text on
  // a dark band — invisible. The class makes the body inherit instead.
  if (s.textColor) classes.push("cms-inherit-color");

  return {
    style,
    maxWidth: mw,
    className: classes.join(" "),
    anchorId: s.anchorId || adv.anchorId || "",
    animation: s.animation && s.animation !== "none" ? s.animation : "",
    animDuration: s.animDuration,
    animDelay: s.animDelay,
  };
}

// Wraps a block and reveals it once it scrolls into view. The reveal class is
// added directly to the DOM node in an effect (never via React state), so the
// server and client render identical markup — no hydration mismatch — and the
// animation is purely CSS-driven and cheap. No-op when no animation is set.
function AnimatedBlock({ animation, animDuration, animDelay, id, blockType = "", blockId = "", className, style, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!animation) return;
    const el = ref.current;
    if (!el) return;
    // The element may live in another document — the builder previews the page
    // inside an iframe so its media queries answer to the device width. An
    // observer built from *this* window would watch the wrong viewport and
    // never fire, leaving every animated section stuck at opacity 0. Take the
    // constructor from whichever window actually owns the element.
    const view = el.ownerDocument?.defaultView || window;
    // Fallback: no IntersectionObserver → just reveal immediately.
    if (typeof view.IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new view.IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animation]);

  const animStyle = animation
    ? {
        ...style,
        "--cms-anim-duration": animDuration ? `${parseInt(animDuration, 10)}ms` : undefined,
        "--cms-anim-delay": animDelay ? `${parseInt(animDelay, 10)}ms` : undefined,
      }
    : style;

  return (
    <div
      ref={ref}
      id={id || undefined}
      data-cms-block={blockType || undefined}
      data-cms-id={blockId || undefined}
      className={className || undefined}
      style={animStyle}
      data-cms-anim={animation || undefined}
    >
      {children}
    </div>
  );
}

export function BlockView({ block, showWarnings = false }) {
  const Cmp = RENDERERS[block?.type];
  if (!Cmp) return null;
  const { style, maxWidth, className, anchorId, animation, animDuration, animDelay } = buildWrapper(block);

  // A block's own CSS is rewritten to apply only inside that block, so an
  // author can style what they are looking at without inventing a class name
  // and without a rule leaking across the rest of the page.
  const scopeId = blockScopeId(block.id);
  // The ::before / ::after layers come first so the author's own CSS, written
  // later in the same tag, can still override them.
  const css = [
    decorationCss(blockScopeSelector(block.id), block._style),
    scopeCss(block._style?.css, block.id),
  ]
    .filter(Boolean)
    .join("\n");

  const content = (
    <>
      {showWarnings && block._missing?.length ? <MissingVariableWarning missing={block._missing} /> : null}
      <Cmp p={block.props || {}} s={block._style || {}} />
    </>
  );
  const inner = maxWidth ? (
    <div style={{ maxWidth, marginLeft: "auto", marginRight: "auto" }}>{content}</div>
  ) : (
    content
  );

  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <AnimatedBlock
        // The anchor id stays the author's own, for linking. The scope rides
        // along as a class so the two never collide.
        id={anchorId}
        className={[className, scopeId, block._style?._inRepeat ? "cms-repeat-child" : ""]
          .filter(Boolean)
          .join(" ")}
        style={style}
        animation={animation}
        animDuration={animDuration}
        animDelay={animDelay}
        blockType={block.type}
        blockId={block.id}
      >
        {inner}
      </AnimatedBlock>
    </>
  );
}

// Builder-only notice. Public pages never render this: an unresolved variable
// simply falls back to its configured fallback (or an empty string) so the page
// degrades gracefully instead of breaking.
function MissingVariableWarning({ missing }) {
  const unique = [...new Map(missing.map((m) => [`${m.prop}:${m.path}`, m])).values()];
  return (
    <div className="mx-6 my-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <AlertTriangle size={13} /> Variable unavailable
      </span>
      <ul className="mt-1 space-y-0.5">
        {unique.map((m) => (
          <li key={`${m.prop}:${m.path}`}>
            <code className="font-mono">{m.path}</code>
            <span className="opacity-70"> — {m.error || "not found in the current data"}</span>
            {m.prop ? <span className="opacity-50"> (property: {m.prop})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Render a page's blocks.
 *
 * `data` is the resolved data context. When it is provided the blocks go
 * through the binding engine first (conditions → repeaters → variables); when
 * it is omitted the blocks render exactly as stored, which is what keeps every
 * pre-existing static page working untouched.
 */
export default function BlockRenderer({ blocks, data = null, showWarnings = false }) {
  const rendered = useMemo(() => {
    if (!Array.isArray(blocks) || blocks.length === 0) return [];
    if (!data) return blocks;
    try {
      return expandBlocks(blocks, data);
    } catch (err) {
      console.error("CMS binding failed, falling back to raw blocks:", err?.message);
      return blocks;
    }
  }, [blocks, data]);

  if (!rendered.length) return null;
  return (
    <>
      {rendered.map((b, i) => (
        <BlockView key={b.id || `block-${i}`} block={b} showWarnings={showWarnings} />
      ))}
    </>
  );
}
