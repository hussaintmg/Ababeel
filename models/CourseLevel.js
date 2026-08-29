import mongoose from "mongoose";
import { PUBLISH_STATUSES, slugify } from "@/lib/models/shared";

/**
 * CourseLevel
 * -----------
 * "Beginner", "Advanced", "Professional" — owner-managed rather than a hard
 * coded enum, so a new level can be introduced from the dashboard and every
 * course filter picks it up without a deploy.
 */
const courseLevelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Level name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    // A short emoji or lucide icon name; the renderer falls back to a dot.
    icon: { type: String, default: "", trim: true, maxlength: 60 },
    image: { type: String, default: "", trim: true },
    // Optional accent used by badges so levels read consistently site-wide.
    color: { type: String, default: "", trim: true, maxlength: 32 },

    status: { type: String, enum: PUBLISH_STATUSES, default: "published", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

courseLevelSchema.pre("validate", function ensureSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

courseLevelSchema.index({ status: 1, displayOrder: 1 });

export default mongoose.models.CourseLevel ||
  mongoose.model("CourseLevel", courseLevelSchema);
