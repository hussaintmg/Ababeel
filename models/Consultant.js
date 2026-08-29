import mongoose from "mongoose";
import {
  SeoSchema,
  SocialLinkSchema,
  GalleryImageSchema,
  PUBLISH_STATUSES,
  slugify,
} from "@/lib/models/shared";

/**
 * Consultant
 * ----------
 * An expert profile with its own public page and a choice of editorial
 * layouts. `layout` is stored on the consultant rather than the page so a
 * profile keeps its presentation wherever it is rendered — the consultants
 * index, a home-page section, or its own page.
 */
export const CONSULTANT_LAYOUTS = [
  "image-left",
  "image-right",
  "carousel-left",
  "content-carousel-content",
  "featured",
];

const consultantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    position: { type: String, default: "", trim: true, maxlength: 200 },

    profileImage: { type: String, default: "", trim: true },
    gallery: { type: [GalleryImageSchema], default: [] },

    bio: { type: String, default: "", trim: true, maxlength: 20000 },
    qualifications: { type: String, default: "", trim: true, maxlength: 8000 },
    certifications: { type: String, default: "", trim: true, maxlength: 8000 },
    experience: { type: String, default: "", trim: true, maxlength: 8000 },
    // One area per line; rendered as chips.
    expertise: { type: String, default: "", trim: true, maxlength: 4000 },

    socialLinks: { type: [SocialLinkSchema], default: [] },

    layout: { type: String, enum: CONSULTANT_LAYOUTS, default: "image-left" },
    showCarousel: { type: Boolean, default: false },
    textAlign: { type: String, enum: ["left", "center"], default: "left" },
    animation: { type: String, default: "fade-up", trim: true, maxlength: 40 },

    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: PUBLISH_STATUSES, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    seo: { type: SeoSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

consultantSchema.pre("validate", function ensureSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

consultantSchema.index({ status: 1, displayOrder: 1 });

export default mongoose.models.Consultant || mongoose.model("Consultant", consultantSchema);
