/**
 * Automatic MongoDB / Mongoose schema discovery.
 *
 * Server-only: importing this registers every model (via the models barrel)
 * and walks Mongoose's own compiled schemas — so the registry describes the
 * schemas that actually exist in this application, not a hand-maintained copy.
 *
 * Output shape (per model):
 *
 *   { name, label, key, collectionKey, count, fields: [FieldNode] }
 *
 *   FieldNode = {
 *     name, path, fullPath, type, required, nullable, enumValues,
 *     ref, isArray, itemType, description, children?
 *   }
 */
import mongoose from "mongoose";
import "@/models/index";
import { VAR_TYPES, refineStringType, arrayTypeLabel } from "@/lib/cms/types";
import { isBlockedField, isBlockedModel } from "@/lib/cms/fieldPolicy";

// How deep we follow `ref:` relationships. 2 is enough for
// course.instructor.firstName without risking a cycle blow-up.
const MAX_REF_DEPTH = 2;
// How deep we descend into plain nested objects / subdocument arrays.
const MAX_NEST_DEPTH = 6;

/* ------------------------------------------------------------------ *
 * naming
 * ------------------------------------------------------------------ */

export function camelize(name) {
  const s = String(name || "");
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Naive but predictable pluraliser for collection variable names. */
export function pluralize(name) {
  const s = String(name || "");
  if (!s) return s;
  if (/(s|x|z|ch|sh)$/i.test(s)) return `${s}es`;
  if (/[^aeiou]y$/i.test(s)) return `${s.slice(0, -1)}ies`;
  return `${s}s`;
}

/** "CourseReference" → "Course References" */
export function humanizeModel(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/** "firstName" → "First Name", "atcDetails" → "Atc Details" */
export function humanizeField(name) {
  return String(name || "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ *
 * type mapping
 * ------------------------------------------------------------------ */

function baseTypeFor(instance) {
  switch (instance) {
    case "String":
      return VAR_TYPES.String;
    case "Number":
    case "Decimal128":
    case "BigInt":
      return VAR_TYPES.Number;
    case "Boolean":
      return VAR_TYPES.Boolean;
    case "Date":
      return VAR_TYPES.DateTime;
    case "ObjectID":
    case "ObjectId":
      return VAR_TYPES.String;
    case "Mixed":
      return VAR_TYPES.JSON;
    case "Map":
      return VAR_TYPES.Object;
    case "Buffer":
      return VAR_TYPES.Unknown;
    case "Array":
      return VAR_TYPES.Array;
    case "Embedded":
      return VAR_TYPES.Object;
    default:
      return VAR_TYPES.Unknown;
  }
}

function enumOf(schemaType) {
  const vals = schemaType?.enumValues?.length
    ? schemaType.enumValues
    : schemaType?.options?.enum;
  if (!Array.isArray(vals)) return [];
  return vals.filter((v) => v !== null && v !== undefined).map(String);
}

/* ------------------------------------------------------------------ *
 * walking one schema
 * ------------------------------------------------------------------ */

// Mongoose flattens nested objects into dotted paths ("atcDetails.atcName").
// Rebuild the nesting so the variable explorer can show a real tree.
function nestPaths(schema) {
  const root = { children: new Map(), schemaType: null };
  for (const [path, schemaType] of Object.entries(schema.paths)) {
    if (path === "__v") continue;
    const parts = path.split(".");
    let node = root;
    parts.forEach((part, i) => {
      if (!node.children.has(part)) {
        node.children.set(part, { children: new Map(), schemaType: null, name: part });
      }
      node = node.children.get(part);
      if (i === parts.length - 1) node.schemaType = schemaType;
    });
  }
  return root;
}

function buildFieldNode({
  node,
  name,
  modelName,
  path,
  prefix,
  refDepth,
  nestDepth,
  seenRefs,
}) {
  const schemaType = node.schemaType;
  const fullPath = prefix ? `${prefix}.${name}` : name;

  // A synthetic grouping node (Mongoose had no SchemaType for it) — this is a
  // plain nested object literal such as `profile: { address: { city } }`.
  if (!schemaType) {
    const children = collectChildren({
      node,
      modelName,
      prefix: path,
      varPrefix: fullPath,
      refDepth,
      nestDepth: nestDepth + 1,
      seenRefs,
    });
    if (!children.length) return null;
    return {
      name,
      label: humanizeField(name),
      path,
      fullPath,
      type: VAR_TYPES.Object,
      required: false,
      nullable: true,
      enumValues: [],
      ref: "",
      isArray: false,
      description: `${humanizeField(name)} object`,
      children,
    };
  }

  const instance = schemaType.instance;
  const options = schemaType.options || {};
  const required = !!schemaType.isRequired || options.required === true || Array.isArray(options.required);
  const enumValues = enumOf(schemaType);

  const common = {
    name,
    label: humanizeField(name),
    path,
    fullPath,
    required,
    nullable: !required,
    enumValues,
    ref: "",
    isArray: false,
    description: "",
  };

  /* ---- arrays ---- */
  if (instance === "Array") {
    // Subdocument array: lessons: [{ title, duration }]
    const subSchema = schemaType.schema;
    if (subSchema && nestDepth < MAX_NEST_DEPTH) {
      const children = collectChildren({
        node: nestPaths(subSchema),
        modelName,
        prefix: path,
        varPrefix: `${fullPath}[]`,
        refDepth,
        nestDepth: nestDepth + 1,
        seenRefs,
      });
      return {
        ...common,
        type: arrayTypeLabel(VAR_TYPES.Object),
        itemType: VAR_TYPES.Object,
        isArray: true,
        description: `List of ${humanizeField(name)}`,
        children,
      };
    }
    // Array of refs: candidates: [{ type: ObjectId, ref: "Candidate" }]
    const caster = schemaType.caster;
    const casterRef = caster?.options?.ref || options?.type?.[0]?.ref;
    if (casterRef) {
      const children =
        refDepth < MAX_REF_DEPTH && !seenRefs.has(casterRef)
          ? refChildren(casterRef, path, `${fullPath}[]`, refDepth + 1, seenRefs)
          : [];
      return {
        ...common,
        type: arrayTypeLabel(VAR_TYPES.Reference),
        itemType: VAR_TYPES.Reference,
        isArray: true,
        ref: casterRef,
        description: `List of ${humanizeModel(casterRef)} references`,
        children,
      };
    }
    // Primitive array: tags: [String]
    const itemBase = baseTypeFor(caster?.instance) || VAR_TYPES.Unknown;
    const itemType = refineStringType(name, itemBase);
    return {
      ...common,
      type: arrayTypeLabel(itemType),
      itemType,
      isArray: true,
      enumValues: enumOf(caster),
      description: `List of ${itemType.toLowerCase()} values`,
    };
  }

  /* ---- single nested subdocument ---- */
  if (instance === "Embedded" && schemaType.schema && nestDepth < MAX_NEST_DEPTH) {
    const children = collectChildren({
      node: nestPaths(schemaType.schema),
      modelName,
      prefix: path,
      varPrefix: fullPath,
      refDepth,
      nestDepth: nestDepth + 1,
      seenRefs,
    });
    return {
      ...common,
      type: VAR_TYPES.Object,
      description: `${humanizeField(name)} object`,
      children,
    };
  }

  /* ---- reference ---- */
  if ((instance === "ObjectID" || instance === "ObjectId") && options.ref) {
    const refModel = options.ref;
    const children =
      refDepth < MAX_REF_DEPTH && !seenRefs.has(refModel)
        ? refChildren(refModel, path, fullPath, refDepth + 1, seenRefs)
        : [];
    return {
      ...common,
      type: VAR_TYPES.Reference,
      ref: refModel,
      description: `Reference to ${humanizeModel(refModel)}`,
      children,
    };
  }

  /* ---- scalar ---- */
  const base = baseTypeFor(instance);
  const type = refineStringType(name, base);
  return {
    ...common,
    type,
    description: enumValues.length
      ? `${humanizeField(name)} (one of: ${enumValues.join(", ")})`
      : humanizeField(name),
  };
}

function collectChildren({ node, modelName, prefix, varPrefix, refDepth, nestDepth, seenRefs }) {
  const out = [];
  for (const [name, child] of node.children) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (isBlockedField(modelName, path)) continue;
    const built = buildFieldNode({
      node: child,
      name,
      modelName,
      path,
      prefix: varPrefix,
      refDepth,
      nestDepth,
      seenRefs,
    });
    if (built) out.push(built);
  }
  return out;
}

// Fields of a referenced model, re-rooted under the referencing variable path.
function refChildren(refModel, ownerPath, varPrefix, refDepth, seenRefs) {
  const model = mongoose.models[refModel];
  if (!model || isBlockedModel(refModel)) return [];
  const nextSeen = new Set(seenRefs);
  nextSeen.add(refModel);
  return collectChildren({
    node: nestPaths(model.schema),
    modelName: refModel,
    prefix: "",
    varPrefix,
    refDepth,
    nestDepth: 0,
    seenRefs: nextSeen,
  }).map((f) => ({ ...f, sourceModel: refModel, ownerPath }));
}

/* ------------------------------------------------------------------ *
 * registry
 * ------------------------------------------------------------------ */

/** Introspect a single Mongoose model into a descriptor. */
export function describeModel(model) {
  const name = model.modelName;
  const fields = collectChildren({
    node: nestPaths(model.schema),
    modelName: name,
    prefix: "",
    varPrefix: camelize(name),
    refDepth: 0,
    nestDepth: 0,
    seenRefs: new Set([name]),
  });
  return {
    name,
    label: humanizeModel(name),
    key: camelize(name),
    collectionKey: pluralize(camelize(name)),
    collection: model.collection?.collectionName || "",
    fields,
  };
}

/**
 * Every model the CMS may look at, introspected. Models blocked by the field
 * policy (audit logs, activation tokens) are excluded entirely.
 */
export function buildSchemaRegistry() {
  const models = Object.values(mongoose.models)
    .filter((m) => m?.modelName && !isBlockedModel(m.modelName))
    .sort((a, b) => a.modelName.localeCompare(b.modelName));
  return models.map(describeModel);
}

// Introspection is pure and comparatively expensive, so it is memoised per
// process. "Sync Models" clears it.
let _cache = null;
let _cachedAt = 0;

export function getSchemaRegistry({ refresh = false } = {}) {
  if (refresh || !_cache) {
    _cache = buildSchemaRegistry();
    _cachedAt = Date.now();
  }
  return _cache;
}

export function schemaRegistryStamp() {
  return _cachedAt;
}

export function clearSchemaRegistryCache() {
  _cache = null;
  _cachedAt = 0;
}

/** Look up one model descriptor by model name. */
export function getModelDescriptor(modelName) {
  return getSchemaRegistry().find((m) => m.name === modelName) || null;
}

/** Flatten a model's field tree into dotted paths → field node. */
export function flattenFields(fields, out = new Map(), basePath = "") {
  for (const f of fields || []) {
    const path = basePath ? `${basePath}.${f.name}` : f.name;
    out.set(path, f);
    if (f.children?.length) flattenFields(f.children, out, f.isArray ? `${path}[]` : path);
  }
  return out;
}

/**
 * True when `path` is a real, exposable field of `modelName`. Used by the
 * query engine to validate filter/sort fields before they touch Mongo.
 */
export function isQueryableField(modelName, path) {
  const desc = getModelDescriptor(modelName);
  if (!desc) return false;
  if (isBlockedField(modelName, path)) return false;
  const model = mongoose.models[modelName];
  if (!model) return false;
  if (path === "_id" || path === "createdAt" || path === "updatedAt") {
    return !!model.schema.paths[path] || path === "_id";
  }
  return !!model.schema.path(path);
}
