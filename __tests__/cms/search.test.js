import { searchVariables, scoreVariable, autocompletePaths } from "@/lib/cms/search";

const variables = [
  { name: "user", type: "Object" },
  { name: "user.email", type: "Email", label: "Email" },
  { name: "user.firstName", type: "String", label: "First Name" },
  { name: "user.profile", type: "Object" },
  { name: "user.profile.city", type: "String" },
  { name: "course", type: "Object" },
  { name: "course.price", type: "Number" },
  { name: "course.thumbnail", type: "Image" },
  { name: "course.instructor", type: "Reference", source: "User" },
  { name: "candidate.emailVerifiedAt", type: "DateTime" },
];

describe("search", () => {
  test("ranks an exact leaf match first", () => {
    expect(searchVariables(variables, "email")[0].name).toBe("user.email");
  });

  test("finds by fragment and by model", () => {
    expect(searchVariables(variables, "thumb").map((v) => v.name)).toContain("course.thumbnail");
    expect(searchVariables(variables, "price").map((v) => v.name)).toContain("course.price");
    expect(searchVariables(variables, "instructor").map((v) => v.name)).toContain("course.instructor");
  });

  test("fuzzy subsequence matching", () => {
    expect(searchVariables(variables, "usrfn").map((v) => v.name)).toContain("user.firstName");
  });

  test("no match scores below zero", () => {
    expect(scoreVariable({ name: "user.email" }, "zzzzz")).toBe(-1);
    expect(searchVariables(variables, "zzzzz")).toHaveLength(0);
  });

  test("an empty query returns everything", () => {
    expect(searchVariables(variables, "")).toHaveLength(variables.length);
  });
});

describe("autocomplete", () => {
  test("'user.' lists direct children only", () => {
    const names = autocompletePaths(variables, "user.").map((v) => v.name);
    expect(names).toEqual(expect.arrayContaining(["user.email", "user.firstName", "user.profile"]));
    expect(names).not.toContain("user.profile.city");
  });

  test("narrows on a partial leaf", () => {
    expect(autocompletePaths(variables, "course.th").map((v) => v.name)).toEqual(["course.thumbnail"]);
  });

  test("a bare fragment lists root variables", () => {
    expect(autocompletePaths(variables, "co").map((v) => v.name)).toEqual(["course"]);
  });
});
