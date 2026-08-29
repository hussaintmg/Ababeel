import mongoose from "mongoose";
import { SeoSchema, SocialLinkSchema, PUBLISH_STATUSES, slugify } from "@/lib/models/shared";

/**
 * TeamMember
 * ----------
 * Staff and leadership shown on /about/team.
 *
 * Kept separate from `Consultant` even though the fields overlap: the two are
 * managed by different people, appear on different pages with different
 * layouts, and a consultant carries a gallery and expertise areas a staff card
 * has no use for. Merging them would mean a "kind" flag and a form full of
 * fields that only apply half the time.
 */
const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    position: { type: String, default: "", trim: true, maxlength: 200 },

    profileImage: { type: String, default: "", trim: true },

    bio: { type: String, default: "", trim: true, maxlength: 8000 },
    qualifications: { type: String, default: "", trim: true, maxlength: 4000 },
    certifications: { type: String, default: "", trim: true, maxlength: 4000 },
    experience: { type: String, default: "", trim: true, maxlength: 4000 },

    email: { type: String, default: "", trim: true, maxlength: 200 },
    socialLinks: { type: [SocialLinkSchema], default: [] },

    // Leadership cards render larger and sort first.
    leadership: { type: Boolean, default: false, index: true },

    status: { type: String, enum: PUBLISH_STATUSES, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    seo: { type: SeoSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

teamMemberSchema.pre("validate", function ensureSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

teamMemberSchema.index({ status: 1, displayOrder: 1 });

export default mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);
