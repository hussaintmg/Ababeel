/**
 * The owner-managed training resources, described once.
 *
 * Entities need the same seven operations: list, create,
 * read, update, delete, reorder, duplicate.
 *
 * Server-only — it imports the models.
 */
import Course from "@/models/Course";
import CourseReference from "@/models/CourseReference";
import AwardingBody from "@/models/AwardingBody";
import CourseLevel from "@/models/CourseLevel";
import Accreditation from "@/models/Accreditation";
import RegistrationField from "@/models/RegistrationField";

const SEO_FIELDS = ["seo"];

export const RESOURCES = {
  courses: {
    label: "Courses",
    Model: Course,
    slugSource: "name",
    searchFields: ["name", "code", "shortDescription", "category"],
    defaultSort: { displayOrder: 1, name: 1 },
    populate: [
      { path: "level", select: "name slug color" },
      { path: "awardingBody", select: "name slug logo" },
    ],
    listSelect:
      "name code slug shortDescription featuredImage duration level awardingBody category featured displayOrder status updatedAt",
    fields: [
      "name",
      "code",
      "slug",
      "shortDescription",
      "description",
      "price",
      "currency",
      "currencySymbol",
      "currencyCode",
      "country",
      "featuredImage",
      "gallery",
      "duration",
      "durationDays",
      "level",
      "awardingBody",
      "category",
      "certificateImage",
      "certificationInfo",
      "courseContent",
      "learningOutcomes",
      "requirements",
      "whoShouldAttend",
      "faqs",
      "featured",
      "displayOrder",
      "status",
      ...SEO_FIELDS,
    ],
    required: ["name"],
    objectIdFields: ["level", "awardingBody"],
  },

  sessions: {
    label: "Course References",
    Model: CourseReference,
    searchFields: ["referenceName", "referenceCode", "location"],
    defaultSort: { startDate: -1 },
    populate: [{ path: "course", select: "name slug status" }],
    listSelect:
      "course referenceName referenceCode startDate endDate examDate mode modeLabel location status showInSchedule registrationsCount displayOrder updatedAt",
    fields: [
      "course",
      "referenceName",
      "referenceCode",
      "startDate",
      "endDate",
      "examDate",
      "registrationDeadline",
      "mode",
      "modeLabel",
      "location",
      "duration",
      "seats",
      "notes",
      "status",
      "showInSchedule",
      "displayOrder",
    ],
    required: ["course"],
    objectIdFields: ["course"],
    dateFields: ["startDate", "endDate", "examDate", "registrationDeadline"],
  },

  levels: {
    label: "Levels",
    Model: CourseLevel,
    slugSource: "name",
    searchFields: ["name", "description"],
    defaultSort: { displayOrder: 1, name: 1 },
    fields: ["name", "slug", "description", "icon", "image", "color", "status", "displayOrder"],
    required: ["name"],
  },

  "awarding-bodies": {
    label: "Awarding Bodies",
    Model: AwardingBody,
    slugSource: "name",
    searchFields: ["name", "shortName", "description"],
    defaultSort: { displayOrder: 1, name: 1 },
    fields: [
      "name",
      "slug",
      "shortName",
      "logo",
      "coverImage",
      "description",
      "accreditationInfo",
      "website",
      "status",
      "displayOrder",
      ...SEO_FIELDS,
    ],
    required: ["name"],
  },

  accreditations: {
    label: "Accreditations",
    Model: Accreditation,
    slugSource: "name",
    searchFields: ["name", "description", "referenceNumber"],
    defaultSort: { displayOrder: 1, name: 1 },
    fields: [
      "name",
      "slug",
      "logo",
      "image",
      "description",
      "details",
      "referenceNumber",
      "website",
      "showInTrustStrip",
      "status",
      "displayOrder",
    ],
    required: ["name"],
  },

  "registration-fields": {
    label: "Registration Form",
    Model: RegistrationField,
    searchFields: ["key", "label"],
    defaultSort: { displayOrder: 1 },
    fields: [
      "key",
      "label",
      "type",
      "placeholder",
      "helpText",
      "required",
      "enabled",
      "width",
      "options",
      "minLength",
      "maxLength",
      "pattern",
      "patternMessage",
      "bindTo",
      "displayOrder",
    ],
    required: ["key", "label"],
    protectDelete: (doc) => (doc?.system ? "Built-in fields can be disabled but not deleted" : ""),
    lockOnUpdate: ["key"],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);

export function getResource(key) {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key] : null;
}
