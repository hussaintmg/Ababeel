import fs from "fs";
import path from "path";
import { DEFAULT_GLOBAL_SETTINGS, RESERVED_SLUGS } from "@/lib/cmsDefaults";

/**
 * Every link the site ships with must point at a route that exists.
 *
 * A typo in a default nav href is invisible in review and ships a 404 into the
 * site's own menu. This walks `app/` for real route directories and checks each
 * built-in link against them.
 */
const APP = path.join(process.cwd(), "app");

/** Route paths that `app/` actually serves, as a set of "/a/b" strings. */
function collectRoutes(dir = APP, prefix = "") {
  const routes = new Set();
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return routes;
  }

  const hasPage = entries.some((e) => e.isFile() && /^page\.(jsx?|tsx?)$/.test(e.name));
  if (hasPage) routes.add(prefix || "/");

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Route groups and private folders are not path segments.
    if (entry.name.startsWith("_") || entry.name.startsWith("(")) continue;
    if (entry.name === "api") continue;
    for (const r of collectRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`)) {
      routes.add(r);
    }
  }
  return routes;
}

const ROUTES = collectRoutes();

/**
 * True when `href` is served — either by a literal route, or by a dynamic
 * segment such as /courses/[slug] or the CMS's catch-all /[slug].
 */
function isServed(href) {
  const clean = String(href || "").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (ROUTES.has(clean)) return true;

  const parts = clean.split("/").filter(Boolean);
  return [...ROUTES].some((route) => {
    const routeParts = route.split("/").filter(Boolean);
    if (routeParts.length !== parts.length) return false;
    return routeParts.every((seg, i) => seg.startsWith("[") || seg === parts[i]);
  });
}

function flatten(links) {
  const out = [];
  for (const link of links || []) {
    if (link.url) out.push(link.url);
    if (link.href) out.push(link.href);
    for (const child of link.dropdown || []) {
      if (child.url) out.push(child.url);
    }
  }
  return out;
}

describe("default navigation", () => {
  test("app/ exposes the training routes", () => {
    expect(ROUTES.has("/courses")).toBe(true);
    expect(ROUTES.has("/schedule")).toBe(true);
    expect(ROUTES.has("/registration")).toBe(true);
    expect(ROUTES.has("/awarding-bodies")).toBe(true);
    expect(ROUTES.has("/about/team")).toBe(true);
    expect(ROUTES.has("/about/consultants")).toBe(true);
    expect(ROUTES.has("/about/accreditations")).toBe(true);
  });

  test("every default topbar link points at a real route", () => {
    const broken = flatten(DEFAULT_GLOBAL_SETTINGS.topbar.navLinks).filter((h) => !isServed(h));
    expect(broken).toEqual([]);
  });

  test("the About link opens a dropdown", () => {
    const about = DEFAULT_GLOBAL_SETTINGS.topbar.navLinks.find((l) => l.name === "About");
    expect(about).toBeDefined();
    expect(about.dropdown.length).toBeGreaterThanOrEqual(4);
  });

  test("every default footer link points at a real route", () => {
    const footer = DEFAULT_GLOBAL_SETTINGS.footer;
    const links = [
      ...footer.columns.flatMap((c) => flatten(c.links)),
      ...flatten(footer.bottomLinks),
    ];
    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((h) => !isServed(h))).toEqual([]);
  });
});

describe("reserved slugs", () => {
  test("the training routes cannot be shadowed by a custom CMS page", () => {
    // A custom page at /courses would be permanently invisible behind the real
    // route, and its author would have no way to tell why.
    for (const slug of ["courses", "schedule", "registration", "awarding-bodies", "about"]) {
      expect(RESERVED_SLUGS.has(slug)).toBe(true);
    }
  });
});
