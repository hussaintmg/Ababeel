/**
 * Field exposure policy.
 *
 * The variable registry and the data-query engine both run every candidate
 * field through here. A blocked field is never discovered as a variable, never
 * projected out of MongoDB and never sent to a browser — so a CMS author
 * cannot bind `user.password` even by hand-typing the path.
 */

// Exact paths that must never leave the server, keyed by model name.
const BLOCKED_PATHS = {
  User: [
    "password",
    "resetCode",
    "resetCodeExpires",
    "resetToken",
    "resetTokenExpires",
    "authToken",
    "authTokenExpires",
    "stripeCustomerId",
    "transactions",
    "accountBalance",
  ],
  ActivationToken: ["token"],
  AuditLog: ["details", "ipAddress"],
  Invoice: ["transactions"],
  // A registration is a real person's contact details. The whole model is
  // blocked below; these are named as well so a future decision to expose
  // aggregate registration counts cannot leak the identities with them.
  Registration: [
    "email",
    "phone",
    "fields",
    "internalNotes",
    "firstName",
    "lastName",
    "fullName",
    "company",
    "sourcePage",
  ],
};

// Whole models that are never exposed to the public page runtime: credential
// stores, the audit trail, and the CMS's own configuration collections (a page
// must not be able to read the CMS's stored variable values or page sources).
const BLOCKED_MODELS = new Set([
  "ActivationToken",
  "AuditLog",
  "SiteContent",
  "CmsVariable",
  "CmsDataSource",
  "CmsFrameSequence",
  "CmsRegistryState",
  "RateLimit",
  // Registrations are personal data submitted by the public and are only ever
  // read through the authenticated owner APIs — never by a CMS page binding.
  "Registration",
  // The form definition is an owner tool; the public registration page reads it
  // through its own endpoint, which returns only the presentational fields.
  "RegistrationField",
]);

// Name patterns blocked on every model — belt and braces for models added later.
const BLOCKED_PATTERNS = [
  /password/i,
  /passwordhash/i,
  /(^|[._])salt$/i,
  /secret/i,
  /(^|[._])(access|refresh|auth|reset|private|api)[-_]?token/i,
  /^token$/i,
  /apikey/i,
  /api_key/i,
  /credential/i,
  /webhook.*secret/i,
  /(^|\.)__v$/,
  /privatekey/i,
  /sessionid/i,
  /otp$/i,
  /verificationcode/i,
];

// Public data allowlist: Models exposed to public visitors can only return these fields.
export const PUBLIC_FIELD_ALLOWLIST = {
  CourseReference: new Set([
    "_id", "title", "name", "courseName", "courseCode", "referenceNumber", "referenceCode", "sequenceId", "duration",
    "deliveryMode", "mode", "location", "seats", "totalSeats", "enrolledCount", "candidatesCount", "registrationsCount",
    "category", "description", "shortDescription",
    "thumbnail", "image", "badge", "level", "levelName", "instructor", "trainerName", "atcName", "awardingBody", "awardingBodyName",
    "modules", "discount", "vatRate", "isFeatured", "featured",
    "startDate", "endDate", "examDate", "status", "isPublished", "slug", "price", "coursePrice",
    "currencySymbol", "course", "createdAt"
  ]),
  Course: new Set([
    "_id", "courseName", "name", "title", "coursePrice", "price", "currency", "currencySymbol",
    "currencyCode", "country", "duration", "durationDays", "deliveryMode", "mode", "location",
    "category", "description", "shortDescription", "thumbnail", "image", "featuredImage",
    "gallery", "certificateImage", "certificationInfo", "courseContent", "learningOutcomes",
    "requirements", "whoShouldAttend", "faqs", "status", "isPublished", "slug", "code",
    "referenceNumber", "level", "awardingBody", "instructor", "accreditation", "featured",
    "displayOrder", "createdAt", "updatedAt"
  ]),
  CourseLevel: new Set([
    "_id", "name", "slug", "description", "icon", "image", "color", "status", "displayOrder", "createdAt"
  ]),
  AwardingBody: new Set([
    "_id", "name", "slug", "logo", "description", "website", "accreditations", "shortName", "coverImage", "status", "displayOrder", "createdAt"
  ]),
  Accreditation: new Set([
    "_id", "name", "slug", "logo", "description", "image", "details", "referenceNumber", "website", "status", "displayOrder", "createdAt"
  ]),
  User: new Set([
    "_id", "username", "firstName", "lastName", "avatar", "profileImage", "publicBio", "bio", "jobTitle"
  ]),
};

// Schema-backed public display fields. Financial/contact collections have no public contract.
const DISPLAY_FIELDS = {
  Course: 'currency currencySymbol summary syllabus learningOutcomes entryRequirements assessment certification deliveryModes displayOrder courseContent requirements whoShouldAttend faqs gallery certificateImage certificationInfo',
  CourseReference: 'courseName courseId registrationDeadline modeLabel showInSchedule currency',
  CourseLevel: '_id name slug description icon image color status displayOrder',
  Accreditation: 'image details referenceNumber website status displayOrder',
  AwardingBody: 'shortName coverImage status displayOrder',
};
for (const [model, fields] of Object.entries(DISPLAY_FIELDS)) {
 PUBLIC_FIELD_ALLOWLIST[model] ||= new Set();
 for(const field of fields.split(' ')) PUBLIC_FIELD_ALLOWLIST[model].add(field);
}

/**
 * Determine field visibility: "publicReadable" | "authenticatedReadable" | "private"
 */
export function getFieldVisibility(modelName, path) {
  if (isBlockedModel(modelName) || isBlockedField(modelName, path)) {
    return "private";
  }
  const rootKey = String(path || "").split(".")[0];
  const allowlist = PUBLIC_FIELD_ALLOWLIST[modelName];
  if (allowlist && allowlist.has(rootKey)) {
    return "publicReadable";
  }
  return "authenticatedReadable";
}

/**
 * Check if a field path is approved for public visitor queries
 */
export function isPublicReadableField(modelName, path) {
  return getFieldVisibility(modelName, path) === "publicReadable";
}

/** True when this whole model is off-limits to the CMS. */
export function isBlockedModel(modelName) {
  return BLOCKED_MODELS.has(modelName);
}

/**
 * True when `path` (dot notation, relative to the model root) must be hidden.
 * A blocked parent blocks all of its descendants.
 */
export function isBlockedField(modelName, path) {
  const p = String(path || "");
  if (!p) return false;

  const list = BLOCKED_PATHS[modelName] || [];
  for (const blocked of list) {
    if (p === blocked || p.startsWith(`${blocked}.`)) return true;
  }

  const segments = p.split(".");
  for (const seg of segments) {
    for (const re of BLOCKED_PATTERNS) {
      if (re.test(seg)) return true;
    }
  }
  return BLOCKED_PATTERNS.some((re) => re.test(p));
}

/**
 * Deep-strip anything the policy blocks from a plain document object.
 * When isPublic is true, also enforces PUBLIC_FIELD_ALLOWLIST.
 */
export function sanitizeDocument(modelName, doc, opts = {}) {
  const isPublic = typeof opts === "boolean" ? opts : opts.isPublic !== false;
  const prefix = typeof opts === "string" ? opts : opts.prefix || "";

  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map((d) => sanitizeDocument(modelName, d, { isPublic, prefix }));
  if (typeof doc !== "object") return doc;
  if (doc instanceof Date) return doc.toISOString();
  if (typeof doc.toHexString === "function") return doc.toHexString();
  if (isPublic && !PUBLIC_FIELD_ALLOWLIST[modelName]) return {};

  const allowlist = isPublic ? PUBLIC_FIELD_ALLOWLIST[modelName] : null;
  const out = {};

  for (const [key, value] of Object.entries(doc)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isBlockedField(modelName, path)) continue;

    // In public mode, enforce root allowlist if defined for this model
    if (allowlist && !prefix && !allowlist.has(key)) continue;

    out[key] =
      value && typeof value === "object" && !(value instanceof Date)
        ? sanitizeDocument(modelName, value, { isPublic, prefix: path })
        : value;
  }
  return out;
}

export const POLICY = { BLOCKED_PATHS, BLOCKED_MODELS, BLOCKED_PATTERNS, PUBLIC_FIELD_ALLOWLIST };
