import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: [true, "Name is required"] },
  email: { type: String, required: [true, "Email is required"], unique: true },
  password: { type: String, required: [true, "Password is required"] },
  role: {
    type: String,
    enum: ["user", "admin", "owner", "organization"],
    default: "user",
  },
  profileImage: {
    publicId: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  signature: {
    publicId: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  authenticatedEmail: { type: Boolean, default: false },
  authenticatedByOwner: { type: Boolean, default: false },
  resetCode: String,
  resetCodeExpires: Date,
  resetToken: String,
  resetTokenExpires: Date,
  authToken: String,
  authTokenExpires: Date,
  country: String,
  contact: String,
  address: String,
  atcDetails: {
    atcName: { type: String, default: "" },
    atcNumber: { type: String, default: "" },
    atcAddress: { type: String, default: "" },
  },
  accountBalance: { type: Number, default: 0 },
  stripeCustomerId: String,

  // ---- Organization fields ----
  // Organizations are Users with role === "organization" rather than a
  // separate collection: CourseReference.userId and Invoice.userId already
  // reference User, so this keeps organizations on the same identity that
  // courses, candidates, and invoices are attached to.
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  organizationDetails: {
    slug: { type: String, trim: true, lowercase: true },
    contactPerson: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
  },

  // ---- Creator attribution ----
  // Required for admin scoping: an admin may only manage the organizations
  // that admin created. Authorization keys off createdByUserId, never off a
  // name, email, or any browser-supplied value.
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdByRole: {
    type: String,
    enum: ["admin", "owner", null],
    default: null,
  },
  // Historical display value so creator attribution still renders after the
  // creating account is deleted or deactivated.
  createdByNameSnapshot: { type: String, default: "" },

  transactions: [
    {
      date: { type: Date, default: Date.now },
      type: {
        type: String,
        enum: ["deposit", "withdrawal", "payment", "refund"],
      },
      amount: { type: Number, required: true },
      description: String,
      referenceId: String,
      invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    },
  ],
}, { timestamps: true });

// Organization listings are scoped and sorted by these.
userSchema.index({ role: 1, createdByUserId: 1 });
userSchema.index({ createdAt: -1 });
// Organization slugs are unique when present; `sparse` keeps every non-
// organization user (which has no slug) out of the index.
userSchema.index({ "organizationDetails.slug": 1 }, { unique: true, sparse: true });

// ✅ Next.js hot reload safe model
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
