/**
 * Enumerations shared by the models, the server rules and the browser.
 *
 * These live apart from the models on purpose. A card component needs to know
 * that "cancelled" is a session status; importing that from
 * `models/CourseReferenceSession` drags Mongoose — and with it the whole
 * MongoDB driver, OIDC helpers and Node built-ins — into the client bundle,
 * which fails the build outright.
 *
 * So: the values live here, and the models import them. Nothing in this file
 * may import anything that is not itself client-safe.
 */

/** Delivery modes a session can be run in. */
export const SESSION_MODES = ["online", "physical", "hybrid", "classroom", "blended", "in-house", "distance", "other"];

/**
 * Session lifecycle.
 */
export const SESSION_STATUSES = ["draft", "open", "active", "published", "scheduled", "closed", "cancelled", "completed", "full"];

/** Statuses a visitor may see on the public schedule. */
export const PUBLIC_SESSION_STATUSES = ["open", "active", "published", "scheduled", "closed", "cancelled", "completed", "full"];

/** Statuses that accept a new registration. */
export const REGISTERABLE_SESSION_STATUSES = ["open", "active", "published", "scheduled"];

/** Where a registration has got to. No payment state — there is no payment. */
export const REGISTRATION_STATUSES = [
  "pending",
  "contacted",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

/**
 * Publication state shared by every public entity.
 *
 * `draft` and `disabled` both keep the document off the public site; they are
 * distinct so an owner can tell "not finished yet" from "deliberately taken
 * down". Only `published` is ever served publicly.
 */
export const PUBLISH_STATUSES = ["draft", "published", "disabled"];

/** Course publication, which has `archived` in place of `disabled`. */
export const COURSE_STATUSES = ["draft", "published", "archived"];

/** Field types the CMS registration form builder offers. */
export const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "textarea",
  "file",
  "country",
];

/** Registration columns a form field may be bound to. */
export const BOUND_KEYS = ["", "firstName", "lastName", "email", "phone", "company", "country"];

/** Consultant profile layouts. */
export const CONSULTANT_LAYOUTS = [
  "image-left",
  "image-right",
  "carousel-left",
  "content-carousel-content",
  "featured",
];

/**
 * Resource kinds.
 *
 * Only types the existing media architecture can actually serve: an image or
 * PDF uploaded through the owner endpoint, or a link off-site. Nothing here
 * needs a viewer, a transcoder or a player the project does not have.
 */
export const RESOURCE_TYPES = [
  "article",
  "guide",
  "pdf",
  "download",
  "link",
  "announcement",
];

/** Human labels for the resource types, shared by the CMS and the public site. */
export const RESOURCE_TYPE_LABELS = {
  article: "Article",
  guide: "Guide",
  pdf: "PDF",
  download: "Download",
  link: "External link",
  announcement: "Announcement",
};
