import { evaluateConditions, applyOperator, describeConditions, newGroup, operatorArity } from "@/lib/cms/conditions";

const ctx = {
  course: { price: 4999, isPublished: true, title: "Working at Height", tags: ["safety", "height"] },
  user: { role: "admin", avatar: "", email: "a@b.com" },
};

const group = (rules, match = "all") => ({ enabled: true, match, rules });

describe("operators", () => {
  test("comparison and equality are value-tolerant", () => {
    expect(applyOperator("==", 5, "5")).toBe(true);
    expect(applyOperator("==", true, "true")).toBe(true);
    expect(applyOperator("!=", "a", "b")).toBe(true);
    expect(applyOperator(">", 10, 2)).toBe(true);
    expect(applyOperator("<=", 2, 2)).toBe(true);
  });

  test("string and array operators", () => {
    expect(applyOperator("contains", "Working at Height", "height")).toBe(true);
    expect(applyOperator("contains", ["a", "b"], "b")).toBe(true);
    expect(applyOperator("notContains", ["a"], "b")).toBe(true);
    expect(applyOperator("startsWith", "Working", "work")).toBe(true);
    expect(applyOperator("endsWith", "Height", "ght")).toBe(true);
  });

  test("presence operators", () => {
    expect(applyOperator("exists", "x")).toBe(true);
    expect(applyOperator("exists", undefined)).toBe(false);
    expect(applyOperator("notExists", null)).toBe(true);
    expect(applyOperator("isEmpty", "")).toBe(true);
    expect(applyOperator("isEmpty", [])).toBe(true);
    expect(applyOperator("isNotEmpty", ["a"])).toBe(true);
    expect(applyOperator("isTrue", true)).toBe(true);
    expect(applyOperator("isFalse", false)).toBe(true);
  });

  test("arity is reported for the builder UI", () => {
    expect(operatorArity("exists")).toBe(1);
    expect(operatorArity(">")).toBe(2);
  });
});

describe("groups", () => {
  test("no conditions means always visible (backward compatible)", () => {
    expect(evaluateConditions(undefined, ctx)).toBe(true);
    expect(evaluateConditions({ enabled: true, rules: [] }, ctx)).toBe(true);
    expect(evaluateConditions({ enabled: false, rules: [{ left: "course.price", op: ">", right: 999999 }] }, ctx)).toBe(true);
  });

  test("resolves the left side as a variable path", () => {
    expect(evaluateConditions(group([{ left: "course.price", op: ">", right: "0" }]), ctx)).toBe(true);
    expect(evaluateConditions(group([{ left: "user.role", op: "==", right: "admin" }]), ctx)).toBe(true);
    expect(evaluateConditions(group([{ left: "course.isPublished", op: "==", right: "true" }]), ctx)).toBe(true);
    expect(evaluateConditions(group([{ left: "user.avatar", op: "exists" }]), ctx)).toBe(true);
    expect(evaluateConditions(group([{ left: "user.avatar", op: "isNotEmpty" }]), ctx)).toBe(false);
  });

  test("AND requires every rule, OR requires one", () => {
    const rules = [
      { left: "course.isPublished", op: "==", right: "true" },
      { left: "course.price", op: ">", right: "999999" },
    ];
    expect(evaluateConditions(group(rules, "all"), ctx)).toBe(false);
    expect(evaluateConditions(group(rules, "any"), ctx)).toBe(true);
  });

  test("nested groups", () => {
    const nested = group(
      [
        { left: "course.isPublished", op: "==", right: "true" },
        group([{ left: "user.role", op: "==", right: "editor" }, { left: "user.role", op: "==", right: "admin" }], "any"),
      ],
      "all"
    );
    expect(evaluateConditions(nested, ctx)).toBe(true);
  });

  test("compares against another variable", () => {
    const ctx2 = { a: { n: 5 }, b: { n: 5 } };
    expect(
      evaluateConditions(group([{ left: "a.n", op: "==", right: "b.n", rightIsVariable: true }]), ctx2)
    ).toBe(true);
  });

  test("describes itself for the collapsed card", () => {
    expect(describeConditions(group([{ left: "course.price", op: ">", right: "0" }]))).toBe("course.price greater than 0");
    expect(newGroup().rules).toHaveLength(1);
  });
});
