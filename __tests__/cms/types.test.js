import {
  VAR_TYPES, TYPE_LIST, isCompatible, isArrayType, arrayItemType, arrayTypeLabel,
  refineStringType, inferTypeFromValue, typeIcon, typeColor, FIELD_ACCEPTS,
} from "@/lib/cms/types";

describe("array types", () => {
  test("labels, detection and item extraction", () => {
    expect(arrayTypeLabel("Reference")).toBe("Array<Reference>");
    expect(isArrayType("Array<Object>")).toBe(true);
    expect(isArrayType("Array")).toBe(true);
    expect(isArrayType("String")).toBe(false);
    expect(arrayItemType("Array<Number>")).toBe("Number");
    expect(arrayItemType("String")).toBeNull();
  });
});

describe("semantic refinement", () => {
  test("infers meaning from the field name", () => {
    expect(refineStringType("email", VAR_TYPES.String)).toBe(VAR_TYPES.Email);
    expect(refineStringType("avatar", VAR_TYPES.String)).toBe(VAR_TYPES.Image);
    expect(refineStringType("thumbnail", VAR_TYPES.String)).toBe(VAR_TYPES.Image);
    expect(refineStringType("primaryColor", VAR_TYPES.String)).toBe(VAR_TYPES.Color);
    expect(refineStringType("slug", VAR_TYPES.String)).toBe(VAR_TYPES.URL);
    expect(refineStringType("description", VAR_TYPES.String)).toBe(VAR_TYPES.RichText);
    expect(refineStringType("title", VAR_TYPES.String)).toBe(VAR_TYPES.String);
  });

  test("only refines strings", () => {
    expect(refineStringType("email", VAR_TYPES.Number)).toBe(VAR_TYPES.Number);
  });
});

describe("compatibility (smart type validation)", () => {
  test("an image field accepts image-ish types only", () => {
    expect(isCompatible("image", VAR_TYPES.Image)).toBe(true);
    expect(isCompatible("image", VAR_TYPES.URL)).toBe(true);
    expect(isCompatible("image", VAR_TYPES.String)).toBe(true);
    expect(isCompatible("image", VAR_TYPES.Boolean)).toBe(false);
    expect(isCompatible("image", "Array<Reference>")).toBe(false);
    expect(isCompatible("image", VAR_TYPES.Object)).toBe(false);
  });

  test("a text field takes scalars but never arrays or objects", () => {
    expect(isCompatible("text", VAR_TYPES.String)).toBe(true);
    expect(isCompatible("text", VAR_TYPES.Number)).toBe(true);
    expect(isCompatible("text", VAR_TYPES.Email)).toBe(true);
    expect(isCompatible("text", VAR_TYPES.Date)).toBe(true);
    expect(isCompatible("text", "Array<Object>")).toBe(false);
    expect(isCompatible("text", VAR_TYPES.Object)).toBe(false);
  });

  test("a collection field only takes arrays", () => {
    expect(isCompatible("collection", "Array<Reference>")).toBe(true);
    expect(isCompatible("collection", VAR_TYPES.Array)).toBe(true);
    expect(isCompatible("collection", VAR_TYPES.String)).toBe(false);
  });

  test("a link field takes URLs and strings", () => {
    expect(isCompatible("link", VAR_TYPES.URL)).toBe(true);
    expect(isCompatible("link", VAR_TYPES.String)).toBe(true);
    expect(isCompatible("link", VAR_TYPES.Boolean)).toBe(false);
  });

  test("an unset variable type is never compatible", () => {
    expect(isCompatible("text", undefined)).toBe(false);
  });
});

describe("presentation", () => {
  test("every type has an icon and a colour", () => {
    for (const t of TYPE_LIST) {
      expect(typeIcon(t)).toBeTruthy();
      expect(typeColor(t)).toBeTruthy();
    }
    expect(typeIcon("Array<Reference>")).toBe(typeIcon(VAR_TYPES.Array));
  });

  test("every field kind declares what it accepts", () => {
    for (const [, accepts] of Object.entries(FIELD_ACCEPTS)) {
      expect(Array.isArray(accepts)).toBe(true);
      expect(accepts.length).toBeGreaterThan(0);
    }
  });
});

describe("runtime inference", () => {
  test("maps JS values onto the type system", () => {
    expect(inferTypeFromValue("x")).toBe(VAR_TYPES.String);
    expect(inferTypeFromValue(1)).toBe(VAR_TYPES.Number);
    expect(inferTypeFromValue(true)).toBe(VAR_TYPES.Boolean);
    expect(inferTypeFromValue([])).toBe(VAR_TYPES.Array);
    expect(inferTypeFromValue(new Date())).toBe(VAR_TYPES.DateTime);
    expect(inferTypeFromValue({})).toBe(VAR_TYPES.Object);
    expect(inferTypeFromValue(null)).toBe(VAR_TYPES.Null);
  });
});
