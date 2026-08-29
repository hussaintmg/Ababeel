/**
 * The owner-managed training resources, described once.
 *
 * Ten entities (courses, sessions, levels, awarding bodies, people,
 * testimonials, form fields) need the same seven operations: list, create,
 * read, update, delete, reorder, duplicate. Writing seven route handlers per
 * entity would be seventy near-identical files, and the drift between them is
 * exactly where an authorisation check or a field whitelist goes missing.
 *
 * So each entity is a row here, and `lib/training/ownerCrud.js` turns a row
 * into handlers. `fields` is a strict whitelist: a key that is not listed can
 * never be written, however the request is shaped, which is what stops a
 * crafted PATCH from setting `createdBy` or a Mongo operator.
 *
 * Server-only — it imports the models.
 */
import TrainingCourse from "@/models/TrainingCourse";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import AwardingBody from "@/models/AwardingBody";
import CourseLevel from "@/models/CourseLevel";
import Testimonial from "@/models/Testimonial";
import TeamMember from "@/models/TeamMember";
import Consultant from "@/models/Consultant";
import Accreditation from "@/models/Accreditation";
import RegistrationField from "@/models/RegistrationField";

const SEO_FIELDS = ["seo"];

export const RESOURCES = {
  courses: {
    label: "Courses",
    Model: TrainingCourse,
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
    // Emptying these would leave a course with no title on its own page.
    required: ["name"],
    objectIdFields: ["level", "awardingBody"],
  },

  sessions: {
    label: "Course References",
    Model: CourseReferenceSession,
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

  testimonials: {
    label: "Testimonials",
    Model: Testimonial,
    searchFields: ["name", "company", "reviewText"],
    defaultSort: { displayOrder: 1, createdAt: -1 },
    fields: [
      "name",
      "profileImage",
      "reviewText",
      "rating",
      "company",
      "position",
      "reviewDate",
      "sourceLogo",
      "sourceName",
      "verifiedLabel",
      "sourceUrl",
      "featured",
      "status",
      "displayOrder",
    ],
    required: ["name"],
    dateFields: ["reviewDate"],
  },

  team: {
    label: "Team Members",
    Model: TeamMember,
    slugSource: "name",
    searchFields: ["name", "position"],
    defaultSort: { displayOrder: 1, name: 1 },
    fields: [
      "name",
      "slug",
      "position",
      "profileImage",
      "bio",
      "qualifications",
      "certifications",
      "experience",
      "email",
      "socialLinks",
      "leadership",
      "status",
      "displayOrder",
      ...SEO_FIELDS,
    ],
    required: ["name"],
  },

  consultants: {
    label: "Consultants",
    Model: Consultant,
    slugSource: "name",
    searchFields: ["name", "position", "expertise"],
    defaultSort: { displayOrder: 1, name: 1 },
    fields: [
      "name",
      "slug",
      "position",
      "profileImage",
      "gallery",
      "bio",
      "qualifications",
      "certifications",
      "experience",
      "expertise",
      "socialLinks",
      "layout",
      "showCarousel",
      "textAlign",
      "animation",
      "featured",
      "status",
      "displayOrder",
      ...SEO_FIELDS,
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
    // A system field is part of the form's identity: it can be relabelled or
    // switched off, but deleting it would silently stop the form collecting
    // the details every registration is acted on by.
    protectDelete: (doc) => (doc?.system ? "Built-in fields can be disabled but not deleted" : ""),
    // Its key is what past submissions recorded, so it must not move.
    lockOnUpdate: ["key"],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);

export function getResource(key) {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key] : null;
}
