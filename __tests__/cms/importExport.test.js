import { buildExport, buildCsv, isValidType, validateImportItem, planImport, uniqueName } from "@/lib/cms/importExport";

const modelNames = new Set(["User", "Course"]);

describe("export", () => {
  test("preserves name, path, type, model, relation and array info", () => {
    const payload = buildExport(
      [
        { name: "user.email", type: "Email", source: "User", path: "email", description: "User email address", isArray: false, kind: "schema" },
        { name: "course.students", type: "Array<Reference>", source: "Course", path: "students", ref: "User", isArray: true, kind: "schema" },
      ],
      { models: ["User", "Course"] }
    );
    expect(payload.version).toBe(1);
    expect(payload.models).toEqual(["User", "Course"]);
    expect(payload.variables[0]).toMatchObject({ name: "user.email", type: "Email", source: "User", path: "email" });
    expect(payload.variables[1]).toMatchObject({ type: "Array<Reference>", ref: "User", isArray: true });
  });

  test("CSV escapes separators and quotes", () => {
    const csv = buildCsv([{ name: "a", type: "String", description: 'has, comma and "quote"' }]);
    const [header, row] = csv.split("\n");
    expect(header.startsWith("name,type")).toBe(true);
    expect(row).toContain('"has, comma and ""quote"""');
  });
});

describe("type validation", () => {
  test("accepts known and Array<...> types", () => {
    expect(isValidType("Email")).toBe(true);
    expect(isValidType("Array<Reference>")).toBe(true);
    expect(isValidType("Array")).toBe(true);
    expect(isValidType("Frobnicator")).toBe(false);
    expect(isValidType("Array<Frobnicator>")).toBe(false);
  });
});

describe("item validation", () => {
  test("rejects bad names, types and unknown models", () => {
    expect(validateImportItem({ name: "", type: "String" }, { modelNames }).errors).toContain("Missing variable name");
    expect(validateImportItem({ name: "not a name", type: "String" }, { modelNames }).ok).toBe(false);
    expect(validateImportItem({ name: "a.b", type: "Nope" }, { modelNames }).errors[0]).toMatch(/Unknown type/);
    expect(validateImportItem({ name: "a.b", type: "String", source: "Ghost" }, { modelNames }).errors[0]).toMatch(/Unknown model/);
    expect(validateImportItem({ name: "a.b", type: "Reference", ref: "Ghost" }, { modelNames }).errors[0]).toMatch(/referenced model/);
  });

  test("flags duplicates without rejecting them", () => {
    const result = validateImportItem({ name: "site.name", type: "String" }, { existingNames: new Set(["site.name"]), modelNames });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("duplicate");
  });
});

describe("import planning", () => {
  const payload = {
    variables: [
      { name: "site.name", type: "String", value: "Ababeel" },
      { name: "site.name", type: "String", value: "Duplicate inside file" },
      { name: "site.primaryColor", type: "Color", value: "#2563eb" },
      { name: "bad name", type: "String" },
      { name: "site.bogus", type: "Nope" },
    ],
  };

  test("rejects a payload without a variables array", () => {
    expect(planImport({ nope: true }, { modelNames }).ok).toBe(false);
  });

  test("skip mode leaves existing variables alone", () => {
    const plan = planImport(payload, { existingNames: new Set(["site.primaryColor"]), modelNames, mode: "skip" });
    const first = (name) => plan.items.find((i) => i.variable.name === name);
    expect(first("site.primaryColor").action).toBe("skip");
    expect(first("site.name").action).toBe("create");
    expect(plan.summary.invalid).toBe(2);
  });

  test("replace and createNew modes", () => {
    const replace = planImport(payload, { existingNames: new Set(["site.primaryColor"]), modelNames, mode: "replace" });
    expect(replace.items.find((i) => i.variable.name === "site.primaryColor").action).toBe("replace");

    const created = planImport(payload, { existingNames: new Set(["site.primaryColor"]), modelNames, mode: "createNew" });
    expect(created.items.find((i) => i.variable.name === "site.primaryColor").action).toBe("createNew");
  });

  test("a duplicate inside the file is only applied once", () => {
    const plan = planImport(payload, { modelNames, mode: "skip" });
    const dupes = plan.items.filter((i) => i.variable.name === "site.name");
    expect(dupes[0].action).toBe("create");
    expect(dupes[1].action).toBe("skip");
  });

  test("caps oversized imports", () => {
    const big = { variables: Array.from({ length: 2001 }, (_, i) => ({ name: `a.b${i}`, type: "String" })) };
    expect(planImport(big, { modelNames }).ok).toBe(false);
  });

  test("uniqueName finds a free suffix", () => {
    expect(uniqueName("site.name", new Set(["site.name", "site.name_2"]))).toBe("site.name_3");
    expect(uniqueName("site.other", new Set())).toBe("site.other");
  });
});
