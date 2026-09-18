"use client";

import React, { createContext, useContext, useMemo } from "react";
import { getPath, isDynamic, resolveTemplate, formatTransform } from "@/lib/cms/expression";
import { evaluateConditions } from "@/lib/cms/conditions";
import { sanitizeUrl } from "@/lib/cms/features";

export const SDK_VERSION = "2.0.0";

/* ---------------- Contexts ---------------- */

export const CMSDataContext = createContext({
  data: {},
  route: { params: {}, query: {} },
  site: {},
  user: null,
  theme: {},
});

export const CMSLoopContext = createContext(null);

export function useCMSContext() {
  return useContext(CMSDataContext);
}

export function useCMSData(path, fallback = undefined) {
  const { data } = useCMSContext();
  const loop = useCMSLoopItem();
  if (!path) return fallback;
  const val = getPath({ ...data, ...loop }, path);
  return val !== undefined && val !== null ? val : fallback;
}

export function useCMSLoopItem() {
  return useContext(CMSLoopContext);
}

/* ---------------- Theme & Helpers ---------------- */

export const cms = {
  version: SDK_VERSION,
  theme: {
    colors: {
      primary: "var(--studio-accent, #0284c7)",
      primaryDark: "#0369a1",
      background: "var(--studio-bg, #0f172a)",
      card: "var(--studio-card, #1e293b)",
      text: "var(--studio-fg, #ffffff)",
      textMuted: "#94a3b8",
      border: "rgba(255, 255, 255, 0.1)",
      borderLight: "rgba(0, 0, 0, 0.08)",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
    },
    radius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "9999px",
    },
    typography: {
      fontFamily: "var(--studio-font, 'Inter', sans-serif)",
    },
  },
  sanitizeUrl(url) {
    if (!url || typeof url !== "string") return "#";
    const clean = url.trim();
    if (clean.startsWith("javascript:") || clean.startsWith("data:text/html")) return "#";
    return clean;
  },
  responsive(map) {
    return map;
  },
};

/* ---------------- Definitions ---------------- */

export function defineSection(config) {
  if (!config || typeof config !== "object") {
    throw new Error("defineSection requires a configuration object");
  }
  const comp = config.component;
  if (typeof comp === "function") {
    const WrappedSection = function (props) {
      return comp(props);
    };
    WrappedSection.__isCmsSection = true;
    WrappedSection.__definition = config;
    return WrappedSection;
  }
  return {
    ...config,
    id: config.id || `sec_${Date.now()}`,
    sdkVersion: config.sdkVersion || SDK_VERSION,
    __isCmsSection: true,
  };
}

export function defineTemplate(config) {
  if (!config || typeof config !== "object") {
    throw new Error("defineTemplate requires a configuration object");
  }
  const comp = config.component;
  if (typeof comp === "function") {
    const WrappedTemplate = function (props) {
      return comp(props);
    };
    WrappedTemplate.__isCmsTemplate = true;
    WrappedTemplate.__definition = config;
    return WrappedTemplate;
  }
  return {
    ...config,
    id: config.id || `tpl_${Date.now()}`,
    sdkVersion: config.sdkVersion || SDK_VERSION,
    __isCmsTemplate: true,
  };
}

/* ---------------- Primitives ---------------- */

export function CMSField({
  value,
  format,
  fallback = "",
  className = "",
  style = {},
  as: Tag = "span",
  ...props
}) {
  const { data } = useCMSContext();
  const loopItem = useCMSLoopItem();

  const resolved = useMemo(() => {
    let raw = value;
    if (raw && typeof raw === "object" && raw.type === "binding") {
      const p = Array.isArray(raw.path) ? raw.path.join(".") : raw.path;
      raw = getPath({ ...data, ...loopItem }, p);
    } else if (typeof raw === "string" && isDynamic(raw)) {
      raw = resolveTemplate(raw, { ...data, ...loopItem });
    }
    if (raw === undefined || raw === null || raw === "") {
      return fallback;
    }
    if (format) {
      return formatTransform(raw, format);
    }
    return String(raw);
  }, [value, format, fallback, data, loopItem]);

  if (typeof resolved === "string" && /<[a-z][\s\S]*>/i.test(resolved)) {
    return (
      <Tag
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: resolved }}
        {...props}
      />
    );
  }

  return (
    <Tag className={className} style={style} {...props}>
      {resolved}
    </Tag>
  );
}

export const CMSText = CMSField;

export function CMSRichText({
  value,
  source,
  content,
  children,
  fallback = "",
  className = "",
  style = {},
  ...props
}) {
  const { data } = useCMSContext();
  const loopItem = useCMSLoopItem();

  const html = useMemo(() => {
    let raw =
      value !== undefined
        ? value
        : source !== undefined
        ? source
        : content !== undefined
        ? content
        : children;

    if (raw && typeof raw === "object" && raw.type === "binding") {
      const p = Array.isArray(raw.path) ? raw.path.join(".") : raw.path;
      raw = getPath({ ...data, ...loopItem }, p);
    } else if (typeof raw === "string" && isDynamic(raw)) {
      raw = resolveTemplate(raw, { ...data, ...loopItem });
    }
    if (!raw) return fallback;
    return String(raw);
  }, [value, source, content, children, fallback, data, loopItem]);

  return (
    <div
      className={`cms-richtext ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}

export function CMSImage({
  source,
  src,
  alt = "",
  fallback = "/ababeel-logo.svg",
  className = "",
  style = {},
  width,
  height,
  ...props
}) {
  const { data } = useCMSContext();
  const loopItem = useCMSLoopItem();

  const finalSrc = useMemo(() => {
    let target = source || src;
    if (target && typeof target === "object" && target.type === "binding") {
      const p = Array.isArray(target.path) ? target.path.join(".") : target.path;
      target = getPath({ ...data, ...loopItem }, p);
    } else if (typeof target === "string" && isDynamic(target)) {
      target = resolveTemplate(target, { ...data, ...loopItem });
    }
    if (target && typeof target === "object") {
      target = target.url || target.src || target.secure_url || "";
    }
    return target ? cms.sanitizeUrl(String(target)) : fallback;
  }, [source, src, fallback, data, loopItem]);

  return (
    <img
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={(e) => {
        if (fallback && e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
        }
      }}
      {...props}
    />
  );
}

export function CMSLink({
  href,
  to,
  children,
  className = "",
  style = {},
  target,
  rel,
  fallback = "#",
  ...props
}) {
  const { data } = useCMSContext();
  const loopItem = useCMSLoopItem();

  const finalHref = useMemo(() => {
    let raw = href || to;
    if (raw && typeof raw === "object" && raw.type === "binding") {
      const p = Array.isArray(raw.path) ? raw.path.join(".") : raw.path;
      raw = getPath({ ...data, ...loopItem }, p);
    } else if (typeof raw === "string" && isDynamic(raw)) {
      raw = resolveTemplate(raw, { ...data, ...loopItem });
    }
    return raw ? cms.sanitizeUrl(String(raw)) : fallback;
  }, [href, to, fallback, data, loopItem]);

  const safeRel = target === "_blank" ? (rel || "noopener noreferrer") : rel;

  return (
    <a
      href={finalHref}
      className={className}
      style={style}
      target={target}
      rel={safeRel}
      {...props}
    >
      {children}
    </a>
  );
}

export function CMSLoop({
  source,
  as = "item",
  children,
  empty = null,
  limit,
  offset = 0,
}) {
  const { data } = useCMSContext();
  const parentLoop = useCMSLoopItem();

  const items = useMemo(() => {
    let arr = source;
    if (typeof source === "string") {
      arr = getPath({ ...data, ...parentLoop }, source);
    } else if (source && typeof source === "object" && source.type === "binding") {
      const p = Array.isArray(source.path) ? source.path.join(".") : source.path;
      arr = getPath({ ...data, ...parentLoop }, p);
    }
    if (arr && typeof arr === "object" && !Array.isArray(arr) && Array.isArray(arr.items)) {
      arr = arr.items;
    }
    if (!Array.isArray(arr)) return [];

    let slice = arr;
    const off = Number(offset) || 0;
    if (off > 0) slice = slice.slice(off);
    const lim = Number(limit);
    if (Number.isFinite(lim) && lim > 0) slice = slice.slice(0, lim);
    return slice;
  }, [source, data, parentLoop, limit, offset]);

  if (!items.length) {
    return empty ? (typeof empty === "function" ? empty() : empty) : null;
  }

  return (
    <>
      {items.map((item, idx) => {
        const loopMeta = {
          index: idx,
          number: idx + 1,
          first: idx === 0,
          last: idx === items.length - 1,
          odd: idx % 2 !== 0,
          even: idx % 2 === 0,
          count: items.length,
        };

        const itemScope = {
          ...data,
          ...parentLoop,
          ...(item && typeof item === "object" ? item : {}),
          [as]: item,
          loop: loopMeta,
        };

        const callArg = Object.assign(
          item && typeof item === "object" ? { ...item } : {},
          { [as]: item, item, loop: loopMeta }
        );

        return (
          <CMSLoopContext.Provider key={item?._id || item?.id || idx} value={itemScope}>
            {typeof children === "function" ? children(callArg, loopMeta, idx) : children}
          </CMSLoopContext.Provider>
        );
      })}
    </>
  );
}

export const CMSRepeater = CMSLoop;

export function CMSIf({ condition, children, fallback = null }) {
  const { data } = useCMSContext();
  const loopItem = useCMSLoopItem();

  const passed = useMemo(() => {
    if (typeof condition === "boolean") return condition;
    if (condition && typeof condition === "object" && (condition.rules || condition.conditions)) {
      return evaluateConditions(condition, { ...data, ...loopItem });
    }
    if (typeof condition === "string") {
      if (isDynamic(condition)) {
        return Boolean(resolveTemplate(condition, { ...data, ...loopItem }));
      }
      const val = getPath({ ...data, ...loopItem }, condition);
      return Boolean(val);
    }
    return Boolean(condition);
  }, [condition, data, loopItem]);

  if (passed) {
    return typeof children === "function" ? children() : children;
  }
  return fallback ? (typeof fallback === "function" ? fallback() : fallback) : null;
}

export const CMSCondition = CMSIf;
