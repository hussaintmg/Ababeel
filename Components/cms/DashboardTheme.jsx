"use client";

import { useSiteContent } from "@/context/SiteContentContext";

// Injects the CMS-managed dashboard appearance. STYLE ONLY: every rule is scoped
// to `.cms-dash` (the class on each dashboard layout root) and only ever changes
// colors / spacing / layout — never content or the real data shown inside.
//
// Add `cms-dash` to a dashboard layout's root element and render <DashboardTheme />
// inside it. Unset options fall back to the dashboard's built-in look.
export default function DashboardTheme() {
  const { settings } = useSiteContent();
  const d = settings?.dashboard || {};
  const s = d.style || {};

  const width = parseInt(s.contentWidth, 10);
  const rules = [];

  // Page background + base text
  if (s.bg) rules.push(`.cms-dash { background-color: ${s.bg} !important; }`);
  if (s.text) rules.push(`.cms-dash { color: ${s.text}; }`);

  // Cards (white surfaces) in the content area only — scoped to `main` so it
  // doesn't fight the sidebar background (which is themed separately below).
  if (s.cardBg) rules.push(`.cms-dash main .bg-white { background-color: ${s.cardBg} !important; }`);

  // Accent — remap the dashboards' blue accent and expose a CSS variable.
  if (s.accent) {
    rules.push(`.cms-dash { --dash-accent: ${s.accent}; }`);
    rules.push(`.cms-dash .bg-blue-600, .cms-dash .bg-blue-700 { background-color: ${s.accent} !important; }`);
    rules.push(`.cms-dash .text-blue-600, .cms-dash .text-blue-700 { color: ${s.accent} !important; }`);
    rules.push(`.cms-dash .border-blue-600, .cms-dash .border-blue-500 { border-color: ${s.accent} !important; }`);
  }

  // Sidebar
  if (s.sidebarBg) rules.push(`.cms-dash aside { background-color: ${s.sidebarBg} !important; }`);
  if (s.sidebarText) {
    rules.push(`.cms-dash aside, .cms-dash aside a, .cms-dash aside span, .cms-dash aside button, .cms-dash aside p { color: ${s.sidebarText} !important; }`);
  }

  // Content column width (layout)
  if (!Number.isNaN(width)) {
    rules.push(`.cms-dash main > div { max-width: ${width}px; margin-left: auto; margin-right: auto; }`);
  }

  // Free scoped CSS escape hatch (owner targets .cms-dash ...).
  const css = rules.join("\n") + (d.css ? `\n${d.css}` : "");
  if (!css.trim()) return null;
  return <style data-cms-dashboard="" dangerouslySetInnerHTML={{ __html: css }} />;
}
