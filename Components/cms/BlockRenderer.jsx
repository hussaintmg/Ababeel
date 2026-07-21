"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Star, Check, Quote } from "lucide-react";

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
  return (
    <section
      className={`relative overflow-hidden ${p.rounded ? "rounded-3xl" : ""}`}
      style={{ ...bg, minHeight: Number.isNaN(minH) ? undefined : minH }}
    >
      {p.image ? (
        <>
          <img src={p.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
        </>
      ) : null}
      <div
        className={`relative max-w-5xl mx-auto px-6 flex flex-col ${align} ${Number.isNaN(minH) ? "py-20 md:py-28" : "flex-1 justify-center py-16"}`}
        style={{ paddingTop: padY, paddingBottom: padY, minHeight: Number.isNaN(minH) ? undefined : "inherit" }}
      >
        {p.eyebrow ? (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/15 backdrop-blur"
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
                className="px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
              >
                {p.primaryCta.label}
              </SmartLink>
            ) : null}
            {p.secondaryCta?.label ? (
              <SmartLink
                href={p.secondaryCta.href}
                className="px-6 py-3 rounded-xl border border-white/60 font-semibold hover:bg-white/10 transition-colors"
              >
                {p.secondaryCta.label}
              </SmartLink>
            ) : null}
          </motion.div>
        )}
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

function CardGridBlock({ p }) {
  const cols =
    p.columns === "2"
      ? "sm:grid-cols-2"
      : p.columns === "4"
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      {p.title ? (
        <Reveal className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{p.title}</h2>
          {p.subtitle ? <p className="mt-3 text-gray-600 max-w-2xl mx-auto">{p.subtitle}</p> : null}
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
              className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6"
            >
              {it.image ? (
                <img src={it.image} alt={it.title || ""} className="w-full h-40 object-cover rounded-xl mb-4" />
              ) : it.icon ? (
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">
                  {it.icon}
                </div>
              ) : null}
              {it.title ? <h3 className="text-lg font-semibold text-gray-900">{it.title}</h3> : null}
              {it.text ? <p className="mt-2 text-gray-600 text-sm leading-relaxed">{it.text}</p> : null}
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

function StatsBlock({ p }) {
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <section style={{ backgroundColor: p.bgColor || "#f1f5f9" }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        {p.title ? (
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-900 mb-10">{p.title}</h2>
        ) : null}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {items.map((it, i) => (
            <motion.div key={i} variants={reveal} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-blue-600">{it.value}</div>
              <div className="mt-1 text-sm md:text-base text-gray-600">{it.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FaqBlock({ p }) {
  const items = Array.isArray(p.items) ? p.items : [];
  const [open, setOpen] = useState(null);
  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      {p.title ? (
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-8">{p.title}</h2>
      ) : null}
      <div className="space-y-3">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50"
              >
                <span>{it.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-gray-600 leading-relaxed">{it.a}</p>
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
        className="max-w-5xl mx-auto rounded-3xl px-8 py-14 text-center shadow-xl"
        style={{ backgroundColor: p.bgColor || "#2563eb", color: p.textColor || "#fff" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold">{p.title}</h2>
        {p.text ? <p className="mt-3 opacity-90 max-w-2xl mx-auto">{p.text}</p> : null}
        {p.button?.label ? (
          <div className="mt-8">
            <SmartLink
              href={p.button.href}
              className="inline-block px-8 py-3.5 rounded-xl bg-white text-gray-900 font-semibold shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
            >
              {p.button.label}
            </SmartLink>
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
  return (
    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-6 text-left flex flex-col">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, n) => (
          <Star key={n} size={15} className={n < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
        ))}
      </div>
      <p className="text-gray-700 leading-relaxed flex-1">“{t.quote}”</p>
      <div className="mt-4 flex items-center gap-3">
        {t.avatar ? (
          <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-blue-500">
            {(t.name || "?").charAt(0)}
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
          {t.role ? <div className="text-xs text-gray-500">{t.role}</div> : null}
        </div>
      </div>
    </div>
  );
}

function TestimonialsBlock({ p }) {
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
      <section className="max-w-6xl mx-auto px-6 py-14">
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
    <section className="max-w-3xl mx-auto px-6 py-14 text-center">
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

const RENDERERS = {
  hero: HeroBlock,
  heading: HeadingBlock,
  richText: RichTextBlock,
  image: ImageBlock,
  cardGrid: CardGridBlock,
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
  customCode: CustomCodeBlock,
};

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
  if (minH) {
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
  if (radius) {
    style.borderRadius = radius;
    style.overflow = "hidden";
  }

  const classes = [];
  if (s.className || adv.className) classes.push(s.className || adv.className);
  if (s.hover && HOVER_CLASS[s.hover]) classes.push(HOVER_CLASS[s.hover]);

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
function AnimatedBlock({ animation, animDuration, animDelay, id, className, style, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!animation) return;
    const el = ref.current;
    if (!el) return;
    // Fallback: no IntersectionObserver → just reveal immediately.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
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
      className={className || undefined}
      style={animStyle}
      data-cms-anim={animation || undefined}
    >
      {children}
    </div>
  );
}

export function BlockView({ block }) {
  const Cmp = RENDERERS[block?.type];
  if (!Cmp) return null;
  const { style, maxWidth, className, anchorId, animation, animDuration, animDelay } = buildWrapper(block);

  const content = <Cmp p={block.props || {}} />;
  const inner = maxWidth ? (
    <div style={{ maxWidth, marginLeft: "auto", marginRight: "auto" }}>{content}</div>
  ) : (
    content
  );

  return (
    <AnimatedBlock
      id={anchorId}
      className={className}
      style={style}
      animation={animation}
      animDuration={animDuration}
      animDelay={animDelay}
    >
      {inner}
    </AnimatedBlock>
  );
}

export default function BlockRenderer({ blocks }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView key={b.id || `block-${i}`} block={b} />
      ))}
    </>
  );
}
