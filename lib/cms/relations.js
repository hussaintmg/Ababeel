/**
 * Universal Relation Registry & Relation Resolver.
 *
 * Provides generic, model-agnostic relationship discovery, definition,
 * and automatic batched population across CMS models with global entity caching.
 *
 * Never hardcode `if (model === "Course")`. Any existing or newly registered
 * model can define relations, and models with Mongoose `ref:` options or
 * foreign keys are detected automatically.
 */
import mongoose from "mongoose";
import { publicRecordFilter, isPublicModel } from "./publicPolicy";
import { isBlockedField, isBlockedModel, sanitizeDocument } from "@/lib/cms/fieldPolicy";

export const MAX_RELATION_DEPTH = 3;

// In-memory registry for explicit relations (e.g., where models use foreign keys
// like `levelId` without Mongoose schema `ref:` options).
const EXPLICIT_RELATIONS = new Map();

/**
 * Register a generic relation between two models.
 *
 * @param {Object} def
 * @param {string} def.sourceModel - e.g. "Course"
 * @param {string} def.sourceField - e.g. "levelId"
 * @param {string} def.targetModel - e.g. "CourseLevel"
 * @param {string} [def.targetField="_id"] - e.g. "_id"
 * @param {string} [def.alias] - e.g. "level" (defaults to sourceField without "Id")
 * @param {boolean} [def.isArray=false] - true if sourceField holds an array of IDs
 */
export function defineRelation({
  sourceModel,
  sourceField,
  targetModel,
  targetField = "_id",
  alias,
  isArray = false,
}) {
  if (!sourceModel || !sourceField || !targetModel) return;
  const inferredAlias = alias || sourceField.replace(/Id$/, "").replace(/Ids$/, "");
  const list = EXPLICIT_RELATIONS.get(sourceModel) || [];

  // Replace existing if matching alias
  const filtered = list.filter((r) => r.alias !== inferredAlias);
  filtered.push({
    sourceModel,
    sourceField,
    targetModel,
    targetField,
    alias: inferredAlias,
    isArray,
  });
  EXPLICIT_RELATIONS.set(sourceModel, filtered);
}

// Register default generic relations for Ababeel core models
defineRelation({
  sourceModel: "Course",
  sourceField: "levelId",
  targetModel: "CourseLevel",
  targetField: "_id",
  alias: "level",
});
defineRelation({
  sourceModel: "Course",
  sourceField: "categoryId",
  targetModel: "CourseCategory",
  targetField: "_id",
  alias: "category",
});
defineRelation({
  sourceModel: "Course",
  sourceField: "instructorId",
  targetModel: "User",
  targetField: "_id",
  alias: "instructor",
});
defineRelation({
  sourceModel: "CourseReference",
  sourceField: "courseId",
  targetModel: "Course",
  targetField: "_id",
  alias: "course",
});
defineRelation({
  sourceModel: "CourseReference",
  sourceField: "course",
  targetModel: "Course",
  targetField: "_id",
  alias: "course",
});
defineRelation({
  sourceModel: "CourseReference",
  sourceField: "instructorId",
  targetModel: "User",
  targetField: "_id",
  alias: "instructor",
});
defineRelation({
  sourceModel: "CourseReference",
  sourceField: "userId",
  targetModel: "User",
  targetField: "_id",
  alias: "user",
});
defineRelation({
  sourceModel: "Course",
  sourceField: "userId",
  targetModel: "User",
  targetField: "_id",
  alias: "user",
});
defineRelation({
  sourceModel: "Course",
  sourceField: "level",
  targetModel: "CourseLevel",
  targetField: "_id",
  alias: "level",
});
defineRelation({
  sourceModel: "Course",
  sourceField: "awardingBody",
  targetModel: "AwardingBody",
  targetField: "_id",
  alias: "awardingBody",
});
defineRelation({
  sourceModel: "Course",
  sourceField: "createdBy",
  targetModel: "User",
  targetField: "_id",
  alias: "user",
});
defineRelation({
  sourceModel: "Candidate",
  sourceField: "courseId",
  targetModel: "Course",
  targetField: "_id",
  alias: "course",
});
defineRelation({
  sourceModel: "Candidate",
  sourceField: "userId",
  targetModel: "User",
  targetField: "_id",
  alias: "user",
});
defineRelation({
  sourceModel: "Post",
  sourceField: "authorId",
  targetModel: "User",
  targetField: "_id",
  alias: "author",
});
defineRelation({
  sourceModel: "Post",
  sourceField: "categoryId",
  targetModel: "Category",
  targetField: "_id",
  alias: "category",
});
defineRelation({
  sourceModel: "Order",
  sourceField: "customerId",
  targetModel: "User",
  targetField: "_id",
  alias: "customer",
});
defineRelation({
  sourceModel: "Order",
  sourceField: "courseId",
  targetModel: "Course",
  targetField: "_id",
  alias: "course",
});
defineRelation({
  sourceModel: "User",
  sourceField: "organizationId",
  targetModel: "Organization",
  targetField: "_id",
  alias: "organization",
});

/**
 * Infer target model for foreign key field names (e.g. userId -> User, levelId -> CourseLevel).
 */
function inferTargetModel(fieldName) {
  const normalized = String(fieldName || "").replace(/_id$/i, "Id");
  if (!normalized.endsWith("Id")) return null;
  const base = normalized.slice(0, -2);
  if (!base) return null;

  // Direct mapping overrides
  const KNOWN_MAP = {
    user: "User",
    instructor: "User",
    trainer: "User",
    author: "User",
    customer: "User",
    student: "User",
    course: "Course",
    level: "CourseLevel",
    courseLevel: "CourseLevel",
    awardingBody: "AwardingBody",
    category: "CourseCategory",
    courseCategory: "CourseCategory",
    candidate: "Candidate",
    organization: "Organization",
  };

  if (KNOWN_MAP[base]) {
    const candidate = KNOWN_MAP[base];
    if (mongoose.models[candidate]) return candidate;
  }

  // Capitalized generic guess (e.g. templateId -> Template, resourceId -> Resource)
  const guessed = base.charAt(0).toUpperCase() + base.slice(1);
  if (mongoose.models[guessed]) return guessed;

  return null;
}

/**
 * Get all relations for a model, combining schema `ref:` options, explicit relations,
 * and automatically discovered foreign key fields.
 */
export function getRelationsForModel(modelName) {
  const out = [];
  const seenAliases = new Set();

  // 1. Explicit relations
  const explicit = EXPLICIT_RELATIONS.get(modelName) || [];
  for (const rel of explicit) {
    if (isBlockedModel(rel.targetModel) || isBlockedField(modelName, rel.sourceField)) continue;
    out.push(rel);
    seenAliases.add(rel.alias);
  }

  // 2. Mongoose schema refs & inferred foreign keys
  const model = mongoose.models[modelName];
  if (model?.schema?.paths) {
    for (const [path, schemaType] of Object.entries(model.schema.paths)) {
      if (isBlockedField(modelName, path)) continue;
      const ref = schemaType.options?.ref || schemaType.caster?.options?.ref;
      const isArray = schemaType.instance === "Array" || Boolean(schemaType.caster);

      if (ref && !isBlockedModel(ref)) {
        const previous = out.findIndex((r) => r.alias === path);
        if (previous >= 0) out.splice(previous, 1);
        out.push({
          sourceModel: modelName,
          sourceField: path,
          targetModel: ref,
          targetField: "_id",
          alias: path,
          isArray,
          isMongooseRef: true,
        });
        seenAliases.add(path);
      } else {
        // Inferred foreign key (e.g. userId, levelId)
        const inferredModel = inferTargetModel(path);
        if (inferredModel && !isBlockedModel(inferredModel) && !seenAliases.has(path.replace(/Id$/, ""))) {
          const alias = path.replace(/Id$/, "");
          out.push({
            sourceModel: modelName,
            sourceField: path,
            targetModel: inferredModel,
            targetField: "_id",
            alias,
            isArray: false,
            isInferred: true,
          });
          seenAliases.add(alias);
        }
      }
    }
  }

  return out;
}

/**
 * Batch-resolve and populate relations onto an array of plain documents with global entity caching.
 * Protects against N+1 queries by grouping foreign keys and querying with `$in`.
 * Deduplicates entities so shared references (e.g. userId in CourseReference and Course)
 * are fetched once and linked to the exact same document.
 *
 * @param {string} modelName - e.g. "CourseReference"
 * @param {Array<Object>} docs - documents to populate
 * @param {Object} [options]
 * @param {number} [options.depth=0]
 * @param {Set<string>} [options.ancestorPath] - tracks ancestor model chain to prevent cycles
 * @param {boolean} [options.isPublic=true]
 * @param {Map<string, Object>} [options.entityCache] - shared entity cache across recursion & sources
 */
export async function resolveRelationsForDocs(
  modelName,
  docs,
  { depth = 0, ancestorPath = new Set(), isPublic = true, entityCache = new Map() } = {}
) {
  if (!Array.isArray(docs) || docs.length === 0 || depth >= MAX_RELATION_DEPTH) {
    return docs;
  }

  const relations = getRelationsForModel(modelName);
  if (!relations.length) return docs;

  const currentAncestors = new Set(ancestorPath);
  currentAncestors.add(modelName);

  for (const rel of relations) {
    if (isPublic && !isPublicModel(rel.targetModel)) continue;
    // Prevent recursive loop if target model is already an ancestor in the current branch
    if (currentAncestors.has(rel.targetModel)) continue;

    const TargetModel = mongoose.models[rel.targetModel];
    if (!TargetModel) continue;

    // Collect all foreign keys across documents
    const idSet = new Set();
    for (const doc of docs) {
      if (!doc) continue;
      let val = doc[rel.sourceField];
      // Special fallback for CourseReference course / courseId
      if (!val && modelName === "CourseReference" && rel.alias === "course") {
        val = doc.courseId || doc.course;
      }
      if (!val && rel.isMongooseRef) {
        val = doc[rel.alias];
      }

      if (rel.isArray && Array.isArray(val)) {
        val.forEach((id) => {
          if (id && typeof id === "object" && id._id) idSet.add(String(id._id));
          else if (id && typeof id === "string") idSet.add(id);
          else if (id && typeof id.toString === "function") idSet.add(id.toString());
        });
      } else if (val) {
        if (typeof val === "object" && val._id) idSet.add(String(val._id));
        else if (typeof val === "string") idSet.add(val);
        else if (typeof val.toString === "function") idSet.add(val.toString());
      }
    }

    if (idSet.size === 0) continue;

    // Separate IDs already in entityCache vs uncached IDs needing DB fetch
    const uncachedIds = [];
    for (const idStr of idSet) {
      const cacheKey = `${rel.targetModel}:${idStr}`;
      if (!entityCache.has(cacheKey) && mongoose.isValidObjectId(idStr)) {
        uncachedIds.push(new mongoose.Types.ObjectId(idStr));
      }
    }

    try {
      if (uncachedIds.length > 0) {
        const targetQuery = {
          [rel.targetField]: { $in: uncachedIds },
          ...(isPublic ? publicRecordFilter(rel.targetModel) : {}),
        };
        const rawTargets = await TargetModel.find(targetQuery).lean().limit(100);

        // If target model is DefaultCourse and some IDs were not found, check Course model
        if (rel.targetModel === "DefaultCourse" && rawTargets.length < uncachedIds.length) {
          const foundIds = new Set(rawTargets.map((t) => String(t._id)));
          const missingIds = uncachedIds.filter((id) => !foundIds.has(String(id)));
          if (missingIds.length > 0 && mongoose.models.Course) {
            const fallbackCourses = await mongoose.models.Course.find({
              [rel.targetField]: { $in: missingIds },
              ...(isPublic ? publicRecordFilter("Course") : {}),
            }).lean();
            for (const fb of fallbackCourses) {
              const sanitized = sanitizeDocument("Course", fb, { isPublic });
              entityCache.set(`${rel.targetModel}:${String(fb[rel.targetField] || fb._id)}`, sanitized);
              entityCache.set(`Course:${String(fb[rel.targetField] || fb._id)}`, sanitized);
            }
          }
        }

        // Sanitize and cache each retrieved target record
        for (const t of rawTargets) {
          const sanitized = sanitizeDocument(rel.targetModel, t, { isPublic });
          const key = `${rel.targetModel}:${String(t[rel.targetField] || t._id)}`;
          entityCache.set(key, sanitized);
        }
      }

      // Attach populated objects from entityCache to source documents
      const attachedTargets = [];
      for (const doc of docs) {
        if (!doc) continue;
        let val = doc[rel.sourceField];
        if (!val && modelName === "CourseReference" && rel.alias === "course") {
          val = doc.courseId || doc.course;
        }
        if (!val && rel.isMongooseRef) {
          val = doc[rel.alias];
        }

        if (rel.isArray && Array.isArray(val)) {
          doc[rel.alias] = val
            .map((id) => {
              const k = `${rel.targetModel}:${String(id?._id || id)}`;
              return entityCache.get(k) || null;
            })
            .filter(Boolean);
          doc[rel.alias].forEach((t) => attachedTargets.push(t));
        } else if (val) {
          const k = `${rel.targetModel}:${String(val?._id || val)}`;
          const target = entityCache.get(k) || null;
          if (target) {
            doc[rel.alias] = target;
            attachedTargets.push(target);
          }
        }
      }

      // Descend to populate nested relations (depth + 1)
      if (depth + 1 < MAX_RELATION_DEPTH && attachedTargets.length > 0) {
        // Unique documents for the next level
        const uniqueTargets = [];
        const seenIds = new Set();
        for (const t of attachedTargets) {
          const id = String(t._id || "");
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueTargets.push(t);
          }
        }

        if (uniqueTargets.length > 0) {
          await resolveRelationsForDocs(rel.targetModel, uniqueTargets, {
            depth: depth + 1,
            ancestorPath: currentAncestors,
            isPublic,
            entityCache,
          });
        }
      }
    } catch (err) {
      console.error(`Relation resolution error for ${modelName}.${rel.alias}:`, err?.message);
    }
  }

  return docs;
}
