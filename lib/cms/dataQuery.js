/**
 * Secure data query engine.
 *
 * The only path from a CMS page to MongoDB. Everything a page author can
 * configure — model, filters, sort, limit, populate — is validated against the
 * discovered schema registry and the field exposure policy before a query is
 * built, and results are stripped again on the way out. CMS content can never
 * express a raw Mongo query, a `$where`, or a projection of a private field.
 *
 * Server-only.
 */
import mongoose from "mongoose";
import connectDB from "@/utils/db";
import "@/models/index";
import { getModelDescriptor, isQueryableField, getSchemaRegistry } from "@/lib/cms/schemaRegistry";
import { isBlockedField, isBlockedModel, sanitizeDocument } from "@/lib/cms/fieldPolicy";
import { resolveTemplate, isDynamic } from "@/lib/cms/expression";

export const MAX_LIMIT = 200;
export const DEFAULT_LIMIT = 12;

/** Filter operators an author may pick, and how each maps onto Mongo. */
export const FILTER_OPS = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "in", label: "is one of" },
  { value: "notIn", label: "is not one of" },
  { value: "exists", label: "exists" },
  { value: "notExists", label: "does not exist" },
];

const OP_VALUES = new Set(FILTER_OPS.map((o) => o.value));

/** Models a CMS page may query. */
export function allowedModels() {
  return getSchemaRegistry().map((m) => ({
    name: m.name,
    label: m.label,
    key: m.key,
    collectionKey: m.collectionKey,
  }));
}

export function isAllowedModel(name) {
  return !!name && !isBlockedModel(name) && !!getModelDescriptor(name);
}

// Escape a user string before it becomes a RegExp — a CMS author must not be
// able to write a catastrophic backtracking pattern.
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function coerce(modelName, field, raw) {
  const model = mongoose.models[modelName];
  const schemaType = model?.schema?.path(field);
  const instance = schemaType?.instance;
  if (raw === null || raw === undefined) return raw;

  switch (instance) {
    case "Number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    case "Boolean":
      if (typeof raw === "boolean") return raw;
      if (raw === "true") return true;
      if (raw === "false") return false;
      return undefined;
    case "Date": {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    case "ObjectID":
    case "ObjectId":
      return mongoose.isValidObjectId(raw) ? new mongoose.Types.ObjectId(String(raw)) : undefined;
    default:
      return typeof raw === "object" ? String(raw) : raw;
  }
}

/**
 * Turn a validated filter list into a Mongo filter object.
 * Unknown fields, unknown operators and blocked fields are dropped silently —
 * the query still runs, it just cannot be widened by bad input.
 */
export function buildMongoFilter(modelName, filters, ctx = {}, match = "all") {
  const clauses = [];
  for (const f of Array.isArray(filters) ? filters : []) {
    const field = String(f?.field || "").trim();
    const op = String(f?.op || "equals");
    if (!field || !OP_VALUES.has(op)) continue;
    if (!isQueryableField(modelName, field)) continue;
    if (isBlockedField(modelName, field)) continue;

    let raw = f?.value;
    if (typeof raw === "string" && isDynamic(raw)) raw = resolveTemplate(raw, ctx);
    if (f?.dynamic && typeof raw === "string" && !isDynamic(f.value)) {
      // A plain path stored with dynamic:true, e.g. "params.slug".
      raw = resolveTemplate(`{{${raw}}}`, ctx);
    }

    if (op === "exists") {
      clauses.push({ [field]: { $exists: true, $ne: null } });
      continue;
    }
    if (op === "notExists") {
      clauses.push({ $or: [{ [field]: { $exists: false } }, { [field]: null }] });
      continue;
    }

    if (op === "in" || op === "notIn") {
      const list = (Array.isArray(raw) ? raw : String(raw ?? "").split(","))
        .map((v) => coerce(modelName, field, typeof v === "string" ? v.trim() : v))
        .filter((v) => v !== undefined);
      if (!list.length) continue;
      clauses.push({ [field]: op === "in" ? { $in: list } : { $nin: list } });
      continue;
    }

    if (op === "contains" || op === "startsWith") {
      const s = String(raw ?? "");
      if (!s) continue;
      const pattern = op === "startsWith" ? `^${escapeRegex(s)}` : escapeRegex(s);
      clauses.push({ [field]: { $regex: pattern, $options: "i" } });
      continue;
    }

    const value = coerce(modelName, field, raw);
    if (value === undefined) continue;
    switch (op) {
      case "equals":
        clauses.push({ [field]: value });
        break;
      case "notEquals":
        clauses.push({ [field]: { $ne: value } });
        break;
      case "gt":
        clauses.push({ [field]: { $gt: value } });
        break;
      case "gte":
        clauses.push({ [field]: { $gte: value } });
        break;
      case "lt":
        clauses.push({ [field]: { $lt: value } });
        break;
      case "lte":
        clauses.push({ [field]: { $lte: value } });
        break;
      default:
        break;
    }
  }

  if (!clauses.length) return {};
  if (clauses.length === 1) return clauses[0];
  return match === "any" ? { $or: clauses } : { $and: clauses };
}

/** Projection that excludes every field the policy blocks. */
export function buildProjection(modelName) {
  const model = mongoose.models[modelName];
  if (!model) return {};
  const projection = {};
  for (const path of Object.keys(model.schema.paths)) {
    if (path === "__v" || isBlockedField(modelName, path)) projection[path] = 0;
  }
  projection.__v = 0;
  return projection;
}

/** Reference paths on this model that may be populated. */
export function populatableFields(modelName) {
  const model = mongoose.models[modelName];
  if (!model) return [];
  const out = [];
  for (const [path, schemaType] of Object.entries(model.schema.paths)) {
    const ref = schemaType.options?.ref || schemaType.caster?.options?.ref;
    if (!ref) continue;
    if (isBlockedField(modelName, path) || isBlockedModel(ref)) continue;
    out.push({ path, ref });
  }
  return out;
}

/** Convert a lean Mongo document into plain JSON-safe values. */
export function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toPlain);
  if (value instanceof Date) return value.toISOString();
  if (value?._bsontype === "ObjectId" || value instanceof mongoose.Types.ObjectId) {
    return String(value);
  }
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out;
  }
  return value;
}

/**
 * Run one data-source definition.
 *
 * @returns { key, mode, model, data, total, error }
 */
export async function runDataSource(source, ctx = {}) {
  const modelName = String(source?.model || "");
  const key = String(source?.key || "").trim();

  if (!isAllowedModel(modelName)) {
    return { key, mode: source?.mode || "list", model: modelName, data: source?.mode === "single" ? null : [], total: 0, error: `Model "${modelName}" is not available to the CMS` };
  }

  await connectDB();
  const model = mongoose.models[modelName];
  const mode = source?.mode === "single" ? "single" : "list";
  const filter = buildMongoFilter(modelName, source?.filters, ctx, source?.match);
  const projection = buildProjection(modelName);

  const sortField = String(source?.sortField || "createdAt");
  const sort = isQueryableField(modelName, sortField)
    ? { [sortField]: source?.sortDir === "asc" ? 1 : -1 }
    : {};

  const allowedPopulate = new Set(populatableFields(modelName).map((p) => p.path));
  const populate = (Array.isArray(source?.populate) ? source.populate : []).filter((p) =>
    allowedPopulate.has(p)
  );

  const limit = Math.min(Math.max(parseInt(source?.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = Math.max(parseInt(source?.skip, 10) || 0, 0);

  try {
    if (mode === "single") {
      let q = model.findOne(filter, projection).sort(sort).lean();
      for (const path of populate) {
        const ref = populatableFields(modelName).find((p) => p.path === path)?.ref;
        q = q.populate({ path, select: buildProjection(ref) });
      }
      const doc = await q;
      const clean = doc ? sanitizeDocument(modelName, toPlain(doc)) : null;
      return { key, mode, model: modelName, data: clean, total: clean ? 1 : 0, error: null };
    }

    let q = model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean();
    for (const path of populate) {
      const ref = populatableFields(modelName).find((p) => p.path === path)?.ref;
      q = q.populate({ path, select: buildProjection(ref) });
    }
    const [docs, total] = await Promise.all([
      q,
      source?.paginate ? model.countDocuments(filter) : Promise.resolve(null),
    ]);
    const clean = docs.map((d) => sanitizeDocument(modelName, toPlain(d)));
    return {
      key,
      mode,
      model: modelName,
      data: clean,
      total: total === null ? clean.length : total,
      error: null,
    };
  } catch (err) {
    console.error("CMS data query error:", err?.message);
    return { key, mode, model: modelName, data: mode === "single" ? null : [], total: 0, error: "Query failed" };
  }
}

/** Run several data sources and merge them into one data context. */
export async function runDataSources(sources, ctx = {}) {
  const list = Array.isArray(sources) ? sources.slice(0, 20) : [];
  const results = await Promise.all(list.map((s) => runDataSource(s, ctx)));
  const data = {};
  const meta = {};
  for (const r of results) {
    if (!r.key) continue;
    data[r.key] = r.data;
    meta[r.key] = { model: r.model, mode: r.mode, total: r.total, error: r.error };
  }
  return { data, meta };
}
