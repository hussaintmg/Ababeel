/**
 * CMS variable type system — client-safe (no mongoose, no DB).
 *
 * Every variable discovered from a Mongoose schema (or defined by hand) is
 * tagged with one of these types. The Page Builder uses the type to decide
 * which variables may be bound to which block property, and the renderer uses
 * it to format values sensibly.
 */

export const VAR_TYPES = {
  String: "String",
  Number: "Number",
  Boolean: "Boolean",
  Date: "Date",
  DateTime: "DateTime",
  Image: "Image",
  Video: "Video",
  URL: "URL",
  Email: "Email",
  Color: "Color",
  RichText: "RichText",
  Object: "Object",
  Array: "Array",
  Reference: "Reference",
  JSON: "JSON",
  Null: "Null",
  Unknown: "Unknown",
};

export const TYPE_LIST = Object.keys(VAR_TYPES);

// Array<X> composite label used in the UI and in export files.
export function arrayTypeLabel(itemType) {
  return itemType ? `Array<${itemType}>` : "Array";
}

export function isArrayType(type) {
  return type === VAR_TYPES.Array || /^Array</.test(String(type || ""));
}

export function arrayItemType(type) {
  const m = /^Array<(.+)>$/.exec(String(type || ""));
  return m ? m[1] : null;
}

/** Emoji icon per type — used for the visual variable tokens/chips. */
export const TYPE_ICON = {
  String: "🔤",
  Number: "🔢",
  Boolean: "🔘",
  Date: "📅",
  DateTime: "🕒",
  Image: "🖼",
  Video: "🎬",
  URL: "🔗",
  Email: "✉",
  Color: "🎨",
  RichText: "📝",
  Object: "📦",
  Array: "📚",
  Reference: "🔗",
  JSON: "🧩",
  Null: "∅",
  Unknown: "❓",
};

export function typeIcon(type) {
  if (isArrayType(type)) return TYPE_ICON.Array;
  return TYPE_ICON[type] || TYPE_ICON.Unknown;
}

/** Tailwind chip colours per type, for the builder UI. */
export const TYPE_COLOR = {
  String: "bg-slate-100 text-slate-700 border-slate-200",
  Number: "bg-amber-100 text-amber-800 border-amber-200",
  Boolean: "bg-purple-100 text-purple-700 border-purple-200",
  Date: "bg-cyan-100 text-cyan-800 border-cyan-200",
  DateTime: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Image: "bg-pink-100 text-pink-700 border-pink-200",
  Video: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  URL: "bg-blue-100 text-blue-700 border-blue-200",
  Email: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Color: "bg-rose-100 text-rose-700 border-rose-200",
  RichText: "bg-teal-100 text-teal-800 border-teal-200",
  Object: "bg-gray-100 text-gray-700 border-gray-200",
  Array: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Reference: "bg-blue-100 text-blue-700 border-blue-200",
  JSON: "bg-gray-100 text-gray-700 border-gray-200",
  Null: "bg-gray-100 text-gray-500 border-gray-200",
  Unknown: "bg-gray-100 text-gray-500 border-gray-200",
};

export function typeColor(type) {
  if (isArrayType(type)) return TYPE_COLOR.Array;
  return TYPE_COLOR[type] || TYPE_COLOR.Unknown;
}

/**
 * Which variable types a given block-field kind will accept. Used by the
 * variable picker (greys out incompatible variables) and by drag-and-drop
 * (rejects an invalid drop instead of silently creating a broken binding).
 */
export const FIELD_ACCEPTS = {
  text: [
    VAR_TYPES.String, VAR_TYPES.Number, VAR_TYPES.Email, VAR_TYPES.Date,
    VAR_TYPES.DateTime, VAR_TYPES.URL, VAR_TYPES.Boolean, VAR_TYPES.Color,
  ],
  textarea: [
    VAR_TYPES.String, VAR_TYPES.Number, VAR_TYPES.Email, VAR_TYPES.Date,
    VAR_TYPES.DateTime, VAR_TYPES.RichText,
  ],
  richtext: [VAR_TYPES.RichText, VAR_TYPES.String],
  code: [VAR_TYPES.String, VAR_TYPES.RichText],
  image: [VAR_TYPES.Image, VAR_TYPES.URL, VAR_TYPES.String],
  video: [VAR_TYPES.Video, VAR_TYPES.URL, VAR_TYPES.String],
  color: [VAR_TYPES.Color, VAR_TYPES.String],
  select: [VAR_TYPES.String, VAR_TYPES.Number],
  link: [VAR_TYPES.URL, VAR_TYPES.String],
  boolean: [VAR_TYPES.Boolean],
  number: [VAR_TYPES.Number, VAR_TYPES.String],
  collection: [VAR_TYPES.Array],
};

/**
 * True when `varType` may be bound into a field of kind `fieldType`.
 * A null/undefined `fieldType` means "no constraint" — used by the standalone
 * variable browser and the condition builder, which accept any type.
 */
export function isCompatible(fieldType, varType) {
  if (!varType) return false;
  if (!fieldType) return true;
  const accepts = FIELD_ACCEPTS[fieldType] || FIELD_ACCEPTS.text;
  if (isArrayType(varType)) return accepts.includes(VAR_TYPES.Array);
  return accepts.includes(varType);
}

const IMAGE_HINTS = /^(avatar|photo|image|img|thumbnail|thumb|picture|logo|icon|banner|cover|profileimage)$/i;
const VIDEO_HINTS = /^(video|videourl|clip|movie|mp4)$/i;
const URL_HINTS = /(^|[a-z])(url|href|link|website|slug)$/i;
const COLOR_HINTS = /(color|colour)$/i;
const RICH_HINTS = /^(html|richtext|body|content|bio|description|message|about)$/i;
const EMAIL_HINTS = /email$/i;

/**
 * Refine a coarse base type ("String") into a semantic one ("Email", "Image")
 * using the field's name. Purely a UX nicety — the value is still a string.
 */
export function refineStringType(fieldName, baseType) {
  if (baseType !== VAR_TYPES.String) return baseType;
  const n = String(fieldName || "");
  if (EMAIL_HINTS.test(n)) return VAR_TYPES.Email;
  if (IMAGE_HINTS.test(n)) return VAR_TYPES.Image;
  if (VIDEO_HINTS.test(n)) return VAR_TYPES.Video;
  if (COLOR_HINTS.test(n)) return VAR_TYPES.Color;
  if (URL_HINTS.test(n)) return VAR_TYPES.URL;
  if (RICH_HINTS.test(n)) return VAR_TYPES.RichText;
  return VAR_TYPES.String;
}

/** Best-effort type of a runtime JS value (used for custom vars and previews). */
export function inferTypeFromValue(value) {
  if (value === null || value === undefined) return VAR_TYPES.Null;
  if (Array.isArray(value)) return VAR_TYPES.Array;
  if (value instanceof Date) return VAR_TYPES.DateTime;
  switch (typeof value) {
    case "string":
      return VAR_TYPES.String;
    case "number":
      return VAR_TYPES.Number;
    case "boolean":
      return VAR_TYPES.Boolean;
    case "object":
      return VAR_TYPES.Object;
    default:
      return VAR_TYPES.Unknown;
  }
}
