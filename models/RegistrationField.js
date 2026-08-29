import mongoose from "mongoose";
import { FIELD_TYPES, BOUND_KEYS } from "@/lib/training/constants";

// Re-exported so a consumer of the model has one import to reach for.
export { FIELD_TYPES, BOUND_KEYS };

/**
 * RegistrationField
 * -----------------
 * One field of the public registration form, owned by the CMS rather than the
 * code, so an owner can add "Emergency contact" without a deploy.
 *
 * The server rebuilds its validation from these documents on every submission —
 * the browser's copy is a convenience, never the authority.
 */

/**
 * Fields whose value is copied onto the registration's own columns. A field
 * bound to `email` fills `Registration.email`, which is what list search and
 * owner notifications read.
 */

const OptionSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true, maxlength: 200 },
    value: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { _id: false },
);

const registrationFieldSchema = new mongoose.Schema(
  {
    // Stable machine key; what `Registration.fields[].key` records.
    key: { type: String, required: true, unique: true, trim: true, maxlength: 60, index: true },
    label: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: FIELD_TYPES, default: "text" },

    placeholder: { type: String, default: "", trim: true, maxlength: 200 },
    helpText: { type: String, default: "", trim: true, maxlength: 500 },

    required: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true, index: true },
    // Half-width fields sit two-per-row on desktop; full-width span the form.
    width: { type: String, enum: ["half", "full"], default: "full" },

    options: { type: [OptionSchema], default: [] },

    // Server-side validation. `pattern` is compiled with a length cap and a
    // timeout-free anchor check so a bad CMS entry cannot hang a request.
    minLength: { type: Number, default: 0, min: 0 },
    maxLength: { type: Number, default: 0, min: 0 },
    pattern: { type: String, default: "", trim: true, maxlength: 200 },
    patternMessage: { type: String, default: "", trim: true, maxlength: 200 },

    bindTo: { type: String, enum: BOUND_KEYS, default: "" },

    // Built-in fields ship with the seed and may be disabled or relabelled but
    // not deleted, so the form can never lose its identity fields entirely.
    system: { type: Boolean, default: false },

    displayOrder: { type: Number, default: 0, index: true },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

registrationFieldSchema.index({ enabled: 1, displayOrder: 1 });

export default mongoose.models.RegistrationField ||
  mongoose.model("RegistrationField", registrationFieldSchema);
