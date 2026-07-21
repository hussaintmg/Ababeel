"use client";

import { useSiteContent } from "@/context/SiteContentContext";

const SHADOWS = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.06)",
  md: "0 4px 12px rgba(0,0,0,.08)",
  lg: "0 12px 32px rgba(0,0,0,.12)",
  xl: "0 24px 60px rgba(0,0,0,.18)",
};

// Injects the CMS-managed appearance for the auth pages (login, forgot-password,
// OTP verify, reset-password). Scoped to `.cms-auth` with these hooks:
//   .cms-auth        page container
//   .cms-auth-card   the form card
//   .cms-auth-title  main heading
//   .cms-auth-sub    subtitle / helper text
//   .cms-auth-input  text inputs
//   .cms-auth-btn    primary submit button
//   .cms-auth-link   inline links
// Every rule is emitted only when a value is set, so unset options keep the
// page's built-in look.
export default function AuthTheme() {
  const { settings } = useSiteContent();
  const s = settings?.auth?.style || {};
  const css = settings?.auth?.css || "";
  const px = (v) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : `${n}px`;
  };
  const r = [];

  // ---- page background ----
  if (s.bgType === "gradient" && (s.gradFrom || s.gradTo)) {
    const a = parseInt(s.gradAngle, 10);
    r.push(`.cms-auth { background: linear-gradient(${Number.isNaN(a) ? 135 : a}deg, ${s.gradFrom || "#2563eb"}, ${s.gradTo || "#0f172a"}) !important; }`);
  } else if (s.bgType === "image" && s.bgImage) {
    const ov = parseInt(s.bgOverlay, 10);
    const layers = [];
    if (!Number.isNaN(ov) && ov > 0) {
      const alpha = Math.min(ov, 100) / 100;
      layers.push(`linear-gradient(rgba(0,0,0,${alpha}), rgba(0,0,0,${alpha}))`);
    }
    layers.push(`url("${s.bgImage}")`);
    r.push(`.cms-auth { background-image: ${layers.join(", ")} !important; background-size: cover !important; background-position: center !important; }`);
  } else if (s.bgColor) {
    r.push(`.cms-auth { background: ${s.bgColor} !important; }`);
  }

  // ---- card alignment (horizontal position) ----
  if (s.cardAlign) {
    const j = s.cardAlign === "left" ? "flex-start" : s.cardAlign === "right" ? "flex-end" : "center";
    r.push(`.cms-auth { justify-content: ${j} !important; }`);
  }

  // ---- card ----
  const cardBits = [];
  if (s.cardBg) cardBits.push(`background-color: ${s.cardBg} !important`);
  if (s.cardText) cardBits.push(`color: ${s.cardText}`);
  const cr = px(s.cardRadius);
  if (cr) cardBits.push(`border-radius: ${cr}`);
  if (s.cardShadow && SHADOWS[s.cardShadow]) cardBits.push(`box-shadow: ${SHADOWS[s.cardShadow]}`);
  const cmw = px(s.cardMaxWidth);
  if (cmw) cardBits.push(`max-width: ${cmw}; width: 100%`);
  if (s.cardBorderColor) cardBits.push(`border: 1px solid ${s.cardBorderColor}`);
  if (cardBits.length) r.push(`.cms-auth .cms-auth-card { ${cardBits.join("; ")}; }`);

  // ---- typography ----
  if (s.titleColor) r.push(`.cms-auth .cms-auth-title { color: ${s.titleColor} !important; }`);
  if (s.subtitleColor) r.push(`.cms-auth .cms-auth-sub { color: ${s.subtitleColor} !important; }`);

  // ---- inputs ----
  const inBits = [];
  if (s.inputBg) inBits.push(`background-color: ${s.inputBg}`);
  if (s.inputBorder) inBits.push(`border-color: ${s.inputBorder}`);
  if (s.inputText) inBits.push(`color: ${s.inputText}`);
  if (inBits.length) r.push(`.cms-auth .cms-auth-input { ${inBits.join("; ")}; }`);
  if (s.inputFocus) {
    r.push(`.cms-auth .cms-auth-input:focus { border-color: ${s.inputFocus} !important; box-shadow: 0 0 0 3px ${s.inputFocus}33 !important; }`);
  }

  // ---- primary button ----
  if (s.accent) r.push(`.cms-auth .cms-auth-btn { background-color: ${s.accent} !important; background-image: none !important; }`);
  if (s.buttonText) r.push(`.cms-auth .cms-auth-btn { color: ${s.buttonText} !important; }`);
  if (s.accentHover) r.push(`.cms-auth .cms-auth-btn:hover { background-color: ${s.accentHover} !important; }`);

  // ---- links ----
  if (s.linkColor) r.push(`.cms-auth .cms-auth-link { color: ${s.linkColor} !important; }`);

  const out = r.join("\n") + (css ? `\n${css}` : "");
  if (!out.trim()) return null;
  return <style data-cms-auth="" dangerouslySetInnerHTML={{ __html: out }} />;
}
