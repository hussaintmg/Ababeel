import mongoose from "mongoose";
import { SESSION_MODES, SESSION_STATUSES } from "@/lib/training/constants";

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
// The status lists live in lib/training/constants.js so client components can
// read them without importing this file — and with it Mongoose — into the
// browser bundle. Re-exported here so a model consumer has one import.
export {
  SESSION_MODES,
  SESSION_STATUSES,
  PUBLIC_SESSION_STATUSES,
  REGISTERABLE_SESSION_STATUSES,
} from "@/lib/training/constants";

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
