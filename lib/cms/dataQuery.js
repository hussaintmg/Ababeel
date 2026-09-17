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
import { normalizeSource, normalizeSources } from "./sourceDefinition";
import { getUpcomingSessions } from "@/lib/training/queries";
import { publicRecordFilter, isPublicModel } from "./publicPolicy";
import connectDB from "@/utils/db";
import "@/models/index";
import { getModelDescriptor, isQueryableField, getSchemaRegistry } from "@/lib/cms/schemaRegistry";
import { isBlockedField, isBlockedModel, sanitizeDocument } from "@/lib/cms/fieldPolicy";
import { resolveTemplate, isDynamic } from "@/lib/cms/expression";
import { resolveRelationsForDocs } from "@/lib/cms/relations";

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
  return getSchemaRegistry().filter(m => isPublicModel(m.name)).map((m) => ({
    name: m.name,
    label: m.label,
    key: m.key,
    collectionKey: m.collectionKey,
  }));
}

export function isAllowedModel(name) {
  return !!name && isPublicModel(name) && !isBlockedModel(name) && !!getModelDescriptor(name);
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
 * Enforces automatic tenant isolation and published record status.
 */
const OP_ALIAS_MAP = {
  '==': 'equals',
  '=': 'equals',
  'eq': 'equals',
  '!=': 'notEquals',
  'neq': 'notEquals',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
};

export function buildMongoFilter(modelName, filters, ctx = {}, match = "all", opts = {}) {
  const clauses = [];
  const model = mongoose.models[modelName];
  const schemaPaths = model?.schema?.paths || {};
  const filterFields = new Set();

  for (const f of Array.isArray(filters) ? filters : []) {
    const field = String(f?.field || "").trim();
    const rawOp = String(f?.op || "equals");
    const op = OP_ALIAS_MAP[rawOp] || rawOp;
    if (!field || !OP_VALUES.has(op)) continue;
    if (!isQueryableField(modelName, field)) continue;
    if (isBlockedField(modelName, field)) continue;
    filterFields.add(field);

    let raw = f?.value;
    if (typeof raw === "string" && isDynamic(raw)) raw = resolveTemplate(raw, ctx);
    if (f?.dynamic && typeof raw === "string" && !isDynamic(f.value)) {
      // A plain path stored with dynamic:true, e.g. "params.slug" or "route.params.slug".
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

  const mandatory = [];
  const tenantId = ctx.tenantId || ctx.organizationId || ctx.user?.organizationId || ctx.user?.organization;
  if (tenantId && !opts.bypassTenant) {
    if ("organizationId" in schemaPaths) mandatory.push({organizationId:tenantId});
    else if ("organization" in schemaPaths) mandatory.push({organization:tenantId});
  }
  if (ctx.userId && "userId" in schemaPaths && !opts.bypassTenant) mandatory.push({userId:ctx.userId});
  if (!opts.preview && !opts.isOwner && !opts.isAdmin) {
    const policy=publicRecordFilter(modelName);
    if(Object.keys(policy).length) mandatory.push(policy);
  }
  const userFilter = clauses.length > 1 ? (match === "any" ? {$or:clauses} : {$and:clauses}) : clauses[0];
  if(userFilter) mandatory.unshift(userFilter);
  return mandatory.length > 1 ? {$and:mandatory} : mandatory[0] || {};
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
export function populatableFields(modelName, opts = {}) {
  const model = mongoose.models[modelName];
  if (!model) return [];
  const out = [];
  for (const [path, schemaType] of Object.entries(model.schema.paths)) {
    const ref = schemaType.options?.ref || schemaType.caster?.options?.ref;
    if (!ref) continue;
    if (isBlockedField(modelName, path) || isBlockedModel(ref)) continue;
    if (opts?.isPublic && !isPublicModel(ref)) continue;
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
 * Supported operations:
 * - "findMany" (list): array of documents + pagination metadata
 * - "findOne" (single): one document
 * - "findById": document by id
 * - "findBySlug": document by slug
 * - "currentUser": authenticated user
 * - "routeParam": document matching route parameter
 * - "count": count of documents
 */
export async function runDataSource(source, ctx = {}, opts = {}) {
  try { source = normalizeSource(source, {allowReserved: !!opts.allowReserved}); }
  catch(error) { return {key:source?.key, data:null, total:0, error:error.message}; }
  const modelName = String(source?.model || "");
  const key = String(source?.key || "").trim();
  const operation = source?.operation || (source?.mode === "single" ? "findOne" : source?.mode === "count" ? "count" : "findMany");

  // Current User special operation
  if (operation === "currentUser") {
    const userDoc = ctx.user || null;
    const sanitized = userDoc ? sanitizeDocument("User", toPlain(userDoc), { isPublic: !opts.preview }) : null;
    return {
      key,
      mode: "single",
      model: "User",
      operation: "currentUser",
      data: sanitized,
      total: sanitized ? 1 : 0,
      error: null,
    };
  }

  if (!isAllowedModel(modelName)) {
    const failed = operation === "count" ? 0 : operation === "findOne" || operation === "findById" || operation === "findBySlug" || operation === "routeParam" || source?.mode === "single" ? null : [];
    return {
      key,
      mode: source?.mode || "list",
      model: modelName,
      operation,
      data: failed,
      total: 0,
      error: `Model "${modelName}" is not available to the CMS`,
    };
  }

  const model = mongoose.models[modelName];
  const isSingle = operation === "findOne" || operation === "findById" || operation === "findBySlug" || operation === "routeParam" || source?.mode === "single";
  const isCount = operation === "count" || source?.mode === "count";
  const mode = isCount ? "count" : isSingle ? "single" : "list";

  // Build filter with automatic tenant isolation and published record filters
  const filter = buildMongoFilter(modelName, source?.filters, ctx, source?.match, opts);

  // Invalid selectors fail closed before connecting or issuing a query.
  const fail = error => ({key, mode, operation, model:modelName, data:isSingle?null:[], total:0, error});
  let selectorField, selector;
  if(operation==='findById') { selectorField='_id'; selector=source.documentId||source.id; }
  if(operation==='findBySlug') { selectorField='slug'; selector=source.slug; }
  if(operation==='routeParam') { selectorField=source.lookupField||'slug'; selector=ctx.params?.[source.paramName||'slug'] ?? ctx.route?.params?.[source.paramName||'slug']; }
  if(selectorField) {
    if(typeof selector==='string' && isDynamic(selector)) selector=resolveTemplate(selector,ctx);
    if(!isQueryableField(modelName,selectorField) || isBlockedField(modelName,selectorField)) return fail('Invalid lookup field');
    if(selector===undefined || selector===null || typeof selector==='object' || !String(selector).trim()) return fail('Missing record selector');
    const value=coerce(modelName,selectorField,selector);
    if(value===undefined || (selectorField==='_id' && !mongoose.isValidObjectId(selector))) return fail('Invalid record selector');
    filter[selectorField]=value;
  }

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
    if(operation==='upcomingSessions') {
      let courseId = source.courseId || source.course;
      if (!courseId && Array.isArray(source.filters)) {
        const cFilter = source.filters.find(f => f.field === 'course' || f.field === 'courseId');
        if (cFilter) courseId = cFilter.value;
      }
      const data=await getUpcomingSessions({months:source.months,limit:source.limit,strict:true,courseId});
      return {key,mode:'list',model:modelName,operation,data,total:data.length,error:null};
    }
    await connectDB();
    if (isCount) {
      const n = await model.countDocuments(filter);
      return { key, mode: "count", operation: "count", model: modelName, data: n, total: n, error: null };
    }

    if (isSingle) {
      let q = model.findOne(filter, projection).sort(sort).lean();
      for (const path of populate) {
        const ref = populatableFields(modelName).find((p) => p.path === path)?.ref;
        q = q.populate({ path, select: buildProjection(ref), match: publicRecordFilter(ref) });
      }
      const doc = await q;
      let clean = doc ? sanitizeDocument(modelName, toPlain(doc), { isPublic: !opts.preview }) : null;
      if (clean) {
        const populated = await resolveRelationsForDocs(modelName, [clean], { isPublic: !opts.preview, entityCache: opts.entityCache });
        clean = populated[0] || clean;
      }
      return { key, mode: "single", operation, model: modelName, data: clean, total: clean ? 1 : 0, error: null };
    }

    let q = model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean();
    for (const path of populate) {
      const ref = populatableFields(modelName).find((p) => p.path === path)?.ref;
      q = q.populate({ path, select: buildProjection(ref), match: publicRecordFilter(ref) });
    }
    const [docs, total] = await Promise.all([
      q,
      source?.paginate ? model.countDocuments(filter) : Promise.resolve(null),
    ]);

    const clean = docs.map((d) => sanitizeDocument(modelName, toPlain(d), { isPublic: !opts.preview }));
    if (clean.length > 0) {
      await resolveRelationsForDocs(modelName, clean, { isPublic: !opts.preview, entityCache: opts.entityCache });
    }
    const totalCount = total === null ? clean.length : total;
    const pageNum = Math.max(1, Math.floor(skip / limit) + 1);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Attach normalized pagination contract to array
    const pagination = {
      page: pageNum,
      limit,
      total: totalCount,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    };

    return {
      key,
      mode: "list",
      operation,
      model: modelName,
      data: clean,
      total: totalCount,
      pagination,
      error: null,
    };
  } catch (err) {
    console.error("CMS data query error:", err?.message);
    const empty = isCount ? 0 : isSingle ? null : [];
    return { key, mode, operation, model: modelName, data: empty, total: 0, error: "Query failed" };
  }
}

/**
 * Extract dependencies of a source on other sources.
 * Looks inside filters, slug, documentId for `{{ otherSource.field }}`
 */
function extractSourceDependencies(source, allSourceKeys) {
  const deps = new Set();
  const inspect = (str) => {
    if (typeof str !== "string") return;
    const matches = str.match(/\{\{\s*([a-zA-Z0-9_$]+)[.[\]]/g);
    if (matches) {
      for (const m of matches) {
        const rootKey = m.replace(/\{\{\s*/, "").replace(/[.[\]]/, "").trim();
        if (allSourceKeys.has(rootKey)) {
          deps.add(rootKey);
        }
      }
    }
  };

  for (const f of Array.isArray(source?.filters) ? source.filters : []) {
    inspect(f?.value);
  }
  inspect(source?.slug);
  inspect(source?.documentId);
  inspect(source?.id);

  return [...deps];
}

/**
 * Run several data sources in topological dependency order.
 * Independent sources run in parallel; dependent sources wait for their prerequisites.
 */
export async function runDataSources(sources, ctx = {}, opts = {}) {
  const entityCache = opts.entityCache || new Map();
  const effectiveOpts = { ...opts, entityCache };
  let list;
  try { list=normalizeSources(Array.isArray(sources)?sources.slice(0,30):[]); }
  catch(error) { return {data:{},meta:{_sources:{error:error.message}}}; }
  if (!list.length) return { data: {}, meta: {} };

  const allKeys = new Set(list.map((s) => s.key).filter(Boolean));
  const depMap = new Map();
  for (const s of list) {
    if (s.key) {
      depMap.set(s.key, extractSourceDependencies(s, allKeys));
    }
  }

  // Detect cycles using Tarjan/DFS
  const visited = new Set();
  const recursionStack = new Set();
  let hasCycle = false;

  const checkCycle = (node) => {
    visited.add(node);
    recursionStack.add(node);
    const neighbors = depMap.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (checkCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    recursionStack.delete(node);
    return false;
  };

  for (const key of depMap.keys()) {
    if (!visited.has(key)) {
      if (checkCycle(key)) {
        hasCycle = true;
        break;
      }
    }
  }

  if (hasCycle) {
    console.error("CMS Data Source error: Cyclic dependency detected between data sources");
  }

  // Tiered execution: run sources whose dependencies are already resolved
  const resolvedData = {};
  const resolvedMeta = {};
  const currentCtx = { ...ctx };
  const pending = new Map(list.map((s) => [s.key, s]));

  let maxRounds = list.length + 1;
  while (pending.size > 0 && maxRounds-- > 0) {
    // Find all sources whose deps are resolved
    const runnable = [];
    for (const [key, source] of pending.entries()) {
      const deps = depMap.get(key) || [];
      const ready = deps.every((d) => Object.hasOwn(resolvedData,d) || !pending.has(d));
      if (ready) {
        runnable.push(source);
      }
    }

    if (!runnable.length) {
      // Break stalemate if cyclic
      for(const [key,source] of pending) { resolvedData[key]=null; resolvedMeta[key]={model:source.model,error:'Cyclic source dependency or unresolved prerequisite'}; }
      break;
    }

    // Run this tier in parallel
    const tierResults = await Promise.all(
      runnable.map((s) => (depMap.get(s.key)||[]).some(d=>resolvedMeta[d]?.error) ? Promise.resolve({key:s.key,data:null,total:0,error:"Dependency failed"}) : runDataSource(s, currentCtx, effectiveOpts))
    );

    for (const r of tierResults) {
      if (!r.key) continue;
      pending.delete(r.key);
      resolvedData[r.key] = r.data;
      resolvedMeta[r.key] = {
        model: r.model,
        mode: r.mode,
        operation: r.operation,
        total: r.total,
        pagination: r.pagination,
        error: r.error,
      };
      currentCtx[r.key] = r.data;
    }
  }

  return { data: resolvedData, meta: resolvedMeta };
}
