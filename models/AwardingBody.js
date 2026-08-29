import mongoose from "mongoose";
import { SeoSchema, PUBLISH_STATUSES, slugify } from "@/lib/models/shared";

/**
 * AwardingBody
 * ------------
 * The organisation that awards the qualification a training course leads to
 * (SafQual, IOSH-style bodies, in-house accreditation…).
 *
 * Courses point at one of these, so renaming a body updates every course page
 * at once and the public /awarding-bodies/<slug> page can list its courses
 * without any duplicated text.
 */
const awardingBodySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Awarding body name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    shortName: { type: String, default: "", trim: true, maxlength: 60 },

    logo: { type: String, default: "", trim: true },
    coverImage: { type: String, default: "", trim: true },

    description: { type: String, default: "", trim: true, maxlength: 4000 },
    accreditationInfo: { type: String, default: "", trim: true, maxlength: 8000 },
    website: { type: String, default: "", trim: true },

    status: { type: String, enum: PUBLISH_STATUSES, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    seo: { type: SeoSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

awardingBodySchema.pre("validate", function ensureSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

awardingBodySchema.index({ status: 1, displayOrder: 1, name: 1 });

export default mongoose.models.AwardingBody ||
  mongoose.model("AwardingBody", awardingBodySchema);
