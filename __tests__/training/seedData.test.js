import fs from "fs";
import path from "path";
import {
  REGISTRATION_FIELDS,
  LEVELS,
  NAV_LINKS,
  FOOTER_COLUMNS,
  homePageBlocks,
  trainingPageDocs,
  whyAbabeelDoc,
  registrationFieldDoc,
  levelDoc,
} from "@/scripts/lib/seed-data.mjs";
import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/training/defaultFields";
import { DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";
import { BLOCK_TYPES } from "@/Components/cms/blockSchemas";

/**
 * The seed data must match what the application itself ships.
 *
 * The scripts run in plain node, outside Next's `@/` resolution, so the data
 * is duplicated as plain objects rather than imported. Duplication drifts:
 * a field added to the app's defaults and not the seed produces a site that is
 * set up differently depending on whether anyone ran the script. These tests
 * are what stop that.
 */

describe("registration fields match the application defaults", () => {
  test("same fields, same order", () => {
    expect(REGISTRATION_FIELDS.map((f) => f.key)).toEqual(
      DEFAULT_REGISTRATION_FIELDS.map((f) => f.key),
    );
  });

  test("same labels, types, requiredness and binding", () => {
    for (const [i, seed] of REGISTRATION_FIELDS.entries()) {
      const app = DEFAULT_REGISTRATION_FIELDS[i];
      expect(seed.label).toBe(app.label);
      expect(seed.type).toBe(app.type);
      expect(!!seed.required).toBe(!!app.required);
      expect(seed.bindTo || "").toBe(app.bindTo || "");
      expect(!!seed.system).toBe(!!app.system);
    }
  });

  test("a field document carries every column the model needs", () => {
    const doc = registrationFieldDoc(REGISTRATION_FIELDS[0], 0);
    for (const key of ["key", "label", "type", "required", "enabled", "width", "displayOrder"]) {
      expect(doc[key]).toBeDefined();
    }
    expect(doc.enabled).toBe(true);
  });

  test("no seeded field collects payment details", () => {
    const keys = REGISTRATION_FIELDS.map((f) => f.key.toLowerCase()).join(" ");
    expect(keys).not.toMatch(/card|cvv|iban|account|payment|stripe|jazzcash|easypaisa/);
  });
});

describe("levels", () => {
  test("four levels, published, in order", () => {
    expect(LEVELS.map((l) => l.slug)).toEqual([
      "beginner",
      "intermediate",
      "advanced",
      "professional",
    ]);
    const doc = levelDoc(LEVELS[0], 0);
    expect(doc.status).toBe("published");
    expect(doc.displayOrder).toBe(0);
  });
});

describe("navigation matches the application defaults", () => {
  test("the same links, in the same order", () => {
    expect(NAV_LINKS.map((l) => l.name)).toEqual(
      DEFAULT_GLOBAL_SETTINGS.topbar.navLinks.map((l) => l.name),
    );
    expect(NAV_LINKS.map((l) => l.url)).toEqual(
      DEFAULT_GLOBAL_SETTINGS.topbar.navLinks.map((l) => l.url),
    );
  });

  test("the About dropdown matches", () => {
    const seedAbout = NAV_LINKS.find((l) => l.name === "About");
    const appAbout = DEFAULT_GLOBAL_SETTINGS.topbar.navLinks.find((l) => l.name === "About");
    expect(seedAbout.dropdown.map((d) => d.url)).toEqual(appAbout.dropdown.map((d) => d.url));
  });

  test("the footer columns match", () => {
    expect(FOOTER_COLUMNS.map((c) => c.title)).toEqual(
      DEFAULT_GLOBAL_SETTINGS.footer.columns.map((c) => c.title),
    );
    for (const [i, column] of FOOTER_COLUMNS.entries()) {
      expect(column.links.map((l) => l.href)).toEqual(
        DEFAULT_GLOBAL_SETTINGS.footer.columns[i].links.map((l) => l.href),
      );
    }
  });
});

describe("home page blocks", () => {
  const blocks = homePageBlocks();

  test("every block is a real block type", () => {
    for (const block of blocks) {
      expect(BLOCK_TYPES[block.type]).toBeDefined();
    }
  });

  test("every prop is one its block actually has", () => {
    // The failure this catches renders a heading with nothing under it: valid
    // JavaScript, a real block type, silently broken.
    const problems = [];
    for (const block of blocks) {
      const known = new Set(Object.keys(BLOCK_TYPES[block.type].defaults || {}));
      for (const key of Object.keys(block.props)) {
        if (!known.has(key)) problems.push(`${block.type}.${key}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("every style key is one the Design tab knows", () => {
    const known = new Set(Object.keys(blocks[0]._style));
    for (const block of blocks) {
      for (const key of Object.keys(block._style)) {
        expect(known.has(key)).toBe(true);
      }
    }
  });

  test("it assembles the sections the brief lists", () => {
    const types = blocks.map((b) => b.type);
    for (const required of [
      "hero",
      "accreditationLogos",
      "split",
      "courseGrid",
      "cardGrid",
      "awardingBodyLogos",
      "scheduleList",
      "consultantList",
      "reviewWall",
      "cta",
    ]) {
      expect(types).toContain(required);
    }
  });

  test("block ids are unique", () => {
    const ids = blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the training page seeds", () => {
  const pages = trainingPageDocs();

  test("every seeded page is a managed CMS page with a matching route", () => {
    // A seed for a key the CMS does not manage would write a document nothing
    // ever lists or serves.
    const { MANAGED_PAGES } = require("@/lib/cmsDefaults");
    const byKey = new Map(MANAGED_PAGES.map((m) => [m.key, m]));
    for (const page of pages) {
      const managed = byKey.get(page.key);
      expect(managed).toBeDefined();
      expect(managed.route).toBe(page.route);
    }
  });

  test("every page ships real sections, not an empty shell", () => {
    for (const page of pages) {
      expect(page.blocks.length).toBeGreaterThanOrEqual(1);
    }
    // The content pages carry their live section, not just a hero.
    const byKey = new Map(pages.map((p) => [p.key, p]));
    expect(byKey.get("our-team").blocks.map((b) => b.type)).toContain("teamGrid");
    expect(byKey.get("our-consultants").blocks.map((b) => b.type)).toContain("consultantList");
    expect(byKey.get("accreditations").blocks.map((b) => b.type)).toContain("accreditationLogos");
    expect(byKey.get("awarding-bodies").blocks.map((b) => b.type)).toContain("awardingBodyLogos");
  });

  test("every seeded block is valid against the block schemas", () => {
    const problems = [];
    const all = [...pages.flatMap((p) => p.blocks), ...whyAbabeelDoc().blocks];
    for (const block of all) {
      const def = BLOCK_TYPES[block.type];
      if (!def) {
        problems.push(`unknown block ${block.type}`);
        continue;
      }
      const known = new Set(Object.keys(def.defaults || {}));
      for (const key of Object.keys(block.props)) {
        if (!known.has(key)) problems.push(`${block.type}.${key}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("the Why Ababeel page matches the nav link that points at it", () => {
    const why = whyAbabeelDoc();
    expect(why.route).toBe("/why-ababeel");
    const about = NAV_LINKS.find((l) => l.name === "About");
    expect(about.dropdown.map((d) => d.url)).toContain("/why-ababeel");
  });

  test("no seed carries the old brand", () => {
    const text = JSON.stringify([pages, whyAbabeelDoc(), homePageBlocks(), NAV_LINKS, FOOTER_COLUMNS]);
    expect(text).not.toMatch(/ABA Safety/);
  });
});

describe("the migration script is safe by construction", () => {
  const SCRIPT = fs.readFileSync(
    path.join(process.cwd(), "scripts", "ababeel-migrate.mjs"),
    "utf8",
  );

  test("it never deletes or drops", () => {
    expect(SCRIPT).not.toMatch(/deleteMany|deleteOne|\.drop\(|remove\(/);
  });

  test("it backs up before replacing", () => {
    expect(SCRIPT).toMatch(/backup\(db, "global-settings"/);
    expect(SCRIPT).toMatch(/backup\(db, "home-page"/);
  });

  test("pages and home publish live by default, with --draft to hold them back", () => {
    expect(SCRIPT).toMatch(/draft = args\.has\("--draft"\)/);
    expect(SCRIPT).toMatch(/publishHome = !draft/);
    expect(SCRIPT).toMatch(/enabled: !!publishHome/);
    expect(SCRIPT).toMatch(/enabled: publishHome/);
  });

  test("it creates no business content", () => {
    // Courses, awarding bodies, consultants and testimonials are claims about
    // a real company. Structure only.
    //
    // Checks the collections it actually opens, not the prose — the doc
    // comment names these precisely to say it will not touch them, and an
    // assertion that cannot tell a comment from a call is not an assertion.
    // Deduped: sitecontents is legitimately opened twice, for the navigation
    // and for the home page.
    const opened = [
      ...new Set([...SCRIPT.matchAll(/\.collection\(\s*["']([^"']+)["']/g)].map((m) => m[1])),
    ];
    expect(opened.sort()).toEqual(["cmsbackups", "sitecontents"]);

    // The two additive seeds pass their collection in as an argument.
    const seeded = [...SCRIPT.matchAll(/seedMissing\(\s*db,\s*\n?\s*"([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(seeded.sort()).toEqual(["courselevels", "registrationfields"]);
  });

  test("it never overwrites a page a person has edited", () => {
    // The owner editor stamps updatedByEmail; the script only writes over
    // empty or seed-authored documents. One human edit makes a page theirs.
    expect(SCRIPT).toMatch(/function untouched/);
    expect(SCRIPT).toMatch(/SEED_AUTHORS/);
    expect(SCRIPT).toMatch(/if \(!untouched\(existing\)\)/);
  });

  test("page writes are keyed upserts, so running twice cannot duplicate", () => {
    expect(SCRIPT).toMatch(/updateOne\(\s*\{ key: page\.key \}/);
    expect(SCRIPT).toMatch(/upsert: true/);
    expect(SCRIPT).not.toMatch(/insertOne\(\s*\{\s*key:/);
  });

  test("--dry-run writes nothing", () => {
    // Every write path returns early on dryRun.
    expect(SCRIPT).toMatch(/if \(!missing\.length \|\| dryRun\) return 0;/);
    expect(SCRIPT.match(/if \(dryRun\) return;/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
