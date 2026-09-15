"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Component } from "react";
import * as LucideIcons from "lucide-react";
import * as FramerMotion from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";

/* ---------- Cache & Script Loaders ---------- */
const _loadedScripts = new Set();
export function loadExternalScript(src) {
  if (typeof window === "undefined" || !src) return Promise.resolve();
  if (_loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    // Check if already in DOM
    if (document.querySelector(`script[src="${src}"]`)) {
      _loadedScripts.add(src);
      return resolve();
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      _loadedScripts.add(src);
      resolve();
    };
    s.onerror = () => {
      console.warn("Failed to load external script:", src);
      resolve(); // Graceful non-blocking
    };
    document.head.appendChild(s);
  });
}

const _loadedFonts = new Set();
export function loadGoogleFont(fontName) {
  if (typeof window === "undefined" || !fontName) return;
  const clean = fontName.trim();
  if (!clean || _loadedFonts.has(clean)) return;
  _loadedFonts.add(clean);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:ital,wght@0,300..900;1,300..900&display=swap`;
  document.head.appendChild(link);
}

/* ---------- Tailwind browser runtime loader ---------- */
let _twLoading = null;
function loadTailwind() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__cmsTailwind) return Promise.resolve();
  if (_twLoading) return _twLoading;
  _twLoading = loadExternalScript("/cms/tailwind-browser.js").then(() => {
    window.__cmsTailwind = true;
  });
  return _twLoading;
}

/* ---------- Babel standalone loader (for dynamic JSX compilation) ---------- */
let _babelLoading = null;
export function ensureBabel() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Babel) return Promise.resolve(window.Babel);
  if (_babelLoading) return _babelLoading;
  _babelLoading = loadExternalScript("/cms/babel.min.js")
    .then(() => {
      if (window.Babel) return window.Babel;
      return loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.4/babel.min.js").then(() => {
        return window.Babel || null;
      });
    })
    .catch(() => {
      return loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.4/babel.min.js").then(() => {
        return window.Babel || null;
      });
    });
  return _babelLoading;
}

/* ---------- Dedicated Error Boundary ---------- */
class SdkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("SDK Custom Section runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-6 max-w-4xl p-6 rounded-2xl border-2 border-dashed border-red-300 bg-red-50/90 text-red-800 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-200/80 text-red-900 text-xs font-bold mb-2">
            <LucideIcons.AlertTriangle size={14} /> Custom Section Error
          </div>
          <h4 className="font-semibold text-sm text-red-950">
            {this.props.sectionName || "Custom SDK Section"} encountered a runtime error
          </h4>
          <p className="mt-1 font-mono text-xs text-red-700 bg-white/70 py-2 px-3 rounded-lg border border-red-200 inline-block max-w-full overflow-x-auto">
            {this.state.error?.message || String(this.state.error)}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Interpolate simple {{key}} variables into HTML template
 */
function interpolateHtml(html, props = {}, data = {}) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    // 1. Check in props
    if (props[key] !== undefined && props[key] !== null) {
      return String(props[key]);
    }
    // 2. Check in data context (e.g. site.title or courses)
    const parts = key.split(".");
    let curr = data;
    for (const part of parts) {
      if (curr && typeof curr === "object" && part in curr) {
        curr = curr[part];
      } else {
        curr = undefined;
        break;
      }
    }
    if (curr !== undefined && curr !== null) {
      return typeof curr === "object" ? JSON.stringify(curr) : String(curr);
    }
    return match; // Leave unreplaced if not found
  });
}

/**
 * Wraps user script into a valid executable React Component function so that:
 * 1. Hooks (useState, useEffect, useRef, etc.) execute inside the component render lifecycle.
 * 2. Props and Data are available both via arguments and outer scope.
 * 3. Lucide icons can be used directly as JSX elements without 'ReferenceError'.
 */
export function prepareExecutableCode(rawCode) {
  let clean = (rawCode || "").trim();
  if (!clean) return "return function EmptySection() { return null; };";

  // 1. If author uses "export default"
  if (clean.includes("export default")) {
    return clean.replace(/export\s+default\s+/, "return ");
  }

  // 2. If author already wrote an explicit return of a function component:
  // e.g. "return function...", "return (props) =>", "return (function..."
  if (/^return\s+(function|\(?props\)?\s*=>|\(\s*function)/.test(clean)) {
    return clean;
  }

  // 3. If author wrote a named component function at top level without returning it:
  // e.g. "function HeroSection(props) { ... }"
  const namedFuncMatch = clean.match(/^function\s+([A-Z][A-Za-z0-9_]*)\s*\(/m);
  if (namedFuncMatch && namedFuncMatch[1]) {
    const funcName = namedFuncMatch[1];
    if (!new RegExp(`return\\s+${funcName}\\b`).test(clean)) {
      return `${clean}\nreturn ${funcName};`;
    }
    return clean;
  }

  // 4. If author wrote a const component at top level:
  // e.g. "const HeroSection = (props) => { ... }"
  const constFuncMatch = clean.match(/^const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(\(|function)/m);
  if (constFuncMatch && constFuncMatch[1]) {
    const funcName = constFuncMatch[1];
    if (!new RegExp(`return\\s+${funcName}\\b`).test(clean)) {
      return `${clean}\nreturn ${funcName};`;
    }
    return clean;
  }

  // 5. Standard SDK Pattern:
  // The user script is the body of the component (can contain hooks, state, variables, and returns JSX)
  let innerBody = clean;
  if (!innerBody.includes("return ") && !innerBody.includes("return(") && !innerBody.includes("return\n")) {
    innerBody = `return (\n${innerBody}\n);`;
  }

  return `return function SdkSectionComponent(props) {\n  const data = props?.data || {};\n  ${innerBody}\n};`;
}

/**
 * SdkCustomBlock
 * --------------
 * Renders a custom section built in the Section Code Studio (SDK).
 * Supports JSX, React Hooks, Framer Motion, GSAP, Tailwind, Google Fonts, and API actions.
 */
export default function SdkCustomBlock({ p = {}, s = {}, block = null, data = null, showWarnings = false }) {
  const actualProps = block?.props || p || {};
  const actualStyle = block?._style || s || {};
  const code = actualProps._code || actualProps.code || "";
  const css = actualProps._css || actualProps.css || "";
  const options = actualProps._options || actualProps.options || {};
  const font = options.googleFont || options.font || actualProps.font || "";
  const sectionName = actualProps._name || actualProps.name || "Custom SDK Section";
  const uniqueId = useMemo(() => `sdk_${Math.random().toString(36).slice(2, 9)}`, []);

  const [CompiledComponent, setCompiledComponent] = useState(null);
  const [compilationError, setCompilationError] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Load Google Font if requested
  useEffect(() => {
    if (font) {
      loadGoogleFont(font);
    }
  }, [font]);

  // Load Tailwind if requested
  useEffect(() => {
    if (options.enableTailwind !== false) {
      loadTailwind().then(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }
  }, [options.enableTailwind]);

  // Load GSAP if requested
  useEffect(() => {
    if (options.enableGsap) {
      loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js").then(() => {
        loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js");
      });
    }
  }, [options.enableGsap]);

  // Determine whether code is JSX/React Component or HTML
  const isJsxOrComponent = useMemo(() => {
    if (!code) return false;
    const trimmed = code.trim();
    return (
      trimmed.includes("return") ||
      trimmed.includes("<") ||
      trimmed.startsWith("function") ||
      trimmed.startsWith("const ") ||
      trimmed.includes("=>")
    );
  }, [code]);

  // Compile / evaluate component code
  useEffect(() => {
    let active = true;

    async function compile() {
      if (!code || !code.trim()) {
        if (active) setCompiledComponent(null);
        return;
      }

      // If it is simple HTML (e.g. starts with <section or <div and has no functions/returns):
      const trimmed = code.trim();
      const isPlainHtml =
        (trimmed.startsWith("<") && !trimmed.includes("return ") && !trimmed.includes("=>")) ||
        actualProps.mode === "html";

      if (isPlainHtml) {
        if (active) {
          setCompiledComponent(() => {
            return function HtmlRenderer({ props: compProps }) {
              const interpolated = interpolateHtml(trimmed, compProps, data);
              return <div className="cms-sdk-html" dangerouslySetInnerHTML={{ __html: interpolated }} />;
            };
          });
          setCompilationError(null);
        }
        return;
      }

      // React / JSX Component compilation
      setIsCompiling(true);
      try {
        const Babel = await ensureBabel();
        if (!active) return;

        // Wrap code if author wrote a bare component, hooks, or return statement
        const codeToCompile = prepareExecutableCode(trimmed);

        let jsCode = codeToCompile;
        if (Babel) {
          const transformed = Babel.transform(codeToCompile, {
            presets: [["react", { runtime: "classic" }]],
          });
          jsCode = transformed.code;
        }

        // Scope creation with full Lucide icon components directly available
        const lucideEntries = Object.entries(LucideIcons).filter(
          ([name]) => /^[A-Z]/.test(name) && name !== "default"
        );
        const lucideNames = lucideEntries.map(([name]) => name);
        const lucideValues = lucideEntries.map(([, comp]) => comp);

        const scopeNames = [
          "React",
          "useState",
          "useEffect",
          "useRef",
          "useMemo",
          "useCallback",
          "motion",
          "AnimatePresence",
          "icons",
          "gsap",
          "axios",
          "toast",
          "props",
          "data",
          ...lucideNames,
        ];

        const scopeValues = [
          React,
          useState,
          useEffect,
          useRef,
          useMemo,
          useCallback,
          FramerMotion.motion,
          FramerMotion.AnimatePresence,
          LucideIcons,
          typeof window !== "undefined" ? window.gsap : null,
          axios,
          toast,
          actualProps,
          data,
          ...lucideValues,
        ];

        const fn = new Function(...scopeNames, jsCode);

        const ResultComponent = fn(...scopeValues);

        if (typeof ResultComponent === "function") {
          if (active) {
            setCompiledComponent(() => ResultComponent);
            setCompilationError(null);
          }
        } else if (React.isValidElement(ResultComponent)) {
          if (active) {
            setCompiledComponent(() => () => ResultComponent);
            setCompilationError(null);
          }
        } else {
          throw new Error("Custom code must return a React Component or JSX element");
        }
      } catch (err) {
        console.warn("Failed to compile SDK custom section:", err);
        if (active) {
          setCompilationError(err.message || String(err));
        }
      } finally {
        if (active) setIsCompiling(false);
      }
    }

    compile();

    return () => {
      active = false;
    };
  }, [code, data, actualProps.mode]);

  // Scoped CSS styles
  const scopedCss = useMemo(() => {
    if (!css || typeof css !== "string") return "";
    return `
      .${uniqueId} {
        ${font ? `font-family: '${font}', sans-serif;` : ""}
      }
      ${css}
    `;
  }, [css, font, uniqueId]);

  return (
    <SdkErrorBoundary sectionName={sectionName}>
      <div className={`cms-sdk-section ${uniqueId}`} style={font ? { fontFamily: `'${font}', sans-serif` } : undefined}>
        {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}

        {compilationError ? (
          <div className="mx-auto my-4 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <LucideIcons.AlertCircle size={14} /> Compilation Notice
            </div>
            <p className="font-mono">{compilationError}</p>
          </div>
        ) : isCompiling ? (
          <div className="p-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <LucideIcons.Loader2 size={16} className="animate-spin text-blue-500" />
            Loading section...
          </div>
        ) : CompiledComponent ? (
          <CompiledComponent
            props={actualProps}
            {...actualProps}
            data={data}
            motion={FramerMotion.motion}
            icons={LucideIcons}
            toast={toast}
          />
        ) : !code ? (
          <div className="p-10 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 text-sm">
            <LucideIcons.Code2 size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-600">{sectionName}</p>
            <p className="text-xs text-gray-400 mt-0.5">Empty code block. Open Code Studio to write markup &amp; logic.</p>
          </div>
        ) : null}
      </div>
    </SdkErrorBoundary>
  );
}
