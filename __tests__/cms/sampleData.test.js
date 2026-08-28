import { buildSampleContext, sampleDocument, fillMissing } from "@/lib/cms/sampleData";
import { schemaTree } from "@/lib/cms/variableRegistry";

describe("sample data", () => {
  const tree = schemaTree();

  test("produces a singular document and a plural list per model", () => {
    const ctx = buildSampleContext(tree, { listSize: 3 });
    expect(ctx.user).toBeDefined();
    expect(Array.isArray(ctx.users)).toBe(true);
    expect(ctx.users).toHaveLength(3);
    expect(Array.isArray(ctx.courses)).toBe(true);
  });

  test("values match the discovered field types", () => {
    const course = sampleDocument(tree.find((m) => m.name === "Course"));
    expect(typeof course.name).toBe("string");
    expect(typeof course.price).toBe("number");
    expect(typeof course.isActive).toBe("boolean");

    const user = sampleDocument(tree.find((m) => m.name === "User"));
    expect(user.email).toMatch(/@example\.com$/);
    expect(["user", "admin", "owner", "organization"]).toContain(user.role);
    expect(user.atcDetails).toBeDefined();
    expect(typeof user.atcDetails.atcName).toBe("string");
  });

  test("never invents a value for a blocked field", () => {
    const user = sampleDocument(tree.find((m) => m.name === "User"));
    expect(user.password).toBeUndefined();
    expect(user.resetToken).toBeUndefined();
  });

  test("is deterministic", () => {
    const model = tree.find((m) => m.name === "Course");
    expect(sampleDocument(model, 0)).toEqual(sampleDocument(model, 0));
  });

  test("fillMissing prefers live data and backfills the rest", () => {
    const merged = fillMissing({ courses: [{ name: "Real" }], empty: [] }, { courses: [{ name: "Sample" }], empty: [{ x: 1 }], user: { a: 1 } });
    expect(merged.courses[0].name).toBe("Real");
    expect(merged.empty).toHaveLength(1); // empty live array falls back to sample
    expect(merged.user).toEqual({ a: 1 });
  });
});
