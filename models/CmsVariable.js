import mongoose from "mongoose";

/**
 * CmsVariable
 * -----------
 * Metadata *about* data — never a copy of it.
 *
 * Two kinds of document live here:
 *
 *  - `kind: "custom"`  a variable an owner defined by hand (site.name,
 *                      site.primaryColor …) together with its value.
 *  - `kind: "schema"`  an override/annotation for an automatically discovered
 *                      Mongoose field: a human description, plus the
 *                      `deprecated` flag the sync job sets when a field
 *                      disappears from the schema so existing pages warn
 *                      instead of silently breaking.
 */
const cmsVariableSchema = new mongoose.Schema(
  {
    // Full dotted variable name, e.g. "site.name" or "course.instructor.email".
    name: { type: String, required: true, unique: true, trim: true, index: true },
    kind: { type: String, enum: ["custom", "schema"], default: "custom", index: true },

    type: { type: String, default: "String" },
    // Source model for schema variables ("User", "Course"…), "" for custom.
    source: { type: String, default: "" },
    // Path inside that model ("profile.address.city").
    path: { type: String, default: "" },
    // Referenced model for Reference / Array<Reference> variables.
    ref: { type: String, default: "" },

    label: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "Custom Variables" },

    // Custom variables only.
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: "" },
    required: { type: Boolean, default: false },
    nullable: { type: Boolean, default: true },
    scope: { type: String, enum: ["global", "environment"], default: "global" },
    // Optional validation for custom variables: { pattern, min, max, options }
    validation: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Set by "Sync Models" when a previously discovered field is gone.
    deprecated: { type: Boolean, default: false },
    deprecatedAt: { type: Date, default: null },

    updatedByEmail: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

cmsVariableSchema.index({ kind: 1, category: 1 });

export default mongoose.models.CmsVariable ||
  mongoose.model("CmsVariable", cmsVariableSchema);
