import mongoose from "mongoose";
import {
  buildMongoFilter, buildProjection, populatableFields, allowedModels,
  isAllowedModel, toPlain, FILTER_OPS, MAX_LIMIT,
} from "@/lib/cms/dataQuery";

describe("allowed models", () => {
  test("only exposes discoverable, unblocked models", () => {
    const names = allowedModels().map((m) => m.name);
    expect(names).toContain("Course");
    expect(names).not.toContain("AuditLog");
    expect(isAllowedModel("Course")).toBe(true);
    expect(isAllowedModel("ActivationToken")).toBe(false);
    expect(isAllowedModel("DropDatabase")).toBe(false);
  });
});

describe("filter building", () => {
  test("builds typed clauses for real fields", () => {
    const filter = buildMongoFilter("Course", [
      { field: "isActive", op: "equals", value: "true" },
      { field: "price", op: "gt", value: "100" },
    ]);
    expect(filter).toEqual({ $and: [{ isActive: true }, { price: { $gt: 100 } }] });
  });

  test("match:any produces $or", () => {
    const filter = buildMongoFilter(
      "Course",
      [{ field: "isActive", op: "equals", value: "true" }, { field: "price", op: "lt", value: "10" }],
      {},
      "any"
    );
    expect(filter.$or).toHaveLength(2);
  });

  test("drops unknown, blocked and malformed filters", () => {
    expect(buildMongoFilter("Course", [{ field: "notAField", op: "equals", value: "x" }])).toEqual({});
    expect(buildMongoFilter("User", [{ field: "password", op: "equals", value: "x" }])).toEqual({});
    expect(buildMongoFilter("Course", [{ field: "price", op: "$where", value: "1" }])).toEqual({});
    expect(buildMongoFilter("Course", [{ field: "price", op: "equals", value: "not-a-number" }])).toEqual({});
  });

  test("escapes regular expressions in contains/startsWith", () => {
    const filter = buildMongoFilter("Course", [{ field: "name", op: "contains", value: "a.*(b" }]);
    expect(filter.name.$regex).toBe("a\\.\\*\\(b");
    expect(filter.name.$options).toBe("i");
  });

  test("resolves a dynamic value from the page context", () => {
    const filter = buildMongoFilter("Course", [{ field: "name", op: "equals", value: "{{params.name}}" }], {
      params: { name: "Fire Safety" },
    });
    expect(filter).toEqual({ name: "Fire Safety" });
  });

  test("a plain path with dynamic:true is resolved too", () => {
    const filter = buildMongoFilter("Course", [{ field: "name", op: "equals", value: "params.name", dynamic: true }], {
      params: { name: "Rescue" },
    });
    expect(filter).toEqual({ name: "Rescue" });
  });

  test("in / exists operators", () => {
    expect(buildMongoFilter("Course", [{ field: "currency", op: "in", value: "GBP,USD" }])).toEqual({
      currency: { $in: ["GBP", "USD"] },
    });
    expect(buildMongoFilter("Course", [{ field: "description", op: "exists" }])).toEqual({
      description: { $exists: true, $ne: null },
    });
  });

  test("coerces ObjectId filters and rejects invalid ids", () => {
    const id = new mongoose.Types.ObjectId();
    const ok = buildMongoFilter("Course", [{ field: "userId", op: "equals", value: String(id) }]);
    expect(String(ok.userId)).toBe(String(id));
    expect(buildMongoFilter("Course", [{ field: "userId", op: "equals", value: "nope" }])).toEqual({});
  });
});

describe("projection and populate", () => {
  test("projection excludes every blocked path", () => {
    const projection = buildProjection("User");
    expect(projection.password).toBe(0);
    expect(projection.resetToken).toBe(0);
    expect(projection.__v).toBe(0);
    expect(projection.email).toBeUndefined();
  });

  test("only real, unblocked references may be populated", () => {
    const paths = populatableFields("Course").map((p) => p.path);
    expect(paths).toContain("userId");
    const candidateRefs = populatableFields("Candidate").map((p) => p.ref);
    expect(candidateRefs).toEqual(expect.arrayContaining(["User", "CourseReference"]));
  });
});

describe("serialisation", () => {
  test("converts ObjectIds and Dates to JSON-safe values", () => {
    const id = new mongoose.Types.ObjectId();
    const out = toPlain({ _id: id, when: new Date("2025-01-02T03:04:05.000Z"), nested: { list: [id] } });
    expect(out._id).toBe(String(id));
    expect(out.when).toBe("2025-01-02T03:04:05.000Z");
    expect(out.nested.list[0]).toBe(String(id));
  });
});

describe("guard rails", () => {
  test("operator list and limits are bounded", () => {
    expect(FILTER_OPS.map((o) => o.value)).not.toContain("$where");
    expect(MAX_LIMIT).toBeLessThanOrEqual(200);
  });
});
