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
