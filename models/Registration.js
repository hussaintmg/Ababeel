import mongoose from "mongoose";
import { REGISTRATION_STATUSES } from "@/lib/training/constants";

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
// Lives in lib/training/constants.js so the owner screens can import it
// without pulling Mongoose into the browser bundle.
export { REGISTRATION_STATUSES } from "@/lib/training/constants";

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
      refPath: "courseModel",
      required: true,
      index: true,
    },
    courseModel: {
      type: String,
      enum: ["TrainingCourse", "DefaultCourse"],
      default: "DefaultCourse",
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sessionModel",
      default: null,
      index: true,
    },
    sessionModel: {
      type: String,
      enum: ["CourseReferenceSession", "CourseReference"],
      default: "CourseReference",
    },

    courseNameSnapshot: { type: String, default: "", trim: true },
    sessionNameSnapshot: { type: String, default: "", trim: true },
    selectedMonth: { type: String, default: "", trim: true },
    receiptUrl: { type: String, default: "", trim: true },
    receiptName: { type: String, default: "", trim: true },

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
    enrolledCandidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null },

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
