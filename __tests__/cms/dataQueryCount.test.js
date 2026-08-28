/**
 * The "count" data-source mode.
 *
 * It exists so a page can show a real figure — "{{programmeCount}} training
 * programmes" — instead of a number typed by hand that goes stale. These tests
 * stand a fake model in front of the query engine to check the count goes
 * through the same validated filter as a list, and that a failure yields 0
 * rather than a page rendering "undefined".
 */
import mongoose from "mongoose";
import { runDataSource } from "@/lib/cms/dataQuery";

jest.mock("@/utils/db", () => ({ __esModule: true, default: jest.fn(async () => {}) }));

function stubModel(name, impl) {
  const original = mongoose.models[name];
  mongoose.models[name] = { ...original, ...impl };
  return () => {
    mongoose.models[name] = original;
  };
}

describe("count data sources", () => {
  test("returns the number itself, so {{key}} renders it", async () => {
    const restore = stubModel("Course", { countDocuments: async () => 42 });
    try {
      const r = await runDataSource({ key: "n", model: "Course", mode: "count" });
      expect(r).toMatchObject({ key: "n", mode: "count", data: 42, total: 42, error: null });
    } finally {
      restore();
    }
  });

  test("counts through the same validated filter a list would use", async () => {
    let seen = null;
    const restore = stubModel("Course", {
      countDocuments: async (filter) => {
        seen = filter;
        return 7;
      },
    });
    try {
      const r = await runDataSource({
        key: "active",
        model: "Course",
        mode: "count",
        filters: [
          { field: "isActive", op: "equals", value: "true" },
          // Not a field on the model — it must be dropped, not passed to Mongo.
          { field: "$where", op: "equals", value: "1" },
        ],
      });
      expect(r.data).toBe(7);
      expect(seen).toEqual({ isActive: true });
    } finally {
      restore();
    }
  });

  test("a blocked model counts nothing and says why", async () => {
    const r = await runDataSource({ key: "n", model: "AuditLog", mode: "count" });
    expect(r.data).toBe(0);
    expect(r.error).toMatch(/not available/);
  });

  test("a failing query reports 0 rather than undefined", async () => {
    const restore = stubModel("Course", {
      countDocuments: async () => {
        throw new Error("boom");
      },
    });
    try {
      const r = await runDataSource({ key: "n", model: "Course", mode: "count" });
      expect(r.data).toBe(0);
      expect(r.error).toBe("Query failed");
    } finally {
      restore();
    }
  });

  test("an unknown mode still behaves as a list", async () => {
    const restore = stubModel("Course", {
      find: () => ({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [] }) }) }),
      }),
    });
    try {
      const r = await runDataSource({ key: "n", model: "Course", mode: "nonsense" });
      expect(r.mode).toBe("list");
      expect(Array.isArray(r.data)).toBe(true);
    } finally {
      restore();
    }
  });
});
