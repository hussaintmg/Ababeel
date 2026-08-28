/**
 * Schema-based sample data — client-safe.
 *
 * Lets a page be designed before the database has any content, and gives the
 * builder something to render when Live Data is off. Values are derived from
 * the real discovered field names and types (and are deterministic, so the
 * preview does not shimmer on every keystroke).
 */
import { VAR_TYPES, isArrayType, arrayItemType } from "@/lib/cms/types";

const FIRST_NAMES = ["Hassan", "Aisha", "Daniel", "Priya", "Omar", "Sofia", "Liam", "Zara"];
const LAST_NAMES = ["Ali", "Khan", "Bennett", "Sharma", "Farouk", "Rossi", "Walker", "Ahmed"];
const TITLES = [
  "Working at Height Safety",
  "Fire Warden Essentials",
  "Manual Handling Level 2",
  "Confined Space Entry",
  "First Aid at Work",
  "Risk Assessment Fundamentals",
];
const SENTENCES = [
  "A practical, assessed programme built around real workplace scenarios.",
  "Delivered by experienced instructors and recognised across the industry.",
  "Covers legislation, hazard identification and safe systems of work.",
];
const COUNTRIES = ["United Kingdom", "United Arab Emirates", "Pakistan", "Ireland"];

// Small deterministic hash so the same field always gets the same sample value.
function seed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(list, key, index = 0) {
  return list[(seed(key) + index) % list.length];
}

const PLACEHOLDER_IMAGE = "/logo.png";

function sampleScalar(field, key, index) {
  const name = String(field?.name || "").toLowerCase();
  const type = field?.type;

  if (Array.isArray(field?.enumValues) && field.enumValues.length) {
    return field.enumValues[(seed(key) + index) % field.enumValues.length];
  }

  switch (type) {
    case VAR_TYPES.Email:
      return `${pick(FIRST_NAMES, key, index).toLowerCase()}.${pick(LAST_NAMES, key, index).toLowerCase()}@example.com`;
    case VAR_TYPES.Image:
      return PLACEHOLDER_IMAGE;
    case VAR_TYPES.Video:
      return "";
    case VAR_TYPES.Color:
      return ["#2563eb", "#0f172a", "#f59e0b", "#10b981"][(seed(key) + index) % 4];
    case VAR_TYPES.URL:
      return name.includes("slug")
        ? pick(TITLES, key, index).toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "https://example.com";
    case VAR_TYPES.RichText:
      return `<p>${pick(SENTENCES, key, index)}</p>`;
    case VAR_TYPES.Number: {
      if (/price|amount|total|balance|fee|subtotal/.test(name)) return 149 + ((seed(key) + index) % 8) * 50;
      if (/count|qty|quantity|marks|score/.test(name)) return 1 + ((seed(key) + index) % 20);
      return (seed(key) + index) % 100;
    }
    case VAR_TYPES.Boolean:
      return /is(active|published|default)|active|published|enabled/.test(name)
        ? true
        : (seed(key) + index) % 2 === 0;
    case VAR_TYPES.Date:
    case VAR_TYPES.DateTime: {
      const base = Date.UTC(2025, 0, 1);
      return new Date(base + ((seed(key) + index) % 300) * 86400000).toISOString();
    }
    case VAR_TYPES.JSON:
    case VAR_TYPES.Object:
      return {};
    case VAR_TYPES.String:
    default: {
      if (name === "_id" || name.endsWith("id")) return `sample${(seed(key) + index).toString(16).slice(0, 8)}`;
      if (/firstname/.test(name)) return pick(FIRST_NAMES, key, index);
      if (/lastname|surname/.test(name)) return pick(LAST_NAMES, key, index);
      if (/username|name$|^name/.test(name)) return `${pick(FIRST_NAMES, key, index)} ${pick(LAST_NAMES, key, index)}`;
      if (/title/.test(name)) return pick(TITLES, key, index);
      if (/country/.test(name)) return pick(COUNTRIES, key, index);
      if (/phone|contact|whatsapp/.test(name)) return "+44 20 7946 0000";
      if (/address/.test(name)) return "22 Kingsway, London WC2B 6LE";
      if (/currency$/.test(name)) return "GBP";
      if (/symbol/.test(name)) return "£";
      if (/description|message|bio|summary|about/.test(name)) return pick(SENTENCES, key, index);
      if (/status|role/.test(name)) return "active";
      return pick(TITLES, key, index);
    }
  }
}

function sampleField(field, keyPrefix, index, depth) {
  const key = `${keyPrefix}.${field.name}`;
  if (depth > 3) return null;

  if (field.isArray) {
    const itemType = field.itemType || arrayItemType(field.type);
    if (itemType === VAR_TYPES.Object || itemType === VAR_TYPES.Reference) {
      return Array.from({ length: 2 }, (_, i) => sampleObject(field.children, key, i, depth + 1));
    }
    return Array.from({ length: 2 }, (_, i) => sampleScalar({ ...field, type: itemType }, key, index + i));
  }

  if (field.type === VAR_TYPES.Reference || (field.type === VAR_TYPES.Object && field.children?.length)) {
    return sampleObject(field.children, key, index, depth + 1);
  }

  return sampleScalar(field, key, index);
}

function sampleObject(fields, keyPrefix, index = 0, depth = 0) {
  const out = {};
  for (const field of fields || []) {
    const value = sampleField(field, keyPrefix, index, depth);
    if (value !== null) out[field.name] = value;
  }
  return out;
}

/** One sample document for a model descriptor from the schema tree. */
export function sampleDocument(model, index = 0) {
  return sampleObject(model?.fields, `${model?.key || "doc"}${index}`, index, 0);
}

/**
 * A whole sample data context: every model gets a singular document and a
 * plural list, matching the names the variable registry exposes.
 */
export function buildSampleContext(schemaTree, { listSize = 3 } = {}) {
  const ctx = {};
  for (const model of schemaTree || []) {
    ctx[model.key] = sampleDocument(model, 0);
    ctx[model.collectionKey] = Array.from({ length: listSize }, (_, i) => sampleDocument(model, i));
  }
  return ctx;
}

/** Merge sample values in wherever live data is missing, never overwriting it. */
export function fillMissing(liveCtx, sampleCtx) {
  const out = { ...(sampleCtx || {}) };
  for (const [key, value] of Object.entries(liveCtx || {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}
