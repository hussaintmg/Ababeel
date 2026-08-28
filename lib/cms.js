// Server-only CMS helpers. Imports the mongoose model, so never import this
// from a client component — use the API routes instead.
import { cache } from "react";
import connectDB from "@/utils/db";
import SiteContent from "@/models/SiteContent";
import {
  MANAGED_PAGES,
  DEFAULT_GLOBAL_SETTINGS,
  getDefaultDoc,
} from "@/lib/cmsDefaults";

// Deep-merge helper so partially-saved global settings still fall back to
// sensible defaults for any missing keys.
function deepMerge(base, override) {
  if (Array.isArray(override)) return override;
  if (override == null) return base;
  if (typeof base !== "object" || typeof override !== "object") return override;
  const out = { ...base };
  for (const k of Object.keys(override)) {
    out[k] = deepMerge(base?.[k], override[k]);
  }
  return out;
}

function serialize(doc) {
  if (!doc) return null;
  return {
    key: doc.key,
    title: doc.title || "",
    blocks: Array.isArray(doc.blocks) ? doc.blocks : [],
    settings: doc.settings || {},
    customCss: doc.customCss || "",
    enabled: !!doc.enabled,
    isCustom: !!doc.isCustom,
    route: doc.route || (doc.isCustom ? `/${doc.key}` : ""),
    navLabel: doc.navLabel || "",
    showInNav: !!doc.showInNav,
    // Dynamic CMS config — absent on documents saved before this feature.
    dataSources: Array.isArray(doc.dataSources) ? doc.dataSources : [],
    dynamicRoute: doc.dynamicRoute || null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

// Fetch a CMS doc. For a built-in managed page a default doc is seeded on first
// access. For any other key we return an existing custom page if one exists,
// otherwise null (custom pages are never auto-seeded).
// Wrapped in React's per-request cache so a single render (layout +
// generateMetadata + the favicon route) hits the DB once instead of three times.
export const getCmsDoc = cache(async function getCmsDoc(key) {
  const page = MANAGED_PAGES.find((p) => p.key === key);
  await connectDB();

  if (!page) {
    const custom = await SiteContent.findOne({ key, isCustom: true }).lean();
    return custom ? serialize(custom) : null;
  }

  let doc = await SiteContent.findOne({ key }).lean();
  if (!doc) {
    const def = getDefaultDoc(key);
    try {
      doc = (await SiteContent.create(def)).toObject();
    } catch {
      // Race on first concurrent access — read the winner.
      doc = await SiteContent.findOne({ key }).lean();
      if (!doc) doc = def;
    }
  }
  return serialize(doc);
});

// Nav links for published custom pages that opted into the menu.
export async function getCustomPagesNav() {
  await connectDB();
  const docs = await SiteContent.find({ isCustom: true, enabled: true, showInNav: true, publicHidden: { $ne: true } })
    .select("key title navLabel route")
    .lean();
  return docs.map((d) => ({ name: d.navLabel || d.title || d.key, url: d.route || `/${d.key}` }));
}

/**
 * Append custom-page nav links, and drop links to pages that are off the site.
 *
 * Public only — never used for the owner editor, so manual links stay
 * unpolluted. A link left pointing at a hidden page would send visitors to a
 * 404 from the site's own menu, so those are removed here rather than being
 * left for the owner to remember. Dedupes by url.
 */
function withCustomNav(settings, extra, hidden = []) {
  const base = Array.isArray(settings?.topbar?.navLinks) ? settings.topbar.navLinks : [];
  const seen = new Set(base.map((l) => l.url));
  const merged = [...base, ...(extra || []).filter((l) => !seen.has(l.url))];
  const isHidden = (url) => {
    const path = String(url || "").split("?")[0].replace(/\/+$/, "").toLowerCase();
    return hidden.some((r) => {
      const route = String(r).replace(/\/+$/, "").toLowerCase();
      return route && (path === route || path.startsWith(`${route}/`));
    });
  };
  const visible = merged.filter((l) => !isHidden(l.url));
  if (!extra?.length && visible.length === base.length) return settings;
  return { ...settings, topbar: { ...(settings.topbar || {}), navLinks: visible } };
}

// Resolved global settings, always merged over defaults.
export async function getGlobalSettings() {
  const doc = await getCmsDoc("global");
  return deepMerge(DEFAULT_GLOBAL_SETTINGS, doc?.settings || {});
}

// Settings + global custom CSS in one shot (used by the root layout for SSR).
// Public-facing, so published custom pages are merged into the topbar nav.
/**
 * Everything the root layout needs: global settings, site-wide CSS and the
 * favicon stamp.
 *
 * The root layout wraps every page, so an unhandled failure here is not a
 * degraded page — it is a 500 for the entire site, including pages that need
 * nothing from the database. A database that is restarting, or briefly
 * unreachable, is an ordinary event on a single-server deployment, and it must
 * cost the visitor the owner's customisations for a few seconds, not the site.
 * So each read falls back on its own and the built-in defaults stand in.
 */
export async function getGlobalBundle() {
  const [doc, customNav, hidden] = await Promise.all([
    getCmsDoc("global").catch(() => null),
    getCustomPagesNav().catch(() => []),
    getHiddenRoutes().catch(() => []),
  ]);
  const settings = deepMerge(DEFAULT_GLOBAL_SETTINGS, doc?.settings || {});
  return {
    settings: withCustomNav(settings, customNav, hidden),
    customCss: doc?.customCss || "",
    faviconVersion: faviconVersion(settings?.logos?.favicon, doc?.updatedAt),
  };
}

// Short, stable stamp for the current favicon. The browser tab icon is always
// served from the same /favicon.ico URL, and browsers cache that URL very
// aggressively — this stamp is the only thing that makes them refetch after the
// owner uploads a new icon, so it must change whenever the icon does.
function faviconVersion(src, updatedAt) {
  const seed = `${src || ""}|${updatedAt || ""}`;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

// The favicon the owner configured, resolved for the /favicon.ico route.
// An empty `src` means "no custom icon" — serve the bundled default. The
// stored default is literally "/favicon.ico", which would make the route
// request itself, so it is normalised away here.
export async function getFaviconInfo() {
  const doc = await getCmsDoc("global");
  const settings = deepMerge(DEFAULT_GLOBAL_SETTINGS, doc?.settings || {});
  const raw = (settings?.logos?.favicon || "").trim();
  const src = raw && raw !== "/favicon.ico" ? raw : "";
  return { src, version: faviconVersion(raw, doc?.updatedAt) };
}

export async function listCmsDocs() {
  await connectDB();
  const docs = await SiteContent.find({}).select("key title enabled publicHidden updatedAt isCustom route showInNav").lean();
  const byKey = Object.fromEntries(docs.map((d) => [d.key, d]));
  // Canonical MANAGED_PAGES first, filling gaps for unseeded keys.
  const managed = MANAGED_PAGES.map((p) => {
    const d = byKey[p.key];
    return {
      ...p,
      enabled: d ? !!d.enabled : p.kind === "global" || p.kind === "auth",
      publicHidden: !!d?.publicHidden,
      seeded: !!d,
      updatedAt: d?.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    };
  });
  // Then any owner-created custom pages.
  const custom = docs
    .filter((d) => d.isCustom)
    .map((d) => ({
      key: d.key,
      title: d.title || d.key,
      route: d.route || `/${d.key}`,
      group: "Custom Pages",
      kind: "page",
      icon: "file",
      isCustom: true,
      enabled: !!d.enabled,
      publicHidden: !!d.publicHidden,
      showInNav: !!d.showInNav,
      seeded: true,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    }));
  return [...managed, ...custom];
}

/**
 * Routes the owner has taken off the public site.
 *
 * Read by the middleware, which answers 404 for them. Kept as a plain array of
 * paths so the middleware needs no model and no database connection.
 */
export async function getHiddenRoutes() {
  await connectDB();
  const docs = await SiteContent.find({ publicHidden: true }).select("key route").lean();
  const byKey = Object.fromEntries(MANAGED_PAGES.map((p) => [p.key, p.route]));
  return docs
    .map((d) => d.route || byKey[d.key] || `/${d.key}`)
    // The home page is the site; hiding it would take everything down, so it
    // is never hideable and never appears here.
    .filter((route) => route && route !== "/");
}

export { deepMerge };
