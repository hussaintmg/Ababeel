/**
 * Owner CRUD for every training resource.
 *
 * One implementation, driven by `lib/training/resources.js`. Every handler
 * starts with the same owner check and the same field whitelist, so a resource
 * added to the registry cannot accidentally ship without either.
 *
 * Server-only.
 */
import mongoose from "mongoose";
import connectDB from "@/utils/db";
import { requireOwner } from "@/lib/auth";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  safeErrorResponse,
} from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getResource } from "@/lib/training/resources";
import { slugify } from "@/lib/models/shared";
import { plain } from "@/lib/training/queries";

const MAX_LIMIT = 200;

/** Resolve the resource, or the 404 to return instead. */
function resolve(resourceKey) {
  const resource = getResource(resourceKey);
  if (!resource) return { resource: null, error: notFoundResponse("Unknown resource") };
  return { resource, error: null };
}

/** Owner gate + rate limit, shared by every mutating handler. */
async function guard(request, { write = false } = {}) {
  const { user, error } = await requireOwner(request);
  if (error) return { user: null, error };
  if (write) {
    const rl = await checkRateLimit(request, "trainingAdmin", { userId: user._id.toString() });
    if (!rl.allowed) return { user: null, error: rateLimitResponse(rl.retryAfter) };
  }
  return { user, error: null };
}

/**
 * Reduce a request body to the fields this resource allows.
 *
 * Anything not on the whitelist is dropped rather than rejected: an editor that
 * round-trips a document back with `_id` and `createdAt` attached is normal,
 * and failing those requests would be noise. What matters is that the values
 * never reach the model.
 */
function pickFields(resource, body, { isUpdate = false } = {}) {
  const out = {};
  if (!body || typeof body !== "object") return out;
  const locked = isUpdate ? new Set(resource.lockOnUpdate || []) : new Set();

  for (const key of resource.fields) {
    if (locked.has(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    let value = body[key];

    if ((resource.objectIdFields || []).includes(key)) {
      value = value && mongoose.Types.ObjectId.isValid(String(value)) ? String(value) : null;
    } else if ((resource.dateFields || []).includes(key)) {
      value = value ? new Date(value) : null;
      if (value && Number.isNaN(value.getTime())) value = null;
    } else if (typeof value === "string") {
      value = value.trim();
    }
    out[key] = value;
  }
  return out;
}

/** Reject a body that smuggles Mongo operators anywhere inside it. */
function hasOperatorKeys(value, depth = 0) {
  if (depth > 6 || !value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((v) => hasOperatorKeys(v, depth + 1));
  return Object.entries(value).some(
    ([k, v]) => k.startsWith("$") || k.includes(".") || hasOperatorKeys(v, depth + 1),
  );
}

async function readBody(request) {
  try {
    return { body: await request.json(), error: null };
  } catch {
    return { body: null, error: badRequestResponse("Invalid JSON body") };
  }
}

/**
 * Give the document a slug that is unique for its collection.
 *
 * Two courses called "Working at Height" is an ordinary thing for an owner to
 * do; a duplicate-key error in their face is not. The second one becomes
 * `working-at-height-2`.
 */
async function ensureUniqueSlug(Model, base, excludeId = null) {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let i = 2; i < 200; i += 1) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const clash = await Model.exists(query);
    if (!clash) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/* --------------------------------------------------------------- handlers */

/** GET — paginated list with search, status filter and arbitrary field filters. */
export async function listResource(request, resourceKey) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { error } = await guard(request);
    if (error) return error;

    await connectDB();
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").trim();
    const status = url.searchParams.get("status") || "";
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), MAX_LIMIT);

    const query = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = (resource.searchFields || ["name"]).map((f) => ({ [f]: rx }));
    }
    if (status) query.status = status;

    // Owner-side filters that mirror the public ones, e.g. ?course=<id>.
    for (const key of resource.objectIdFields || []) {
      const value = url.searchParams.get(key);
      if (value && mongoose.Types.ObjectId.isValid(value)) query[key] = value;
    }

    let cursor = resource.Model.find(query).sort(resource.defaultSort || { createdAt: -1 });
    if (resource.listSelect) cursor = cursor.select(resource.listSelect);
    for (const pop of resource.populate || []) cursor = cursor.populate(pop);

    const [items, total] = await Promise.all([
      cursor.skip((page - 1) * limit).limit(limit).lean(),
      resource.Model.countDocuments(query),
    ]);

    return successResponse({
      data: { items: plain(items), total, page, pages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    console.error(`training list (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}

/** POST — create. */
export async function createResource(request, resourceKey) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { user, error } = await guard(request, { write: true });
    if (error) return error;

    const { body, error: bodyError } = await readBody(request);
    if (bodyError) return bodyError;
    if (hasOperatorKeys(body)) return badRequestResponse("Invalid field names in request body");

    const data = pickFields(resource, body);
    for (const key of resource.required || []) {
      if (!data[key]) return badRequestResponse(`${key} is required`);
    }

    await connectDB();
    if (resource.slugSource) {
      data.slug = await ensureUniqueSlug(resource.Model, data.slug || data[resource.slugSource]);
    }
    if (resourceKey === "registration-fields" && data.key) {
      data.key = slugify(data.key).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (!data.key) return badRequestResponse("key is required");
      const clash = await resource.Model.exists({ key: data.key });
      if (clash) return badRequestResponse("A field with that key already exists");
    }

    data.createdBy = user._id;
    data.updatedBy = user._id;

    const doc = await resource.Model.create(data);
    return successResponse({ data: plain(doc.toObject()) }, 201);
  } catch (error) {
    if (error?.name === "ValidationError") {
      return badRequestResponse(Object.values(error.errors)[0]?.message || "Validation failed");
    }
    if (error?.code === 11000) return badRequestResponse("That value is already in use");
    console.error(`training create (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}

/** GET one. */
export async function getResourceItem(request, resourceKey, id) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { error } = await guard(request);
    if (error) return error;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    await connectDB();
    let cursor = resource.Model.findById(id);
    for (const pop of resource.populate || []) cursor = cursor.populate(pop);
    const doc = await cursor.lean();
    if (!doc) return notFoundResponse("Not found");
    return successResponse({ data: plain(doc) });
  } catch (error) {
    console.error(`training get (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}

/** PATCH — partial update. */
export async function updateResourceItem(request, resourceKey, id) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { user, error } = await guard(request, { write: true });
    if (error) return error;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    const { body, error: bodyError } = await readBody(request);
    if (bodyError) return bodyError;
    if (hasOperatorKeys(body)) return badRequestResponse("Invalid field names in request body");

    const data = pickFields(resource, body, { isUpdate: true });
    for (const key of resource.required || []) {
      if (Object.prototype.hasOwnProperty.call(data, key) && !data[key]) {
        return badRequestResponse(`${key} cannot be empty`);
      }
    }

    await connectDB();
    if (resource.slugSource && (data.slug !== undefined || data[resource.slugSource])) {
      const base = data.slug || data[resource.slugSource];
      if (base) data.slug = await ensureUniqueSlug(resource.Model, base, id);
    }
    data.updatedBy = user._id;

    const doc = await resource.Model.findByIdAndUpdate(id, { $set: data }, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) return notFoundResponse("Not found");
    return successResponse({ data: plain(doc) });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return badRequestResponse(Object.values(error.errors)[0]?.message || "Validation failed");
    }
    if (error?.code === 11000) return badRequestResponse("That value is already in use");
    console.error(`training update (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}

/** DELETE. */
export async function deleteResourceItem(request, resourceKey, id) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { error } = await guard(request, { write: true });
    if (error) return error;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    await connectDB();
    const doc = await resource.Model.findById(id).lean();
    if (!doc) return notFoundResponse("Not found");

    if (resource.protectDelete) {
      const reason = resource.protectDelete(doc);
      if (reason) return badRequestResponse(reason);
    }

    const blocked = await blockedByDependents(resourceKey, id);
    if (blocked) return badRequestResponse(blocked);

    await resource.Model.deleteOne({ _id: id });
    return successResponse({ data: { deleted: true, id: String(id) } });
  } catch (error) {
    console.error(`training delete (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}

/**
 * Refuse a delete that would orphan a registration.
 *
 * A registration is a record of a real person asking for a place. Deleting the
 * course out from under it would leave a row nobody can act on, so the owner is
 * told to archive the course instead.
 */
async function blockedByDependents(resourceKey, id) {
  const Registration = (await import("@/models/Registration")).default;
  const CourseReferenceSession = (await import("@/models/CourseReferenceSession")).default;

  if (resourceKey === "courses") {
    const count = await Registration.countDocuments({ course: id });
    if (count) {
      return `This course has ${count} registration${count === 1 ? "" : "s"}. Set its status to Archived instead of deleting it.`;
    }
    const sessions = await CourseReferenceSession.countDocuments({ course: id });
    if (sessions) {
      return `This course has ${sessions} course reference${sessions === 1 ? "" : "s"}. Delete those first, or archive the course.`;
    }
  }
  if (resourceKey === "sessions") {
    const count = await Registration.countDocuments({ session: id });
    if (count) {
      return `This course reference has ${count} registration${count === 1 ? "" : "s"}. Cancel it, or turn off "Show in schedule", instead of deleting it.`;
    }
  }
  return "";
}

/**
 * POST — duplicate.
 *
 * The copy always lands as a draft with "(Copy)" in its name, so duplicating a
 * live course can never publish a half-edited one by accident.
 */
export async function duplicateResourceItem(request, resourceKey, id) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { user, error } = await guard(request, { write: true });
    if (error) return error;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    await connectDB();
    const source = await resource.Model.findById(id).lean();
    if (!source) return notFoundResponse("Not found");

    const copy = {};
    for (const key of resource.fields) {
      if (source[key] !== undefined) copy[key] = source[key];
    }
    if (copy.name) copy.name = `${copy.name} (Copy)`;
    if (copy.referenceName) copy.referenceName = `${copy.referenceName} (Copy)`;
    if (copy.label) copy.label = `${copy.label} (Copy)`;
    if (resource.Model.schema.path("status")) {
      copy.status = resource.Model.schema.path("status").options?.enum?.includes("draft")
        ? "draft"
        : copy.status;
    }
    if (resource.slugSource) {
      copy.slug = await ensureUniqueSlug(resource.Model, copy[resource.slugSource] || "copy");
    }
    if (resourceKey === "registration-fields") {
      copy.key = await uniqueFieldKey(resource.Model, `${source.key}Copy`);
      copy.enabled = false;
    }
    copy.createdBy = user._id;
    copy.updatedBy = user._id;

    const doc = await resource.Model.create(copy);
    return successResponse({ data: plain(doc.toObject()) }, 201);
  } catch (error) {
    console.error(`training duplicate (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}

async function uniqueFieldKey(Model, base) {
  let candidate = base;
  for (let i = 2; i < 100; i += 1) {
    if (!(await Model.exists({ key: candidate }))) return candidate;
    candidate = `${base}${i}`;
  }
  return `${base}${Date.now().toString(36)}`;
}

/**
 * POST — reorder.
 *
 * Takes the full ordered list of ids and writes each one's position in a single
 * bulk write, so a drag-and-drop reorder is one request and one round trip
 * rather than one per moved row.
 */
export async function reorderResource(request, resourceKey) {
  try {
    const { resource, error: notFound } = resolve(resourceKey);
    if (notFound) return notFound;
    const { error } = await guard(request, { write: true });
    if (error) return error;

    const { body, error: bodyError } = await readBody(request);
    if (bodyError) return bodyError;

    const ids = Array.isArray(body?.ids) ? body.ids : null;
    if (!ids) return badRequestResponse("ids must be an array");
    if (ids.length > MAX_LIMIT) return badRequestResponse("Too many items in one reorder");

    const valid = ids.filter((id) => mongoose.Types.ObjectId.isValid(String(id)));
    if (valid.length !== ids.length) return badRequestResponse("ids contains an invalid id");
    if (!valid.length) return successResponse({ data: { updated: 0 } });

    await connectDB();
    const ops = valid.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { displayOrder: index } } },
    }));
    const result = await resource.Model.bulkWrite(ops);
    return successResponse({ data: { updated: result.modifiedCount ?? valid.length } });
  } catch (error) {
    console.error(`training reorder (${resourceKey}) error:`, error);
    return safeErrorResponse(error, 500);
  }
}
