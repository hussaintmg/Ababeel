"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";

const SiteContentContext = createContext({
  settings: DEFAULT_GLOBAL_SETTINGS,
  loading: false,
  refresh: () => {},
});

export function SiteContentProvider({ initialSettings, initialCss = "", children }) {
  const [settings, setSettings] = useState(initialSettings || DEFAULT_GLOBAL_SETTINGS);
  const [css, setCss] = useState(initialCss);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cms/global", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) {
        if (data.settings) setSettings(data.settings);
        setCss(data.customCss || "");
      }
    } catch {
      /* keep current settings on error */
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the favicon in sync with CMS settings on the client so changes show up
  // without a hard rebuild.
  useEffect(() => {
    const href = settings?.logos?.favicon;
    if (!href || typeof document === "undefined") return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [settings?.logos?.favicon]);

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
