import fs from "fs";
import path from "path";
import {
  getSchemaRegistry, getModelDescriptor, describeModel, isQueryableField,
  camelize, pluralize, humanizeModel, humanizeField, clearSchemaRegistryCache,
} from "@/lib/cms/schemaRegistry";
import { ALL_MODELS } from "@/models/index";
import mongoose from "mongoose";

function findField(fields, name) {
  return (fields || []).find((f) => f.name === name);
}

beforeAll(() => {
  clearSchemaRegistryCache();
});

describe("model barrel", () => {
  test("every file in models/ is registered", () => {
    const files = fs
      .readdirSync(path.join(process.cwd(), "models"))
      .filter((f) => f.endsWith(".js") && f !== "index.js")
      .map((f) => f.replace(/\.js$/, ""));
    const registered = Object.keys(ALL_MODELS);
    const missing = files.filter((f) => !registered.includes(f));
    expect(missing).toEqual([]);
  });
});

describe("discovery", () => {
  test("finds the application's models", () => {
    const registry = getSchemaRegistry();
    const names = registry.map((m) => m.name);
    expect(names).toEqual(expect.arrayContaining(["User", "Course", "CourseReference", "Candidate", "Invoice"]));
  });

  test("excludes models blocked by policy", () => {
    const names = getSchemaRegistry().map((m) => m.name);
    expect(names).not.toContain("ActivationToken");
    expect(names).not.toContain("AuditLog");
  });

  test("derives singular and plural variable names", () => {
    const course = getModelDescriptor("Course");
    expect(course.key).toBe("course");
    expect(course.collectionKey).toBe("courses");
    expect(camelize("CourseReference")).toBe("courseReference");
    expect(pluralize("class")).toBe("classes");
    expect(pluralize("category")).toBe("categories");
    expect(humanizeModel("CourseReference")).toBe("Course Reference");
    expect(humanizeField("firstName")).toBe("First Name");
  });
});

describe("simple fields", () => {
  const user = () => getModelDescriptor("User");

  test("maps scalar types", () => {
    expect(findField(user().fields, "username").type).toBe("String");
    expect(findField(user().fields, "email").type).toBe("Email");
    expect(getModelDescriptor("Course").fields.find((f) => f.name === "price").type).toBe("Number");
    expect(findField(getModelDescriptor("Course").fields, "isActive").type).toBe("Boolean");
    expect(findField(getModelDescriptor("Candidate").fields, "dateOfBirth").type).toBe("DateTime");
  });

  test("captures enums, required and nullable", () => {
    const role = findField(user().fields, "role");
    expect(role.enumValues).toEqual(expect.arrayContaining(["user", "admin", "owner", "organization"]));
    const name = findField(getModelDescriptor("Course").fields, "name");
    expect(name.required).toBe(true);
    expect(name.nullable).toBe(false);
    const description = findField(getModelDescriptor("Course").fields, "description");
    expect(description.nullable).toBe(true);
  });
});

describe("nested objects", () => {
  test("rebuilds nesting from Mongoose's flattened paths", () => {
    const atc = findField(getModelDescriptor("User").fields, "atcDetails");
    expect(atc.type).toBe("Object");
    expect(atc.children.map((c) => c.name)).toEqual(expect.arrayContaining(["atcName", "atcNumber", "atcAddress"]));
    expect(findField(atc.children, "atcName").fullPath).toBe("user.atcDetails.atcName");
  });

  test("infers semantic types from field names inside nested objects", () => {
    const image = findField(getModelDescriptor("User").fields, "profileImage");
    expect(findField(image.children, "url").type).toBe("URL");
  });
});

describe("arrays", () => {
  test("an array of references is Array<Reference> with children", () => {
    const candidates = findField(getModelDescriptor("CourseReference").fields, "candidates");
    expect(candidates.type).toBe("Array<Reference>");
    expect(candidates.isArray).toBe(true);
    expect(candidates.ref).toBe("Candidate");
    expect(candidates.children.map((c) => c.name)).toEqual(expect.arrayContaining(["firstName", "lastName"]));
  });

  test("a subdocument array is Array<Object> with its own shape", () => {
    // Template.designData is a single nested subdocument holding an array of
    // page subdocuments — nesting and arrays in one path.
    const designData = findField(getModelDescriptor("Template").fields, "designData");
    expect(designData.type).toBe("Object");
    const pages = findField(designData.children, "pages");
    expect(pages.type).toBe("Array<Object>");
    expect(pages.children.map((c) => c.name)).toEqual(expect.arrayContaining(["pageNumber", "elements"]));
    expect(findField(pages.children, "pageNumber").fullPath).toBe("template.designData.pages[].pageNumber");
  });

  test("a blocked subdocument array is not discovered at all", () => {
    // Invoice.transactions carries payment detail and is blocked by policy.
    expect(findField(getModelDescriptor("Invoice").fields, "transactions")).toBeUndefined();
  });

  test("arrays are never reported as strings", () => {
    const candidates = findField(getModelDescriptor("CourseReference").fields, "candidates");
    expect(candidates.type).not.toBe("String");
  });
});

describe("references", () => {
  test("an ObjectId with ref becomes a Reference carrying the target's fields", () => {
    const userId = findField(getModelDescriptor("Course").fields, "userId");
    expect(userId.type).toBe("Reference");
    expect(userId.ref).toBe("User");
    expect(findField(userId.children, "email").fullPath).toBe("course.userId.email");
  });

  test("reference expansion never exposes a blocked field", () => {
    const userId = findField(getModelDescriptor("Course").fields, "userId");
    expect(findField(userId.children, "password")).toBeUndefined();
    expect(findField(userId.children, "resetToken")).toBeUndefined();
  });

  test("recursion is bounded (no infinite self-reference)", () => {
    const createdBy = findField(getModelDescriptor("User").fields, "createdByUserId");
    expect(createdBy.type).toBe("Reference");
    // Depth 2 means the nested User's own createdByUserId has no children.
    const nested = findField(createdBy.children, "createdByUserId");
    expect(nested?.children ?? []).toHaveLength(0);
  });
});

describe("query validation", () => {
  test("accepts real fields and rejects invented or blocked ones", () => {
    expect(isQueryableField("Course", "name")).toBe(true);
    expect(isQueryableField("Course", "userId")).toBe(true);
    expect(isQueryableField("Course", "notAField")).toBe(false);
    expect(isQueryableField("User", "password")).toBe(false);
    expect(isQueryableField("NoSuchModel", "name")).toBe(false);
  });
});

describe("describeModel", () => {
  test("works on an ad-hoc schema with deep nesting", () => {
    const schema = new mongoose.Schema({
      title: String,
      profile: { address: { city: String, country: String }, social: { instagram: String } },
      lessons: [{ title: String, duration: Number }],
    });
    const name = `TestDeep${Date.now()}`;
    const model = mongoose.model(name, schema);
    const desc = describeModel(model);

    const address = findField(findField(desc.fields, "profile").children, "address");
    expect(address.children.map((c) => c.name)).toEqual(["city", "country"]);
    expect(findField(address.children, "city").fullPath).toContain("profile.address.city");

    const social = findField(findField(desc.fields, "profile").children, "social");
    expect(findField(social.children, "instagram").type).toBe("String");

    const lessons = findField(desc.fields, "lessons");
    expect(lessons.type).toBe("Array<Object>");
    expect(findField(lessons.children, "duration").type).toBe("Number");

    delete mongoose.models[name];
  });
});
