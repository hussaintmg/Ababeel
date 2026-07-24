"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";

const SiteContentContext = createContext({
  settings: DEFAULT_GLOBAL_SETTINGS,
  loading: false,
  refresh: () => {},
});

export function SiteContentProvider({
  initialSettings,
  initialCss = "",
  initialFaviconVersion = "",
  children,
}) {
  const [settings, setSettings] = useState(initialSettings || DEFAULT_GLOBAL_SETTINGS);
  const [css, setCss] = useState(initialCss);
  const [faviconVersion, setFaviconVersion] = useState(initialFaviconVersion);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cms/global", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) {
        if (data.settings) setSettings(data.settings);
        setCss(data.customCss || "");
        setFaviconVersion(data.faviconVersion || "");
      }
    } catch {
      /* keep current settings on error */
    } finally {
      setLoading(false);
    }
  }, []);

  // Repoint every icon link at the versioned /favicon.ico URL so a newly saved
  // icon shows up without a reload. The version stamp is what forces the
  // browser to drop its cached copy — the URL itself never changes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = `/favicon.ico${faviconVersion ? `?v=${faviconVersion}` : ""}`;
    const links = document.querySelectorAll(
      "link[rel~='icon'], link[rel='apple-touch-icon']"
    );
    if (links.length === 0) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      document.head.appendChild(link);
      return;
    }
    links.forEach((link) => {
      link.setAttribute("href", href);
    });
  }, [faviconVersion]);

  return (
    <SiteContentContext.Provider value={{ settings, loading, refresh }}>
      {css ? <style id="cms-global-css" dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
