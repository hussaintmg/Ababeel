import fs from "fs";
import path from "path";
import {
  REGISTRATION_FIELDS,
  LEVELS,
  NAV_LINKS,
  FOOTER_COLUMNS,
  homePageBlocks,
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

describe("the bootstrap script is safe by construction", () => {
  const SCRIPT = fs.readFileSync(
    path.join(process.cwd(), "scripts", "seed-cms-bootstrap.mjs"),
    "utf8",
  );

  test("it never deletes or drops", () => {
    expect(SCRIPT).not.toMatch(/deleteMany|deleteOne|\.drop\(|remove\(/);
  });

  test("it backs up before replacing", () => {
    expect(SCRIPT).toMatch(/backup\(db, "global-settings"/);
    expect(SCRIPT).toMatch(/backup\(db, "home-page"/);
  });

  test("publishing the home page is opt-in", () => {
    expect(SCRIPT).toMatch(/publishHome = args\.has\("--publish-home"\)/);
    expect(SCRIPT).toMatch(/enabled: !!publishHome/);
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

  test("--dry-run writes nothing", () => {
    // Every write path returns early on dryRun.
    expect(SCRIPT).toMatch(/if \(!missing\.length \|\| dryRun\) return 0;/);
    expect(SCRIPT.match(/if \(dryRun\) return;/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
