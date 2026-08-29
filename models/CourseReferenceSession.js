import mongoose from "mongoose";

/**
 * CourseReferenceSession — the public "course reference".
 *
 * A `TrainingCourse` is evergreen ("Advanced Safety Practitioner"); this is one
 * dated intake of it ("ASP — September 2026"), which is what a visitor sees on
 * the schedule and what a registration is attached to.
 *
 * Named `CourseReferenceSession` because `CourseReference` already exists and
 * means something else entirely: the partner/ATC booking batch that owns
 * candidates, an invoice and a payment status. The two must not be merged —
 * this one is public marketing/enrolment data with no money in it.
 */
export const SESSION_MODES = ["online", "physical", "hybrid", "other"];

/**
 * Session lifecycle.
 *  - draft      not on the public site at all
 *  - open       listed, and accepting registrations
 *  - closed     listed, but the register button becomes "Registration Closed"
 *  - cancelled  listed as cancelled; registration refused
 *  - completed  historical; kept for the registrations that point at it
 */
export const SESSION_STATUSES = ["draft", "open", "closed", "cancelled", "completed"];

/** Statuses a visitor may see on the public schedule. */
export const PUBLIC_SESSION_STATUSES = ["open", "closed", "cancelled", "completed"];

/** Statuses that accept a new registration. */
export const REGISTERABLE_SESSION_STATUSES = ["open"];

const courseReferenceSessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingCourse",
      required: [true, "A session must belong to a course"],
      index: true,
    },

    // "ASP — September 2026". Falls back to the course name + month in the UI
    // when left empty.
    referenceName: { type: String, default: "", trim: true, maxlength: 200 },
    // Optional human code shown to registrants, e.g. "ASP-2026-09".
    referenceCode: { type: String, default: "", trim: true, maxlength: 60, index: true },

    startDate: { type: Date, default: null, index: true },
    endDate: { type: Date, default: null },
    examDate: { type: Date, default: null },
    registrationDeadline: { type: Date, default: null },

    mode: { type: String, enum: SESSION_MODES, default: "online", index: true },
    // Shown instead of the mode label when mode is "other" (or to add detail
    // such as "Online — evenings, GMT+5").
    modeLabel: { type: String, default: "", trim: true, maxlength: 120 },

    location: { type: String, default: "", trim: true, maxlength: 200 },
    // Overrides the course duration for this intake only when set.
    duration: { type: String, default: "", trim: true, maxlength: 100 },
    seats: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 2000 },

    status: { type: String, enum: SESSION_STATUSES, default: "draft", index: true },

    /**
     * Public schedule visibility. Separate from `status` so an owner can take a
     * session off the schedule without cancelling it or deleting the record
     * (and the registrations pointing at it).
     */
    showInSchedule: { type: Boolean, default: true, index: true },

    registrationsCount: { type: Number, default: 0, min: 0 },
    displayOrder: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

courseReferenceSessionSchema.index({ status: 1, showInSchedule: 1, startDate: 1 });
courseReferenceSessionSchema.index({ course: 1, startDate: 1 });

export default mongoose.models.CourseReferenceSession ||
  mongoose.model("CourseReferenceSession", courseReferenceSessionSchema);
