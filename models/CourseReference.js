import mongoose from "mongoose";

const CourseReferenceSchema = new mongoose.Schema({
  // Organization / User owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Link to Course model
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DefaultCourse",
    default: null,
    index: true,
  },
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  coursePrice: { type: Number, default: 0 },
  currencySymbol: { type: String, default: "£" },

  // Reference identifiers
  referenceName: { type: String, default: "", trim: true },
  referenceCode: { type: String, default: "", trim: true },
  referenceNumber: { type: String, required: true, unique: true, index: true },
  sequenceId: { type: String, required: true },

  // Dates & Schedule
  startDate: { type: Date, index: true },
  endDate: { type: Date },
  examDate: { type: Date },
  registrationDeadline: { type: Date },
  validity: { type: String },
  expiryDate: { type: Date },

  // Delivery Details
  mode: {
    type: String,
    enum: ["online", "classroom", "blended", "in-house", "distance"],
    default: "online",
  },
  modeLabel: { type: String, default: "", trim: true },
  location: { type: String, default: "Online", trim: true },
  duration: { type: String, default: "", trim: true },
  seats: { type: Number, default: 20 },
  notes: { type: String, default: "", trim: true },

  // Public Visibility on Website Schedule & Course Pages
  showInSchedule: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Trainer & ATC info (legacy and metadata)
  trainerId: { type: String, default: "" },
  trainerName: { type: String, default: "" },
  atcName: { type: String, default: "" },
  atcNumber: { type: String, default: "" },
  atcAddress: { type: String, default: "" },
  country: { type: String, default: "United Kingdom" },

  // Candidates and payment
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }],
  candidatesCount: { type: Number, default: 0 },
  registrationsCount: { type: Number, default: 0 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },

  // Status and metadata
  status: {
    type: String,
    enum: ["draft", "pending_payment", "active", "completed", "cancelled", "full"],
    default: "active",
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CourseReferenceSchema.index({ showInSchedule: 1, status: 1, startDate: 1 });

export default mongoose.models.CourseReference ||
  mongoose.model("CourseReference", CourseReferenceSchema);
