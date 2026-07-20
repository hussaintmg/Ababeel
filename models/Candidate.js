// models/Candidate.js
import mongoose from "mongoose";

const CandidateSchema = new mongoose.Schema(
  {
    profile: {
      url: { type: String },
      publicId: { type: String },
    },
    traineeId: {
      type: String,
      required: [true, "trainee Id is required"],
      trim: true,
    },

    // Personal Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseReference",
      required: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    // Assessment Marks (max 50 each)
    assessmentMarks1: {
      type: Number,
      required: [true, "Assessment marks 1 is required"],
      min: [0, "Marks cannot be negative"],
      max: [50, "Assessment marks cannot exceed 50"],
    },
    assessmentMarks2: {
      type: Number,
      required: [true, "Assessment marks 2 is required"],
      min: [0, "Marks cannot be negative"],
      max: [50, "Assessment marks cannot exceed 50"],
    },
    certificateNumber: {
      type: String,
      required: [true, "Certificate number is required"],
    },
    marks: {
      type: Number,
      default: function () {
        // Sum of assessment marks (max 100)
        return this.assessmentMarks1 + this.assessmentMarks2;
      },
      min: [0, "Marks cannot be negative"],
      max: [100, "Marks cannot exceed 100"],
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["active", "inactive", "completed", "withdrawn"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for uniqueness within a course
CandidateSchema.index({ email: 1, courseId: 1 }, { unique: true });

// Pre-save middleware to calculate marks if not provided
CandidateSchema.pre("save", async function () {
  if (
    this.isModified("assessmentMarks1") ||
    this.isModified("assessmentMarks2")
  ) {
    this.marks = this.assessmentMarks1 + this.assessmentMarks2;
  }

  if (this.assessmentMarks1 > 50 || this.assessmentMarks2 > 50) {
    throw new Error("Assessment marks cannot exceed 50");
  }

  if (this.marks > 100) {
    throw new Error("Total marks cannot exceed 100");
  }
});

export default mongoose.models.Candidate ||
  mongoose.model("Candidate", CandidateSchema);
