import { expandBlocks, resolveBlock, resolveProps, readCollection, blockBindings, pageBindings, probePath } from "@/lib/cms/binding";

const ctx = {
  site: { primaryColor: "#2563eb" },
  user: { firstName: "Hassan", role: "admin" },
  course: { title: "Solo", price: 100 },
  courses: [
    { title: "One", price: 100, slug: "one", isPublished: true, thumbnail: "/a.png", instructor: { firstName: "Aisha" } },
    { title: "Two", price: 0, slug: "two", isPublished: false, thumbnail: "", instructor: { firstName: "Omar" } },
    { title: "Three", price: 300, slug: "three", isPublished: true, thumbnail: "/c.png", instructor: { firstName: "Zara" } },
  ],
};

const block = (over) => ({ id: "b1", type: "heading", props: { text: "Static title" }, ...over });

describe("backward compatibility", () => {
  test("a static block is returned unchanged", () => {
    const [out] = expandBlocks([block()], ctx);
    expect(out.props.text).toBe("Static title");
  });

  test("blocks render untouched when no data context is supplied", () => {
    const b = block({ props: { text: "{{course.title}}" } });
    const [out] = expandBlocks([b], {});
    expect(out.props.text).toBe("");
  });
});

describe("prop resolution", () => {
  test("resolves nested props and list items", () => {
    const b = block({
      type: "cardGrid",
      props: {
        title: "Hello {{user.firstName}}",
        items: [{ title: "{{course.title}}", text: "{{= course.price * 2 }}" }],
      },
    });
    const [out] = expandBlocks([b], ctx);
    expect(out.props.title).toBe("Hello Hassan");
    expect(out.props.items[0].title).toBe("Solo");
    expect(out.props.items[0].text).toBe(200);
  });

  test("applies a per-prop fallback when a binding is missing", () => {
    const b = block({
      type: "image",
      props: { src: "{{course.thumbnail}}" },
      _fallbacks: { src: "/default-course.jpg" },
    });
    const [out] = expandBlocks([b], ctx);
    expect(out.props.src).toBe("/default-course.jpg");
    expect(out._missing).toHaveLength(1);
  });

  test("escapes data injected into an HTML prop", () => {
    const hostile = { course: { title: "<img src=x onerror=alert(1)>" } };
    const out = resolveProps({ html: "<p>{{course.title}}</p>" }, hostile);
    expect(out.html).toBe("<p>&lt;img src=x onerror=alert(1)&gt;</p>");
  });

  test("resolves dynamic style values", () => {
    const b = block({ _style: { bgColor: "{{site.primaryColor}}" } });
    const [out] = expandBlocks([b], ctx);
    expect(out._style.bgColor).toBe("#2563eb");
  });
});

describe("conditions", () => {
  test("a failing visibility condition removes the block", () => {
    const b = block({ _conditions: { enabled: true, match: "all", rules: [{ left: "user.role", op: "==", right: "editor" }] } });
    expect(expandBlocks([b], ctx)).toHaveLength(0);
  });

  test("a passing condition keeps it", () => {
    const b = block({ _conditions: { enabled: true, match: "all", rules: [{ left: "user.role", op: "==", right: "admin" }] } });
    expect(expandBlocks([b], ctx)).toHaveLength(1);
  });

  test("conditional properties switch a value", () => {
    const b = block({
      _condProps: [
        {
          prop: "bgColor",
          target: "style",
          group: { enabled: true, match: "all", rules: [{ left: "course.price", op: ">", right: "50" }] },
          then: "#f59e0b",
          else: "#ffffff",
        },
      ],
    });
    const [out] = expandBlocks([b], ctx);
    expect(out._style.bgColor).toBe("#f59e0b");
  });
});

describe("repeaters", () => {
  const repeater = (over = {}) => ({
    id: "rep",
    type: "repeater",
    props: { source: "courses", item: "course", layout: "grid", columns: "3", ...over },
    children: [
      { id: "c1", type: "image", props: { src: "{{course.thumbnail}}" } },
      { id: "c2", type: "heading", props: { text: "{{course.title}}" } },
      {
        id: "c3",
        type: "cta",
        props: { title: "{{course.instructor.firstName}}", button: { label: "View", href: "/courses/{{course.slug}}" } },
        _conditions: { enabled: true, match: "all", rules: [{ left: "course.isPublished", op: "==", right: "true" }] },
      },
    ],
  });

  test("readCollection normalises the source", () => {
    expect(readCollection(ctx, "courses")).toHaveLength(3);
    expect(readCollection(ctx, "course")).toHaveLength(1);
    expect(readCollection(ctx, "nothing")).toHaveLength(0);
  });

  test("renders once per record with a scoped item variable", () => {
    const [out] = expandBlocks([repeater()], ctx);
    expect(out.props._count).toBe(3);
    expect(out.props._items).toHaveLength(3);
    expect(out.props._items[0].blocks[1].props.text).toBe("One");
    expect(out.props._items[2].blocks[1].props.text).toBe("Three");
  });

  test("builds dynamic links from the item", () => {
    const [out] = expandBlocks([repeater()], ctx);
    const cta = out.props._items[0].blocks.find((b) => b.type === "cta");
    expect(cta.props.button.href).toBe("/courses/one");
    expect(cta.props.title).toBe("Aisha");
  });

  test("a condition inside the repeat is evaluated per record", () => {
    const [out] = expandBlocks([repeater()], ctx);
    expect(out.props._items[0].blocks).toHaveLength(3); // published
    expect(out.props._items[1].blocks).toHaveLength(2); // unpublished → CTA hidden
  });

  test("limit and offset are honoured", () => {
    const [out] = expandBlocks([repeater({ limit: "1", offset: "1" })], ctx);
    expect(out.props._items).toHaveLength(1);
    expect(out.props._items[0].blocks[1].props.text).toBe("Two");
  });

  test("an empty collection yields no items", () => {
    const [out] = expandBlocks([repeater({ source: "nothing" })], ctx);
    expect(out.props._items).toHaveLength(0);
  });

  test("a block can repeat itself without a container", () => {
    const b = block({
      props: { text: "{{course.title}}" },
      _repeat: { enabled: true, source: "courses", item: "course", limit: "2" },
    });
    const out = expandBlocks([b], ctx);
    expect(out).toHaveLength(2);
    expect(out.map((o) => o.props.text)).toEqual(["One", "Two"]);
    expect(new Set(out.map((o) => o.id)).size).toBe(2);
  });

  test("index helpers are available inside a repeat", () => {
    const b = block({
      props: { text: "{{number}}" },
      _repeat: { enabled: true, source: "courses", item: "course" },
    });
    expect(expandBlocks([b], ctx).map((o) => o.props.text)).toEqual([1, 2, 3]);
  });
});

describe("introspection", () => {
  test("lists the variables a block binds", () => {
    const b = block({ props: { text: "{{course.title}} — {{= course.price * 2 }}" } });
    expect(blockBindings(b)).toEqual(expect.arrayContaining(["course.title", "course.price"]));
  });

  test("page bindings include repeat sources and children", () => {
    const rep = {
      id: "r",
      type: "repeater",
      props: { source: "courses", item: "course" },
      children: [{ id: "c", type: "heading", props: { text: "{{course.title}}" } }],
    };
    const [entry] = pageBindings([rep]);
    expect(entry.paths).toEqual(expect.arrayContaining(["courses", "course.title"]));
  });

  test("probePath reports resolution for the inspector", () => {
    expect(probePath(ctx, "user.firstName")).toEqual({ path: "user.firstName", value: "Hassan", found: true });
    expect(probePath(ctx, "user.nope").found).toBe(false);
  });
});

describe("resolveBlock", () => {
  test("returns null when hidden, and marks resolved blocks", () => {
    expect(resolveBlock(block({ _conditions: { enabled: true, rules: [{ left: "user.role", op: "==", right: "nobody" }] } }), ctx)).toBeNull();
    expect(resolveBlock(block(), ctx)._resolved).toBe(true);
  });
});
