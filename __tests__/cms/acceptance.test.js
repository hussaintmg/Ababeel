/**
 * The acceptance workflow from the spec, exercised end to end against the real
 * engines: a Course-shaped model is discovered, its fields become variables, a
 * Repeat block binds them, a condition filters unpublished records, and the
 * result is rendered to actual HTML by the production BlockRenderer.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mongoose from "mongoose";
import { describeModel, clearSchemaRegistryCache } from "@/lib/cms/schemaRegistry";
import { expandBlocks } from "@/lib/cms/binding";
import BlockRenderer from "@/Components/cms/BlockRenderer";
import { createBlock } from "@/Components/cms/blockSchemas";

const MODEL_NAME = `AcceptanceCourse${Date.now()}`;

let courseModel;

beforeAll(() => {
  clearSchemaRegistryCache();
  const schema = new mongoose.Schema(
    {
      title: { type: String, required: true },
      description: String,
      thumbnail: String,
      price: { type: Number, default: 0 },
      slug: { type: String, required: true },
      isPublished: { type: Boolean, default: false },
      instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
  );
  courseModel = mongoose.model(MODEL_NAME, schema);
});

afterAll(() => {
  delete mongoose.models[MODEL_NAME];
  clearSchemaRegistryCache();
});

/* The records a data source would return, already sanitised and populated. */
const courses = [
  {
    _id: "1",
    title: "React Masterclass",
    description: "Build production React apps.",
    thumbnail: "/uploads/cms/react.png",
    price: 4999,
    slug: "react-masterclass",
    isPublished: true,
    instructor: { firstName: "Aisha", email: "aisha@example.com" },
  },
  {
    _id: "2",
    title: "Draft Course",
    description: "Not ready yet.",
    thumbnail: "",
    price: 0,
    slug: "draft-course",
    isPublished: false,
    instructor: { firstName: "Omar", email: "omar@example.com" },
  },
  {
    _id: "3",
    title: "Fire Warden Essentials",
    description: "Evacuation and prevention.",
    thumbnail: "/uploads/cms/fire.png",
    price: 1999,
    slug: "fire-warden",
    isPublished: true,
    instructor: { firstName: "Zara", email: "zara@example.com" },
  },
];

describe("1 — the CMS discovers the model's variables automatically", () => {
  test("every field the spec names is discovered, with the right type", () => {
    const desc = describeModel(courseModel);
    const byName = Object.fromEntries(desc.fields.map((f) => [f.name, f]));

    expect(byName.title.type).toBe("String");
    expect(byName.description.type).toBe("RichText");
    expect(byName.thumbnail.type).toBe("Image");
    expect(byName.price.type).toBe("Number");
    expect(byName.slug.type).toBe("URL");
    expect(byName.isPublished.type).toBe("Boolean");
    expect(byName.instructor.type).toBe("Reference");
    expect(byName.instructor.ref).toBe("User");

    // The reference exposes the related model's fields under the same path.
    const instructorFields = byName.instructor.children.map((c) => c.fullPath);
    expect(instructorFields).toEqual(
      expect.arrayContaining([`${desc.key}.instructor.username`, `${desc.key}.instructor.email`])
    );
  });
});

describe("2 — a Repeat block renders one card per record", () => {
  const page = [
    { id: "hero", type: "heading", props: { text: "Our Courses", subtitle: "", level: "2", align: "center" } },
    {
      id: "grid",
      type: "repeater",
      props: { source: "courses", item: "course", layout: "grid", columns: "3", gap: "20", emptyText: "No courses yet." },
      _conditions: { enabled: false, match: "all", rules: [] },
      children: [
        { id: "img", type: "image", props: { src: "{{course.thumbnail}}", alt: "{{course.title}}", maxWidth: "400" }, _fallbacks: { src: "/default-course.jpg" } },
        { id: "title", type: "heading", props: { text: "{{course.title}}", level: "3", align: "left" } },
        { id: "desc", type: "richText", props: { html: "<p>{{course.description}}</p>", maxWidth: "prose", align: "left" } },
        {
          id: "cta",
          type: "cta",
          props: {
            title: "{{course.price | currency:GBP}}",
            text: "Taught by {{course.instructor.firstName}}",
            button: { label: "View course", href: "/courses/{{course.slug}}" },
          },
        },
      ],
      // Only published courses are rendered.
      _repeatCondition: null,
    },
  ];

  // The published-only rule lives on each child in the real builder; here it is
  // applied to the whole card by wrapping the children in one condition.
  const publishedOnly = JSON.parse(JSON.stringify(page));
  publishedOnly[1].children = publishedOnly[1].children.map((c) => ({
    ...c,
    _conditions: { enabled: true, match: "all", rules: [{ left: "course.isPublished", op: "==", right: "true" }] },
  }));

  test("expands to one item per record, with conditions applied per record", () => {
    const [, grid] = expandBlocks(publishedOnly, { courses });
    expect(grid.props._items).toHaveLength(3);
    expect(grid.props._items[0].blocks).toHaveLength(4); // published
    expect(grid.props._items[1].blocks).toHaveLength(0); // draft → every child hidden
    expect(grid.props._items[2].blocks).toHaveLength(4);
  });

  test("renders real HTML containing the database values", () => {
    const html = renderToStaticMarkup(React.createElement(BlockRenderer, { blocks: publishedOnly, data: { courses } }));

    expect(html).toContain("React Masterclass");
    expect(html).toContain("Fire Warden Essentials");
    expect(html).not.toContain("Draft Course");

    expect(html).toContain("/uploads/cms/react.png");
    expect(html).toContain("Evacuation and prevention.");
    expect(html).toContain("Taught by Aisha");
    expect(html).toContain("/courses/react-masterclass");
    expect(html).toContain("/courses/fire-warden");
    // The price went through the currency pipe.
    expect(html).toMatch(/£\s?4,999/);
    // No unresolved tokens leak into the output.
    expect(html).not.toContain("{{");
  });

  test("a missing value falls back instead of rendering an empty image", () => {
    const draftOnly = JSON.parse(JSON.stringify(page));
    const html = renderToStaticMarkup(
      React.createElement(BlockRenderer, { blocks: draftOnly, data: { courses: [courses[1]] } })
    );
    expect(html).toContain("/default-course.jpg");
  });

  test("an empty collection shows the configured empty state, not a crash", () => {
    const html = renderToStaticMarkup(React.createElement(BlockRenderer, { blocks: page, data: { courses: [] } }));
    expect(html).toContain("No courses yet.");
  });
});

describe("3 — dynamic styles, links and HTML safety", () => {
  test("a style value bound to a variable reaches the rendered element", () => {
    const blocks = [
      { id: "s", type: "heading", props: { text: "Hello", level: "2", align: "center" }, _style: { bgColor: "{{site.primaryColor}}" } },
    ];
    const html = renderToStaticMarkup(
      React.createElement(BlockRenderer, { blocks, data: { site: { primaryColor: "#2563eb" } } })
    );
    expect(html).toContain("background-color:#2563eb");
  });

  test("hostile record content cannot inject markup through a rich-text block", () => {
    const blocks = [{ id: "r", type: "richText", props: { html: "<p>{{course.title}}</p>", maxWidth: "prose", align: "left" } }];
    const html = renderToStaticMarkup(
      React.createElement(BlockRenderer, {
        blocks,
        data: { course: { title: '<script>alert("xss")</script>' } },
      })
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("4 — nothing about existing static pages changes", () => {
  test("a legacy block with no bindings renders identically with or without data", () => {
    const legacy = [{ id: "old", type: "heading", props: { text: "Welcome to our website", level: "2", align: "center" } }];
    const withoutData = renderToStaticMarkup(React.createElement(BlockRenderer, { blocks: legacy }));
    const withData = renderToStaticMarkup(React.createElement(BlockRenderer, { blocks: legacy, data: { courses } }));
    expect(withoutData).toBe(withData);
    expect(withoutData).toContain("Welcome to our website");
  });

  test("createBlock still produces the original block shape (plus children for containers)", () => {
    const heading = createBlock("heading");
    expect(heading).toMatchObject({ type: "heading", props: { text: expect.any(String) } });
    expect(heading.children).toBeUndefined();
    expect(createBlock("repeater").children).toEqual([]);
  });
});
