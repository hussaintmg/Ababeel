import mongoose from "mongoose";

/**
 * CmsCustomSection
 * ----------------
 * Stores user-developed section templates created via the Section Code Studio (SDK).
 * These become reusable templates in the "Browse Sections" library, with editable
 * variable fields in the left sidebar BlockEditor, scoped CSS, and runtime animations.
 */
const cmsCustomSectionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Custom Sections",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    code: {
      type: String,
      default: "",
    },
    css: {
      type: String,
      default: "",
    },
    fields: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, default: "" },
          type: { type: String, default: "text" },
          default: { type: mongoose.Schema.Types.Mixed, default: "" },
          options: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        enableGsap: false,
        enableFramer: true,
        enableTailwind: true,
        font: "",
      },
    },
    defaultProps: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previewHtml: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CmsCustomSection ||
  mongoose.model("CmsCustomSection", cmsCustomSectionSchema);
