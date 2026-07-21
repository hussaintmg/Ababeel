"use client";

import { useEffect, useState } from "react";
import BlockRenderer from "@/Components/cms/BlockRenderer";
import PageSkeleton from "@/Components/cms/PageSkeleton";

/**
 * Wraps a public page. While the CMS content loads it shows an animated
 * skeleton (so the page never flashes blank or jumps when data arrives). Once
 * loaded: if the owner has published CMS blocks for this page they are shown,
 * otherwise the page's built-in `children` (the default content) is shown.
 * Per-page custom CSS is injected when present.
 */
export default function CmsPageContent({ pageKey, children }) {
  const [state, setState] = useState({ loaded: false, enabled: false, blocks: [], css: "" });

  useEffect(() => {
    let alive = true;
    fetch(`/api/cms/${pageKey}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (!data?.success) {
          setState((s) => ({ ...s, loaded: true }));
          return;
        }
        setState({
          loaded: true,
          enabled: !!data.enabled && Array.isArray(data.blocks) && data.blocks.length > 0,
          blocks: data.blocks || [],
          css: data.customCss || "",
        });
      })
      .catch(() => alive && setState((s) => ({ ...s, loaded: true })));
    return () => {
      alive = false;
    };
  }, [pageKey]);

  // Still loading → animated skeleton.
  if (!state.loaded) return <PageSkeleton />;

  const override = state.enabled;

  return (
    <div className="cms-fade-in">
      {state.css ? <style dangerouslySetInnerHTML={{ __html: state.css }} /> : null}
      {override ? <BlockRenderer blocks={state.blocks} /> : children}
    </div>
  );
}
