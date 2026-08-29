import {
  getSchemaRegistry,
  getModelDescriptor,
  flattenFields,
  clearSchemaRegistryCache,
} from "@/lib/cms/schemaRegistry";
import { isBlockedModel } from "@/lib/cms/fieldPolicy";
import "@/models/index";

/**
 * The catalogue models must be visible to the variables system, and the
 * personal ones must not be.
 *
 * Discovery is automatic — the registry walks `mongoose.models` — so this is
 * not testing code that was written for it. It is testing that registering the
 * models in the barrel was enough, and that the field policy still hides what
 * it should. Both are one edit away from being wrong, and neither fails loudly.
 */
beforeAll(() => {
  clearSchemaRegistryCache();
});

const paths = (modelName) => {
  const descriptor = getModelDescriptor(modelName);
  expect(descriptor).toBeTruthy();
  return [...flattenFields(descriptor.fields).keys()];
};

describe("the catalogue is available as variables", () => {
  test("every public model is discovered", () => {
    const names = getSchemaRegistry().map((m) => m.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "TrainingCourse",
        "CourseReferenceSession",
        "CourseLevel",
        "AwardingBody",
        "Accreditation",
        "Consultant",
        "TeamMember",
        "Testimonial",
      ]),
    );
  });

  test("a course exposes the fields templates need", () => {
    const p = paths("TrainingCourse");
    for (const field of [
      "name",
      "slug",
      "shortDescription",
      "description",
      "duration",
      "featuredImage",
      "certificateImage",
      "level",
      "awardingBody",
    ]) {
      expect(p).toContain(field);
    }
  });

  test("a course reaches through to its level and awarding body", () => {
    // {{trainingCourse.awardingBody.name}} — the reference is followed, so a
    // template does not have to be given the body separately.
    const p = paths("TrainingCourse");
    expect(p).toContain("level.name");
    expect(p).toContain("awardingBody.name");
    expect(p).toContain("awardingBody.logo");
  });

  test("a session exposes its dates and mode, and reaches its course", () => {
    const p = paths("CourseReferenceSession");
    for (const field of ["startDate", "endDate", "examDate", "mode", "showInSchedule", "status"]) {
      expect(p).toContain(field);
    }
    expect(p).toContain("course.name");
    expect(p).toContain("course.awardingBody.name");
  });

  test("people and reviews expose their display fields", () => {
    expect(paths("Consultant")).toEqual(
      expect.arrayContaining(["name", "position", "bio", "expertise", "profileImage"]),
    );
    expect(paths("TeamMember")).toEqual(expect.arrayContaining(["name", "position", "bio"]));
    expect(paths("Testimonial")).toEqual(
      expect.arrayContaining(["name", "reviewText", "rating", "company"]),
    );
  });
});

describe("personal data stays out of the variables system", () => {
  test("registrations and the form definition are not discoverable", () => {
    const names = getSchemaRegistry().map((m) => m.name);
    expect(names).not.toContain("Registration");
    expect(names).not.toContain("RegistrationField");
    expect(isBlockedModel("Registration")).toBe(true);
    expect(isBlockedModel("RegistrationField")).toBe(true);
  });

  test("a course exposes no field that could carry a price", () => {
    // The public catalogue deliberately holds no money. If a price field is
    // ever added to TrainingCourse, this fails and the decision gets revisited
    // rather than drifting in.
    const p = paths("TrainingCourse");
    for (const field of ["price", "currency", "currencySymbol", "currencyCode"]) {
      expect(p).not.toContain(field);
    }
  });
});
