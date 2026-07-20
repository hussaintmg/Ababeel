import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// A single CSS property-value pair used in static styling
const CssPropSchema = new mongoose.Schema(
  {
    property: { type: String, required: true }, // e.g. "font-size"
    value: { type: String, required: true }, // e.g. "16px"
  },
  { _id: false },
);

// One branch of a conditional script rule
// rule[0] = condition  { compare1, condition, compare2 }
// rule[1] = css result { property, value }
const ScriptConditionSchema = new mongoose.Schema(
  {
    compare1: { type: mongoose.Schema.Types.Mixed, default: "" }, // left operand (number or string)
    condition: { type: String, default: "" }, // ">", ">=", "<", "<=", "==", "!=", "" (default)
    compare2: { type: mongoose.Schema.Types.Mixed, default: "" }, // right operand
  },
  { _id: false },
);

const ScriptCssSchema = new mongoose.Schema(
  {
    property: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  { _id: false },
);

// Each script rule is stored as an array of exactly 2 items:
//   [ conditionObject, cssObject ]
// We model this as a wrapper document since Mongoose doesn't support
// arrays-of-arrays natively at schema level.
const ScriptRuleSchema = new mongoose.Schema(
  {
    condition: { type: ScriptConditionSchema, required: true },
    css: { type: [ScriptCssSchema], required: true },
  },
  { _id: false },
);

// A single element placed on a page (text or image)
const ElementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // Unique within page (nanoid / uuid)
    type: { type: String, enum: ["text", "image", "qr"], required: true },

    // Text elements
    text: { type: String, default: null }, // Can include {{placeholder}} syntax
    enableTextFormatting: { type: Boolean, default: false }, // ADD THIS
    maxWordsPerLine: { type: Number, default: 3 },

    // Image elements
    imageUrl: { type: String, default: null }, // base64 data URI or absolute path

    // Static CSS array  [{ property, value }, ...]
    css: { type: [CssPropSchema], default: [] },

    // Conditional script rules
    // Each rule: { condition: { compare1, condition, compare2 }, css: { property, value } }
    // Last rule should always have condition.condition === "" (default fallback)
    script: { type: [ScriptRuleSchema], default: [] },
  },
  { _id: false },
);

// Per-page PDF configuration (mirrors PdfConfig constructor options)
const PageConfigSchema = new mongoose.Schema(
  {
    format: {
      type: String,
      enum: ["A4", "A3", "A5", "LETTER", "LEGAL", "CUSTOM"],
      default: "A4",
    },
    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      default: "portrait",
    },
    customWidth: { type: Number, default: null },
    customHeight: { type: Number, default: null },
    widthUnit: { type: String, default: "px" },
    heightUnit: { type: String, default: "px" },
    margin: { type: Number, default: 0 },
    scale: { type: Number, default: 1 },
  },
  { _id: false },
);

// One page in the template
const PageSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true }, // 1-based
    config: { type: PageConfigSchema, default: () => ({}) },
    backgroundImage: { type: String, default: null }, // base64 data URI
    elements: { type: [ElementSchema], default: [] },
  },
  { _id: false },
);

// Top-level designData wrapper
const DesignDataSchema = new mongoose.Schema(
  {
    pages: { type: [PageSchema], default: [] },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEMPLATE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const TemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Course Certificate",
        "Course Id Card",
        "course-certificate",
        "course-id-card",
      ],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    // Full visual design — pages with per-page config + elements
    designData: {
      type: DesignDataSchema,
      default: () => ({ pages: [] }),
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto-managed
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// Fast lookup by type (used in getTemplatesByType)
TemplateSchema.index({ type: 1 });

// Only one active template per type is enforced at the application layer
// (setActiveTemplate deactivates others before activating the new one)
TemplateSchema.index({ type: 1, isActive: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const Template =
  mongoose.models.Template || mongoose.model("Template", TemplateSchema);

export default Template;
