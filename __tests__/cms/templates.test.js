/**
 * The template library is data, and a typo in it is a broken "Insert" button
 * that nothing else catches. These checks are cheap and cover the ways one
 * actually goes wrong.
 */
import { TEMPLATES, TEMPLATE_CATEGORIES, createBlocksFromTemplate } from "@/Components/cms/templates";
import { BLOCK_TYPES } from "@/Components/cms/blockSchemas";

describe("the template library", () => {
  test("every template has a unique id", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every template names a category that exists", () => {
    for (const t of TEMPLATES) {
      expect(TEMPLATE_CATEGORIES).toContain(t.category);
    }
  });

  test("every block in every template is a real block type", () => {
    for (const t of TEMPLATES) {
      expect(Array.isArray(t.blocks)).toBe(true);
      expect(t.blocks.length).toBeGreaterThan(0);
      for (const spec of t.blocks) {
        expect(BLOCK_TYPES[spec.type]).toBeDefined();
      }
    }
  });

  test("inserting a template produces editable blocks with fresh ids", () => {
    for (const t of TEMPLATES) {
      const blocks = createBlocksFromTemplate(t);
      expect(blocks).toHaveLength(t.blocks.length);
      const ids = blocks.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const b of blocks) {
        expect(b.id).toBeTruthy();
        expect(b._style).toBeDefined();
        // props must be a copy — two inserts of one template must not share state
        expect(b.props).not.toBe(t.blocks.find((s) => s.type === b.type)?.props);
      }
    }
  });

  test("a template's styling only uses keys the Design tab knows", () => {
    const known = new Set(Object.keys(createBlocksFromTemplate(TEMPLATES[0])[0]._style));
    for (const t of TEMPLATES) {
      for (const spec of t.blocks) {
        for (const key of Object.keys(spec.style || {})) {
          expect(known.has(key)).toBe(true);
        }
      }
    }
  });

  test("every category holds at least one template", () => {
    for (const c of TEMPLATE_CATEGORIES) {
      expect(TEMPLATES.some((t) => t.category === c)).toBe(true);
    }
  });
});

describe("per-item appearance", () => {
  test("every repeating item an author styles can be styled", () => {
    // The lists where one item usefully differs from its neighbours. A card, a
    // tile, a figure or a question with no colour of its own is the gap this
    // covers: previously only the whole block could be recoloured.
    const wants = [
      ["cardGrid", "items"],
      ["imageTiles", "items"],
      ["stats", "items"],
      ["faq", "items"],
      ["testimonials", "items"],
      ["carousel", "slides"],
      ["gallery", "images"],
      ["pricing", "tiers"],
      ["team", "members"],
      ["logos", "items"],
    ];
    for (const [type, key] of wants) {
      const field = BLOCK_TYPES[type].fields.find((f) => f.key === key);
      expect(field).toBeDefined();
      const keys = field.itemFields.map((f) => f.key);
      expect(keys).toEqual(expect.arrayContaining(["accent", "bgColor", "textColor"]));
    }
  });

  test("a new item starts with no colours, so it inherits the block's", () => {
    const field = BLOCK_TYPES.cardGrid.fields.find((f) => f.key === "items");
    for (const f of field.itemFields.filter((x) => ["accent", "bgColor", "textColor"].includes(x.key))) {
      expect(f.type).toBe("color");
      // No default: an empty value is what makes the block's setting apply.
      expect(f.default).toBeUndefined();
    }
  });

  test("a split's points and a card's rows can be styled individually", () => {
    const bullets = BLOCK_TYPES.split.fields.find((f) => f.key === "bullets");
    const keys = bullets.itemFields.map((f) => f.key);
    // A point takes an icon in place of the tick, and colours for both.
    expect(keys).toEqual(expect.arrayContaining(["text", "icon", "accent", "textColor"]));

    const meta = BLOCK_TYPES.card.fields.find((f) => f.key === "meta");
    const metaKeys = meta.itemFields.map((f) => f.key);
    expect(metaKeys).toEqual(expect.arrayContaining(["label", "value", "accent", "textColor", "bgColor"]));
  });

  test("the before/after slider exposes each of its parts", () => {
    const keys = BLOCK_TYPES.beforeAfter.fields.map((f) => f.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "beforeChipBg", "beforeChipText", "afterChipBg", "afterChipText",
        "handleColor", "dividerColor", "dividerWidth", "radius", "showHint",
      ])
    );
  });
});
