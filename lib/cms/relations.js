/**
 * Universal Relation Registry & Relation Resolver.
 *
 * Provides generic, model-agnostic relationship discovery, definition,
 * and automatic batched population across CMS models.
 *
 * Never hardcode `if (model === "Course")`. Any existing or newly registered
 * model can define relations, and models with Mongoose `ref:` options are
 * detected automatically.
 */
import mongoose from "mongoose";
import { isBlockedField, isBlockedModel, sanitizeDocument } from "@/lib/cms/fieldPolicy";

export const MAX_RELATION_DEPTH = 2;

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
  sourceField: "instructorId",
  targetModel: "User",
  targetField: "_id",
  alias: "instructor",
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
 * Get all relations for a model, combining schema `ref:` options and explicit relations.
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

  // 2. Mongoose schema refs
  const model = mongoose.models[modelName];
  if (model?.schema?.paths) {
    for (const [path, schemaType] of Object.entries(model.schema.paths)) {
      if (isBlockedField(modelName, path)) continue;
      const ref = schemaType.options?.ref || schemaType.caster?.options?.ref;
      if (!ref || isBlockedModel(ref)) continue;
      const isArray = schemaType.instance === "Array" || Boolean(schemaType.caster);
      if (!seenAliases.has(path)) {
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
      }
    }
  }

  return out;
}

/**
 * Batch-resolve and populate relations onto an array of plain documents.
 * Protects against N+1 queries by grouping foreign keys and querying with `$in`.
 *
 * @param {string} modelName - e.g. "Course"
 * @param {Array<Object>} docs - documents to populate
 * @param {Object} [options]
 * @param {number} [options.depth=0]
 * @param {Set<string>} [options.seenModels]
 * @param {boolean} [options.isPublic=true]
 */
export async function resolveRelationsForDocs(modelName, docs, { depth = 0, seenModels = new Set(), isPublic = true } = {}) {
  if (!Array.isArray(docs) || docs.length === 0 || depth >= MAX_RELATION_DEPTH) {
    return docs;
  }

  const relations = getRelationsForModel(modelName);
  if (!relations.length) return docs;

  const currentSeen = new Set(seenModels);
  currentSeen.add(modelName);

  for (const rel of relations) {
    if (currentSeen.has(rel.targetModel)) continue; // avoid cycles

    const TargetModel = mongoose.models[rel.targetModel];
    if (!TargetModel) continue;

    // Collect all foreign keys across documents
    const idSet = new Set();
    for (const doc of docs) {
      if (!doc) continue;
      const val = doc[rel.sourceField] || (rel.isMongooseRef ? doc[rel.alias] : null);
      if (rel.isArray && Array.isArray(val)) {
        val.forEach((id) => {
          if (id && typeof id === "object" && id._id) idSet.add(String(id._id));
          else if (id) idSet.add(String(id));
        });
      } else if (val) {
        if (typeof val === "object" && val._id) idSet.add(String(val._id));
        else idSet.add(String(val));
      }
    }

    if (idSet.size === 0) continue;

    const validIds = [...idSet]
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) continue;

    try {
      const targetQuery = { [rel.targetField]: { $in: validIds } };
      const rawTargets = await TargetModel.find(targetQuery).lean().limit(100);

      // Sanitize target records according to public/private security policy
      const sanitizedTargets = rawTargets.map((t) =>
        sanitizeDocument(rel.targetModel, t, { isPublic })
      );

      // Map by target key for O(1) lookup
      const targetMap = new Map();
      for (const t of sanitizedTargets) {
        const key = String(t[rel.targetField] || t._id);
        targetMap.set(key, t);
      }

      // Attach populated objects to source documents
      for (const doc of docs) {
        if (!doc) continue;
        const val = doc[rel.sourceField] || (rel.isMongooseRef ? doc[rel.alias] : null);
        if (rel.isArray && Array.isArray(val)) {
          doc[rel.alias] = val
            .map((id) => {
              const k = String(id?._id || id);
              return targetMap.get(k) || null;
            })
            .filter(Boolean);
        } else if (val) {
          const k = String(val?._id || val);
          doc[rel.alias] = targetMap.get(k) || null;
        }
      }

      // Descend one level if depth allows
      if (depth + 1 < MAX_RELATION_DEPTH) {
        const nextTargetDocs = [...targetMap.values()];
        if (nextTargetDocs.length > 0) {
          await resolveRelationsForDocs(rel.targetModel, nextTargetDocs, {
            depth: depth + 1,
            seenModels: currentSeen,
            isPublic,
          });
        }
      }
    } catch (err) {
      console.error(`Relation resolution error for ${modelName}.${rel.alias}:`, err?.message);
    }
  }

  return docs;
}
