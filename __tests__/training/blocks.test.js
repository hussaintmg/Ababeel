import { BLOCK_TYPES, LIVE_BLOCK_TYPES } from "@/Components/cms/blockSchemas";
import { TRAINING_TEMPLATES } from "@/Components/cms/trainingTemplates";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/Components/cms/templates";
import { TRAINING_BLOCK_TYPES as DATA_BLOCK_TYPES } from "@/lib/cms/trainingBlocks";
import { TRAINING_RENDERERS } from "@/Components/cms/TrainingBlocks";

/**
 * Guards for the catalogue blocks and the templates built on them.
 *
 * The prop-name check exists because a template that sets `description` on a
 * block whose prop is `text` renders a heading with nothing under it — valid
 * JavaScript, a real block type, and silently broken. That is what happened
 * while these templates were being written, and only the styling test caught
 * it, by accident.
 */

describe("catalogue blocks are wired end to end", () => {
  const schemaKeys = [...LIVE_BLOCK_TYPES].sort();

  test("every live block has a schema, a renderer and a data loader", () => {
    expect(schemaKeys.length).toBeGreaterThanOrEqual(7);
    expect(Object.keys(TRAINING_RENDERERS).sort()).toEqual(schemaKeys);
    // A block the loader does not know about would render permanently empty.
    expect([...DATA_BLOCK_TYPES].sort()).toEqual(schemaKeys);
  });

  test("each one declares an empty-state message", () => {
    for (const type of schemaKeys) {
      const def = BLOCK_TYPES[type];
      // Logo strips fall back to a built-in line; the rest let the owner say
      // what would fill the section.
      if (type === "awardingBodyLogos" || type === "accreditationLogos") continue;
      expect(typeof def.defaults.emptyMessage).toBe("string");
      expect(def.defaults.emptyMessage.length).toBeGreaterThan(0);
    }
  });

  test("none of them ships an author-typed items list", () => {
    // Their content comes from the database. An `items` default would imply
    // otherwise and would be silently overwritten by `_items`.
    for (const type of schemaKeys) {
      expect(BLOCK_TYPES[type].defaults.items).toBeUndefined();
    }
  });
});

describe("template props match their block's schema", () => {
  // Props the resolver adds, which no template should set by hand.
  const RESERVED = new Set(["_items"]);

  const check = (templates) => {
    const problems = [];
    for (const template of templates) {
      for (const spec of template.blocks || []) {
        const def = BLOCK_TYPES[spec.type];
        if (!def) {
          problems.push(`${template.id}: unknown block "${spec.type}"`);
          continue;
        }
        const known = new Set(Object.keys(def.defaults || {}));
        for (const key of Object.keys(spec.props || {})) {
          if (RESERVED.has(key)) {
            problems.push(`${template.id}: sets reserved prop "${key}"`);
          } else if (!known.has(key)) {
            problems.push(`${template.id}: "${spec.type}" has no prop "${key}"`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  };

  test("the ABA templates set only props their blocks have", () => {
    check(TRAINING_TEMPLATES);
  });

  test("every template in the library does", () => {
    check(TEMPLATES);
  });
});

describe("the ABA templates are inside the existing library", () => {
  const byId = (id) => TEMPLATES.find((t) => t.id === id);

  test("they are in the same registry the existing patterns use", () => {
    // Not "a registry of their own that the picker also reads" — the same
    // array, so there is one library and one picker.
    for (const t of TRAINING_TEMPLATES) {
      expect(byId(t.id)).toBe(t);
    }
  });

  test("an ABA hero sits in Heroes, beside the existing heroes", () => {
    const heroes = TEMPLATES.filter((t) => t.category === "Heroes");
    const aba = heroes.filter((t) => t.id.startsWith("aba-"));
    const existing = heroes.filter((t) => !t.id.startsWith("aba-"));
    expect(aba.length).toBeGreaterThanOrEqual(6);
    // The existing heroes must still be there. Appending, not replacing.
    expect(existing.length).toBeGreaterThanOrEqual(6);
  });

  test("no category exists only to hold ABA templates", () => {
    // A brand-named category is what makes a shared registry read as two
    // separate libraries, which is the thing this integration undid.
    const brandNamed = TEMPLATE_CATEGORIES.filter((c) => /\bABA\b/i.test(c));
    expect(brandNamed).toEqual([]);

    // The two categories the ABA work did add name a section kind the library
    // genuinely lacked, and both are open to any future template.
    for (const category of ["Courses", "Schedule"]) {
      expect(TEMPLATE_CATEGORIES).toContain(category);
    }
  });

  test("every ABA template names a category the picker lists", () => {
    for (const t of TRAINING_TEMPLATES) {
      expect(TEMPLATE_CATEGORIES).toContain(t.category);
    }
  });

  test("they are identifiable by name inside a shared category", () => {
    // Sharing a category only works if a user can tell which is which.
    for (const t of TRAINING_TEMPLATES) {
      expect(t.name).toMatch(/^ABA Safety/);
    }
  });

  test("the sections the brief asks for are all present", () => {
    const abaIn = (category) =>
      TEMPLATES.filter((t) => t.category === category && t.id.startsWith("aba-"));
    expect(abaIn("Heroes").length).toBeGreaterThanOrEqual(6);
    expect(abaIn("Call To Action").length).toBeGreaterThanOrEqual(6);
    expect(abaIn("Testimonials").length).toBeGreaterThanOrEqual(5);
    expect(abaIn("Courses").length).toBeGreaterThanOrEqual(5);
    expect(abaIn("Team").length).toBeGreaterThanOrEqual(5);
    expect(abaIn("Schedule").length).toBeGreaterThanOrEqual(3);
    expect(abaIn("Logos").length).toBeGreaterThanOrEqual(3);
  });

  test("the review templates cover five distinct layouts", () => {
    const layouts = TRAINING_TEMPLATES.filter((t) =>
      t.blocks.some((b) => b.type === "reviewWall"),
    ).flatMap((t) => t.blocks.filter((b) => b.type === "reviewWall").map((b) => b.props.layout));
    expect(new Set(layouts).size).toBeGreaterThanOrEqual(5);
  });

  test("the full home page assembles the sections the brief lists", () => {
    const home = byId("aba-page-home");
    expect(home).toBeDefined();
    const types = home.blocks.map((b) => b.type);
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

  test("no template promises a payment step", () => {
    const text = JSON.stringify(TRAINING_TEMPLATES).toLowerCase();
    expect(text).not.toMatch(/checkout|pay now|add to cart|buy now|card details/);
  });
});
