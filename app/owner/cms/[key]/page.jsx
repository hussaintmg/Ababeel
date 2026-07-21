"use client";

import { use } from "react";
import { MANAGED_PAGES } from "@/lib/cmsDefaults";
import PageBuilder from "@/Components/owner/cms/PageBuilder";
import GlobalSettingsEditor from "@/Components/owner/cms/GlobalSettingsEditor";

function humanize(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CmsEditorPage({ params }) {
  const { key } = use(params);
  const managed = MANAGED_PAGES.find((p) => p.key === key);

  if (managed?.kind === "global") {
    return <GlobalSettingsEditor meta={managed} />;
  }
  if (managed) {
    return <PageBuilder pageKey={key} meta={managed} />;
  }

  // Not a built-in page — treat as a custom page. PageBuilder loads the real doc
  // (and its saved title) from the API; it errors gracefully if the key is bogus.
  const customMeta = {
    key,
    title: humanize(key),
    route: `/${key}`,
    kind: "page",
    isCustom: true,
  };
  return <PageBuilder pageKey={key} meta={customMeta} />;
}
