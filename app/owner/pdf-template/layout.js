"use client";

import { TemplateProvider } from "@/context/TemplateContext";

// Wraps every /owner/pdf-template page so `useTemplates()` / `useTemplate()`
// have their provider (the list, per-type, and design-editor pages all use it).
export default function PdfTemplateLayout({ children }) {
  return <TemplateProvider>{children}</TemplateProvider>;
}
