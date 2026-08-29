import mongoose from "mongoose";
import { PUBLISH_STATUSES } from "@/lib/models/shared";

/**
 * Testimonial
 * -----------
 * Reviews entered by hand in the CMS. There is no Google Reviews integration
 * and no external API call anywhere in this model's path: `sourceLogo` and
 * `verifiedLabel` exist so a manually transcribed review can be presented in a
 * familiar review-card style and be honest about where it came from.
 */
const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
      maxlength: 200,
    },
    profileImage: { type: String, default: "", trim: true },

    reviewText: { type: String, default: "", trim: true, maxlength: 4000 },
    rating: { type: Number, default: 5, min: 0, max: 5 },

    company: { type: String, default: "", trim: true, maxlength: 200 },
    position: { type: String, default: "", trim: true, maxlength: 200 },

    reviewDate: { type: Date, default: null },

    // e.g. a Google mark the owner uploaded, shown beside the review.
    sourceLogo: { type: String, default: "", trim: true },
    sourceName: { type: String, default: "", trim: true, maxlength: 100 },
    // "Verified review", "Collected on request"… free text, shown as a chip.
    verifiedLabel: { type: String, default: "", trim: true, maxlength: 100 },
    sourceUrl: { type: String, default: "", trim: true },

    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: PUBLISH_STATUSES, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

testimonialSchema.index({ status: 1, displayOrder: 1, createdAt: -1 });

export default mongoose.models.Testimonial ||
  mongoose.model("Testimonial", testimonialSchema);
