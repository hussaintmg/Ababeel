import mongoose from "mongoose";

const CourseReferenceSchema = new mongoose.Schema({
  //User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Basic course info
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  coursePrice: { type: Number, required: true },
  currencySymbol: { type: String, default: "£" },

  // Course duration and dates
  validity: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  expiryDate: { type: Date },

  // Trainer info — the trainer feature was removed, so these are optional and
  // retained only so legacy documents keep validating.
  trainerId: { type: String, default: "" },
  trainerName: { type: String, default: "" },

  // ATC info
  atcName: { type: String, default: "" },
  atcNumber: { type: String, default: "" },
  atcAddress: { type: String, default: "" },

  // Country info
  country: { type: String, required: true },

  // Reference numbers
  referenceNumber: { type: String, required: true, unique: true },
  sequenceId: { type: String, required: true },

  // Candidates and payment
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }],
  candidatesCount: { type: Number, default: 0 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },

  // Status and metadata
  status: {
    type: String,
    enum: ["draft", "pending_payment", "active", "completed", "cancelled"],
    default: "draft",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.CourseReference ||
  mongoose.model("CourseReference", CourseReferenceSchema);
