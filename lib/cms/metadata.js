/**
 * A page's browser title and description.
 *
 * Every page was showing "Home | Ababeel". The root layout tried to work out
 * the page from an `x-invoke-path` header, which the App Router does not send —
 * so the path was always "/", and every route got the home page's title. A
 * layout cannot know its own path either, so there is nothing to fix there: the
 * title has to come from the route itself.
 *
 * Each managed route now has a small server layout that calls this. The title
 * it produces, in order of preference:
 *
 *   1. what the owner typed in the CMS for that page
 *   2. the page's name in the CMS
 *   3. the fallback the route passes in
 *
 * then wrapped in the site's title template ("%s | Ababeel"), which is itself
 * editable under global settings.
 *
 * Server-only.
 */
import { getCmsDoc, getGlobalSettings, getFaviconInfo } from "@/lib/cms";
import { MANAGED_PAGES } from "@/lib/cmsDefaults";

/**
 * @param key       the CMS page key, e.g. "about-us"
 * @param fallback  the title to use when the CMS has nothing for this page
 */
export async function pageMetadata(key, fallback = "") {
  // Every branch below still has to return something usable, so the whole
  // lookup is guarded: a page must never fail to render because its title
  // could not be read.
  try {
    const [doc, settings, favicon] = await Promise.all([
      getCmsDoc(key).catch(() => null),
      getGlobalSettings().catch(() => null),
      getFaviconInfo().catch(() => ({ version: "1" })),
    ]);

    const managed = MANAGED_PAGES.find((p) => p.key === key);
    const seo = doc?.settings?.seo || {};
    const name =
      String(seo.title || "").trim() ||
      String(doc?.title || "").trim() ||
      fallback ||
      managed?.title ||
      "";

    const template = settings?.seo?.titleTemplate || "%s | Ababeel";
    const brand = settings?.brand?.shortName || "Ababeel";
    const title = !name
      ? brand
      : template.includes("%s")
      ? template.replace("%s", name)
      : `${name} | ${brand}`;

    const description =
      String(seo.description || "").trim() ||
      settings?.seo?.defaultDescription ||
      "Professional health, safety and environmental training and consultancy.";

    const icon = `/favicon.ico?v=${favicon?.version || "1"}`;
    return {
      title,
      description,
      icons: { icon, shortcut: icon, apple: icon },
      openGraph: { title, description, type: "website" },
    };
  } catch {
    return { title: fallback || "Ababeel", description: "" };
  }
}

/**
 * The same, for a page that renders one database record — a course, say.
 * The record's own name is the title, so two courses do not share one.
 */
export async function itemMetadata(key, itemTitle, fallback = "") {
  const base = await pageMetadata(key, fallback);
  const name = String(itemTitle || "").trim();
  if (!name) return base;

  const settings = await getGlobalSettings().catch(() => null);
  const template = settings?.seo?.titleTemplate || "%s | Ababeel";
  const title = template.includes("%s") ? template.replace("%s", name) : `${name} | Ababeel`;
  return { ...base, title, openGraph: { ...base.openGraph, title } };
}
