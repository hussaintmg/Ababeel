import mongoose from "mongoose";

/**
 * Registration
 * ------------
 * An enquiry-to-enrol captured from the public site.
 *
 * **No payment.** A registration records who wants a seat; it takes no money,
 * stores no card, bank or wallet detail, and carries no payment status. The
 * boundary where a payment layer could later attach is described in
 * `lib/payments/provider.js`, and it is disabled.
 *
 * The link to the catalogue is by id (`course`, `session`), never by name, so
 * renaming a course leaves historical registrations correctly attached. The
 * `courseNameSnapshot` / `sessionNameSnapshot` fields are a human-readable
 * record of what the registrant actually saw at the time — used for display in
 * lists, never for the relationship itself.
 */
export const REGISTRATION_STATUSES = [
  "pending",
  "contacted",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

/** One entry from the CMS-configured form, kept verbatim. */
const SubmittedFieldSchema = new mongoose.Schema(
  {
    key: { type: String, default: "", trim: true },
    label: { type: String, default: "", trim: true },
    type: { type: String, default: "text", trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { _id: false },
);

/** An owner-only note on the registration. Never exposed publicly. */
const InternalNoteSchema = new mongoose.Schema(
  {
    body: { type: String, default: "", trim: true, maxlength: 4000 },
    authorEmail: { type: String, default: "", trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const registrationSchema = new mongoose.Schema(
  {
    // Short human reference shown to the registrant ("REG-8F3K2Q").
    reference: { type: String, required: true, unique: true, trim: true, index: true },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingCourse",
      required: true,
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseReferenceSession",
      default: null,
      index: true,
    },

    courseNameSnapshot: { type: String, default: "", trim: true },
    sessionNameSnapshot: { type: String, default: "", trim: true },

    // Promoted from the submitted form so lists, search and notifications do
    // not have to dig through `fields`.
    firstName: { type: String, default: "", trim: true, maxlength: 100 },
    lastName: { type: String, default: "", trim: true, maxlength: 100 },
    fullName: { type: String, default: "", trim: true, maxlength: 200, index: true },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 200, index: true },
    phone: { type: String, default: "", trim: true, maxlength: 60 },
    company: { type: String, default: "", trim: true, maxlength: 200 },
    country: { type: String, default: "", trim: true, maxlength: 100 },

    // Everything the CMS form collected, in the order it was presented.
    fields: { type: [SubmittedFieldSchema], default: [] },

    status: { type: String, enum: REGISTRATION_STATUSES, default: "pending", index: true },
    internalNotes: { type: [InternalNoteSchema], default: [] },

    // Provenance, for spam triage only.
    sourcePage: { type: String, default: "", trim: true, maxlength: 300 },

    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, minimize: false },
);

registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ status: 1, createdAt: -1 });
registrationSchema.index({ course: 1, session: 1, createdAt: -1 });

export default mongoose.models.Registration ||
  mongoose.model("Registration", registrationSchema);
