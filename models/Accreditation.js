import mongoose from "mongoose";
import { PUBLISH_STATUSES, slugify } from "@/lib/models/shared";

/**
 * Accreditation
 * -------------
 * A credential Ababeel itself holds — memberships, approvals, registrations
 * — shown on /about/accreditations and as the trust logo strip.
 *
 * Distinct from `AwardingBody`, which is who awards a *learner's*
 * qualification. The two are often the same organisation and still play
 * different roles on the site, so an owner can list an approval without it
 * appearing as a choice when creating a course.
 */
const accreditationSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },

    logo: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },

    description: { type: String, default: "", trim: true, maxlength: 4000 },
    details: { type: String, default: "", trim: true, maxlength: 8000 },
    referenceNumber: { type: String, default: "", trim: true, maxlength: 120 },
    website: { type: String, default: "", trim: true },

    // Shown in the compact trust strip near the top of the home page.
    showInTrustStrip: { type: Boolean, default: true, index: true },

    status: { type: String, enum: PUBLISH_STATUSES, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

accreditationSchema.pre("validate", function ensureSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

accreditationSchema.index({ status: 1, displayOrder: 1 });

export default mongoose.models.Accreditation ||
  mongoose.model("Accreditation", accreditationSchema);
