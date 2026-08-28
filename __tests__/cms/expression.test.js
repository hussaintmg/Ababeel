import {
  getPath, parsePath, evaluateExpression, evaluateToken, resolveTemplate,
  isDynamic, tokenizeTemplate, templatePaths, escapeHtml, FUNCTIONS,
} from "@/lib/cms/expression";

const ctx = {
  user: { firstName: "Hassan", email: "h@example.com", role: "admin", profile: { address: { city: "London" } } },
  course: { title: "Working at Height", price: 4999, isPublished: true, instructor: { firstName: "Aisha", email: "a@example.com" } },
  courses: [{ title: "One", price: 100 }, { title: "Two", price: 200 }],
};

describe("path access", () => {
  test("parses dotted and indexed paths", () => {
    expect(parsePath("courses[0].title")).toEqual(["courses", "0", "title"]);
  });

  test("reads nested values", () => {
    expect(getPath(ctx, "user.profile.address.city")).toBe("London");
    expect(getPath(ctx, "courses[1].title")).toBe("Two");
  });

  test("returns undefined for a missing hop instead of throwing", () => {
    expect(getPath(ctx, "user.nothing.here")).toBeUndefined();
  });

  test("refuses prototype-polluting segments", () => {
    expect(getPath(ctx, "user.__proto__.polluted")).toBeUndefined();
    expect(getPath(ctx, "user.constructor")).toBeUndefined();
  });
});

describe("formula engine", () => {
  test("evaluates arithmetic with precedence", () => {
    expect(evaluateExpression("2 + 3 * 4", {})).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4", {})).toBe(20);
  });

  test("reads variables and compares", () => {
    expect(evaluateExpression("course.price * 0.8", ctx)).toBeCloseTo(3999.2);
    expect(evaluateExpression("course.price > 0", ctx)).toBe(true);
    expect(evaluateExpression('user.role == "admin"', ctx)).toBe(true);
  });

  test("supports ternaries and whitelisted functions", () => {
    expect(evaluateExpression('course.isPublished ? "live" : "draft"', ctx)).toBe("live");
    expect(evaluateExpression("uppercase(user.firstName)", ctx)).toBe("HASSAN");
  });

  test("division by zero yields 0 rather than Infinity", () => {
    expect(evaluateExpression("10 / 0", {})).toBe(0);
  });

  test("rejects unknown functions and arbitrary JavaScript", () => {
    expect(() => evaluateExpression("process.exit(1)", {})).toThrow();
    expect(() => evaluateExpression("alert('x')", {})).toThrow(/Unknown function/);
    expect(() => evaluateExpression("constructor('return 1')()", {})).toThrow();
  });
});

describe("pipes", () => {
  test("formats currency and dates", () => {
    const { value } = evaluateToken("course.price | currency:GBP", ctx);
    expect(String(value)).toContain("4,999");
    expect(FUNCTIONS.formatDate("2025-03-04T00:00:00.000Z", "short")).toBeTruthy();
  });

  test("default fills a missing value and clears the missing flag", () => {
    const result = evaluateToken("course.rating | default:N/A", ctx);
    expect(result.value).toBe("N/A");
    expect(result.missing).toBe(false);
  });

  test("truncate, join, length, first and last", () => {
    expect(FUNCTIONS.truncate("abcdefghij", 4, "…")).toBe("abcd…");
    expect(FUNCTIONS.join(["a", "b"], "-")).toBe("a-b");
    expect(FUNCTIONS.length(ctx.courses)).toBe(2);
    expect(FUNCTIONS.first(ctx.courses).title).toBe("One");
    expect(FUNCTIONS.last(ctx.courses).title).toBe("Two");
  });

  test("lookup finds an entry by key", () => {
    expect(FUNCTIONS.lookup(ctx.courses, "title", "Two").price).toBe(200);
  });
});

describe("templates", () => {
  test("static strings pass through untouched", () => {
    expect(isDynamic("Welcome to our website")).toBe(false);
    expect(resolveTemplate("Welcome to our website", ctx)).toBe("Welcome to our website");
  });

  test("a lone token keeps its native type", () => {
    expect(resolveTemplate("{{course.price}}", ctx)).toBe(4999);
    expect(resolveTemplate("{{courses}}", ctx)).toHaveLength(2);
  });

  test("composes text and tokens", () => {
    expect(resolveTemplate("Hello {{user.firstName}}, welcome back!", ctx)).toBe("Hello Hassan, welcome back!");
  });

  test("resolves a nested reference", () => {
    expect(resolveTemplate("{{course.instructor.firstName}}", ctx)).toBe("Aisha");
  });

  test("missing variables fall back instead of breaking the page", () => {
    const missed = [];
    expect(
      resolveTemplate("{{course.rating}}", ctx, { fallback: "n/a", onMissing: (p) => missed.push(p) })
    ).toBe("n/a");
    expect(missed).toEqual(["course.rating"]);
  });

  test("tokenize and templatePaths describe the bindings", () => {
    expect(tokenizeTemplate("A {{x.y}} B")).toEqual([
      { kind: "text", value: "A " },
      { kind: "token", value: "x.y" },
      { kind: "text", value: " B" },
    ]);
    expect(templatePaths("{{course.title}} — {{= course.price * 2 }}")).toEqual(["course.title", "course.price"]);
  });
});

describe("HTML escaping", () => {
  test("escapes resolved values destined for raw HTML", () => {
    const hostile = { course: { title: '<script>alert(1)</script>' } };
    const out = resolveTemplate("<h2>{{course.title}}</h2>", hostile, { escapeHtml: true });
    expect(out).toBe("<h2>&lt;script&gt;alert(1)&lt;/script&gt;</h2>");
    expect(escapeHtml(`"'&`)).toBe("&quot;&#39;&amp;");
  });
});
