import mongoose from "mongoose";
import {
  SeoSchema,
  GalleryImageSchema,
  FaqItemSchema,
  slugify,
} from "@/lib/models/shared";

/**
 * TrainingCourse
 * --------------
 * The public training catalogue.
 *
 * Deliberately separate from `Course` and `DefaultCourse`, which are the
 * partner/ATC commercial records: those carry price, currency and country
 * because they drive `CourseReference` bookings, invoices and deposits.
 * Marketing content has no business inside a billing record, and stripping
 * price out of `Course` would break invoicing — so the public catalogue is its
 * own model and carries **no price or currency at all**. Payment is out of
 * scope for the public site; see `lib/payments/provider.js`.
 *
 * A course is the evergreen description ("Advanced Safety Practitioner").
 * The dated intakes people actually register for are `CourseReferenceSession`.
 */
const trainingCourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      maxlength: [200, "Course name cannot exceed 200 characters"],
    },
    code: { type: String, default: "", trim: true, maxlength: 40, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },

    shortDescription: { type: String, default: "", trim: true, maxlength: 500 },
    description: { type: String, default: "", trim: true, maxlength: 20000 },

    featuredImage: { type: String, default: "", trim: true },
    gallery: { type: [GalleryImageSchema], default: [] },

    // Free text ("5 days", "40 hours") because providers describe duration in
    // whatever unit suits the course; `durationDays` is the sortable/filterable
    // companion and may be left at 0 when it does not apply.
    duration: { type: String, default: "", trim: true, maxlength: 100 },
    durationDays: { type: Number, default: 0, min: 0 },

    level: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLevel", default: null, index: true },
    awardingBody: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AwardingBody",
      default: null,
      index: true,
    },
    category: { type: String, default: "", trim: true, maxlength: 100, index: true },

    /**
     * Optional. When empty the public page falls back to the default
     * certificate configured in site settings — see
     * `lib/training/certificate.js`.
     */
    certificateImage: { type: String, default: "", trim: true },
    certificationInfo: { type: String, default: "", trim: true, maxlength: 4000 },

    // Long-form sections. Stored as HTML from the CMS rich-text editor and
    // rendered through the same sanitiser the page builder uses.
    courseContent: { type: String, default: "", trim: true, maxlength: 30000 },
    learningOutcomes: { type: String, default: "", trim: true, maxlength: 20000 },
    requirements: { type: String, default: "", trim: true, maxlength: 20000 },
    whoShouldAttend: { type: String, default: "", trim: true, maxlength: 20000 },

    faqs: { type: [FaqItemSchema], default: [] },

    featured: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0, index: true },

    /**
     * `archived` is kept distinct from `draft`: an archived course has run in
     * the past and still has registrations pointing at it, so it must never be
     * deleted just to take it off the site.
     */
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    seo: { type: SeoSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

trainingCourseSchema.pre("validate", function ensureSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

trainingCourseSchema.index({ status: 1, displayOrder: 1, name: 1 });
trainingCourseSchema.index({ status: 1, featured: -1 });
trainingCourseSchema.index({ name: "text", shortDescription: "text", code: "text" });

export default mongoose.models.TrainingCourse ||
  mongoose.model("TrainingCourse", trainingCourseSchema);
