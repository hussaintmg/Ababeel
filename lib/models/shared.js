/**
 * Sub-schemas shared by the public training-platform models.
 *
 * These live in `lib/` rather than `models/` on purpose: `models/` is walked by
 * the model barrel test, which expects every `.js` file there to be a
 * registered Mongoose model.
 */
import mongoose from "mongoose";

/**
 * Per-entity SEO. Every public entity carries the same four fields so the
 * page renderer can build metadata without knowing which model it holds.
 */
export const SeoSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    ogImage: { type: String, default: "", trim: true },
    keywords: { type: String, default: "", trim: true, maxlength: 300 },
    noIndex: { type: Boolean, default: false },
  },
  { _id: false },
);

/** One image in a gallery. `order` is what the CMS drag-reorder writes. */
export const GalleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 200 },
    caption: { type: String, default: "", trim: true, maxlength: 300 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

/** A social profile link on a person (team member or consultant). */
export const SocialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, default: "", trim: true, maxlength: 60 },
    url: { type: String, default: "", trim: true },
  },
  { _id: false },
);

/** A question/answer pair. Used by courses and by FAQ sections. */
export const FaqItemSchema = new mongoose.Schema(
  {
    question: { type: String, default: "", trim: true, maxlength: 300 },
    answer: { type: String, default: "", trim: true, maxlength: 4000 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

/**
 * Publication state shared by every public entity.
 *
 * `draft` and `disabled` both keep the document out of the public site; they
 * are distinct so an owner can tell "not finished yet" from "deliberately
 * taken down". Only `published` is ever served publicly.
 */
export const PUBLISH_STATUSES = ["draft", "published", "disabled"];

/** Statuses that make a document publicly visible. */
export const PUBLIC_STATUSES = ["published"];

/**
 * Turn a title into a URL slug. Deliberately conservative: lowercase ASCII,
 * digits and single hyphens, so a slug is always safe in a path segment.
 */
export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
