import mongoose from "mongoose";

const activationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    used: {
      type: Boolean,
      default: false,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// `token` already declares `unique: true` on the path, which creates the
// token_1 index. Declaring it again here produced a conflicting definition
// under the same auto-generated name and failed index creation.
activationTokenSchema.index({ userId: 1 });

export default mongoose.models.ActivationToken ||
  mongoose.model("ActivationToken", activationTokenSchema);
