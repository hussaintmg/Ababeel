import fs from "fs";
import path from "path";
import { RESOURCES, getResource } from "@/lib/training/resources";
import { SPECS, getSpec } from "@/Components/owner/training/fieldSpecs";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/training/constants";
import { resourceAction } from "@/Components/ui/ResourceCard";
import { getSchemaRegistry, clearSchemaRegistryCache } from "@/lib/cms/schemaRegistry";
import "@/models/index";

/**
 * The Resources feature.
 *
 * Most of what makes it correct is that it went through the machinery that
 * already existed — the owner CRUD registry, the field-spec editor, the media
 * library, the variable registry — rather than gaining a second admin system of
 * its own. So these mostly assert integration, not behaviour.
 */
beforeAll(() => {
  clearSchemaRegistryCache();
});

describe("resources use the existing systems", () => {
  test("owner CRUD comes from the shared registry", () => {
    const resource = getResource("resources");
    expect(resource).toBeTruthy();
    expect(resource.Model.modelName).toBe("Resource");
    // Same registry as courses and consultants — so list, create, edit,
    // delete, duplicate and reorder all exist without new route handlers.
    expect(Object.keys(RESOURCES)).toContain("resources");
  });

  test("the owner screen comes from the shared field spec", () => {
    const spec = getSpec("resources");
    expect(spec).toBeTruthy();
    expect(spec.reorderable).toBe(true);
    expect(spec.columns.length).toBeGreaterThan(2);
    expect(spec.sections.length).toBeGreaterThan(2);
  });

  test("every field the editor shows is one the API accepts", () => {
    // The spec is the interface and the registry is the security boundary; a
    // field in one and not the other is silently dropped on save.
    const allowed = new Set(RESOURCES.resources.fields);
    const shown = SPECS.resources.sections
      .flatMap((s) => s.fields)
      .map((f) => f.key)
      .filter((k) => !k.startsWith("seo."));
    for (const key of shown) {
      expect(allowed).toContain(key);
    }
  });

  test("it is discoverable as CMS variables", () => {
    expect(getSchemaRegistry().map((m) => m.name)).toContain("Resource");
  });

  test("no second admin route was created for it", () => {
    // It is served by the same [resource] route as every other entity.
    const ownerRoutes = fs.readdirSync(path.join(process.cwd(), "app", "owner"));
    expect(ownerRoutes).not.toContain("resources");
    expect(fs.existsSync(path.join(process.cwd(), "app", "owner", "training", "[resource]"))).toBe(
      true,
    );
  });
});

describe("resource types", () => {
  test("every type has a label", () => {
    for (const type of RESOURCE_TYPES) {
      expect(RESOURCE_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  test("the editor offers exactly the types the model allows", () => {
    const field = SPECS.resources.sections
      .flatMap((s) => s.fields)
      .find((f) => f.key === "type");
    expect(field.options.map((o) => o.value).sort()).toEqual([...RESOURCE_TYPES].sort());
  });
});

describe("a resource's action follows what it actually is", () => {
  test("an article with content links to its own page", () => {
    const action = resourceAction({ slug: "a-guide", content: "<p>Words</p>" });
    expect(action.kind).toBe("detail");
    expect(action.href).toBe("/resources/a-guide");
  });

  test("a file with no content offers a download", () => {
    const action = resourceAction({ slug: "form", file: "/uploads/cms/form.pdf" });
    expect(action.kind).toBe("file");
    expect(action.download).toBe(true);
    expect(action.external).toBe(true);
  });

  test("a link with no content opens off-site", () => {
    const action = resourceAction({ slug: "hse", externalUrl: "https://example.org" });
    expect(action.kind).toBe("external");
    expect(action.external).toBe(true);
  });

  test("content wins over a file, because the page offers the file too", () => {
    const action = resourceAction({
      slug: "guide",
      content: "<p>Words</p>",
      file: "/uploads/cms/guide.pdf",
    });
    expect(action.kind).toBe("detail");
  });

  test("a resource with nothing behind it offers no action rather than a dead link", () => {
    expect(resourceAction({ title: "Empty" })).toBeNull();
    expect(resourceAction(null)).toBeNull();
  });

  test("the custom button label is used when set", () => {
    const action = resourceAction({ file: "/uploads/x.pdf", fileLabel: "Get the checklist" });
    expect(action.label).toBe("Get the checklist");
  });
});
