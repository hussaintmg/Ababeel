// Server-only CMS helpers. Imports the mongoose model, so never import this
// from a client component — use the API routes instead.
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
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

// Fetch a CMS doc. For a built-in managed page a default doc is seeded on first
// access. For any other key we return an existing custom page if one exists,
// otherwise null (custom pages are never auto-seeded).
export async function getCmsDoc(key) {
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
}

// Nav links for published custom pages that opted into the menu.
export async function getCustomPagesNav() {
  await connectDB();
  const docs = await SiteContent.find({ isCustom: true, enabled: true, showInNav: true })
    .select("key title navLabel route")
    .lean();
  return docs.map((d) => ({ name: d.navLabel || d.title || d.key, url: d.route || `/${d.key}` }));
}

// Append custom-page nav links to a settings object's topbar nav (public only —
// never used for the owner editor, so manual links stay unpolluted). Dedupes by url.
function withCustomNav(settings, extra) {
  if (!extra?.length) return settings;
  const base = Array.isArray(settings?.topbar?.navLinks) ? settings.topbar.navLinks : [];
  const seen = new Set(base.map((l) => l.url));
  const merged = [...base, ...extra.filter((l) => !seen.has(l.url))];
  return { ...settings, topbar: { ...(settings.topbar || {}), navLinks: merged } };
}

// Resolved global settings, always merged over defaults.
export async function getGlobalSettings() {
  const doc = await getCmsDoc("global");
  return deepMerge(DEFAULT_GLOBAL_SETTINGS, doc?.settings || {});
}

// Settings + global custom CSS in one shot (used by the root layout for SSR).
// Public-facing, so published custom pages are merged into the topbar nav.
export async function getGlobalBundle() {
  const doc = await getCmsDoc("global");
  const settings = deepMerge(DEFAULT_GLOBAL_SETTINGS, doc?.settings || {});
  const customNav = await getCustomPagesNav();
  return {
    settings: withCustomNav(settings, customNav),
    customCss: doc?.customCss || "",
  };
}

export async function listCmsDocs() {
  await connectDB();
  const docs = await SiteContent.find({}).select("key title enabled updatedAt isCustom route showInNav").lean();
  const byKey = Object.fromEntries(docs.map((d) => [d.key, d]));
  // Canonical MANAGED_PAGES first, filling gaps for unseeded keys.
  const managed = MANAGED_PAGES.map((p) => {
    const d = byKey[p.key];
    return {
      ...p,
      enabled: d ? !!d.enabled : p.kind === "global" || p.kind === "auth",
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
      showInNav: !!d.showInNav,
      seeded: true,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    }));
  return [...managed, ...custom];
}

export { deepMerge };
