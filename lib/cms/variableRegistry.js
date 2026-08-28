/**
 * Variable registry — the single source of truth for "what can a page bind to".
 *
 * Combines three things:
 *   1. automatically discovered Mongoose fields (lib/cms/schemaRegistry)
 *   2. owner-defined custom variables (CmsVariable, kind "custom")
 *   3. owner annotations on discovered fields (CmsVariable, kind "schema")
 *
 * Server-only — it reads the database.
 */
import connectDB from "@/utils/db";
import CmsVariable from "@/models/CmsVariable";
import CmsRegistryState from "@/models/CmsRegistryState";
import { getSchemaRegistry, clearSchemaRegistryCache, humanizeModel } from "@/lib/cms/schemaRegistry";
import { VAR_TYPES } from "@/lib/cms/types";

/** Category shown in the Variables sidebar for a model. */
function categoryFor(modelName) {
  return humanizeModel(modelName);
}

/**
 * Walk one model's field tree into flat variable descriptors.
 * Array children are emitted as `courses[].title` so the picker can show the
 * shape of a repeat item.
 */
function flattenModel(model, fields, prefix, out) {
  for (const f of fields || []) {
    const name = `${prefix}.${f.name}`;
    out.push({
      name,
      label: f.label,
      type: f.type,
      itemType: f.itemType || null,
      source: f.sourceModel || model.name,
      path: f.path,
      ref: f.ref || "",
      category: categoryFor(model.name),
      required: !!f.required,
      nullable: f.nullable !== false,
      enumValues: f.enumValues || [],
      isArray: !!f.isArray,
      description: f.description || "",
      kind: "schema",
      deprecated: false,
    });
    if (f.children?.length) {
      flattenModel(model, f.children, f.isArray ? `${name}[]` : name, out);
    }
  }
}

/** All schema-derived variables, flat. */
export function schemaVariables({ refresh = false } = {}) {
  const registry = getSchemaRegistry({ refresh });
  const out = [];
  for (const model of registry) {
    // The model root itself is a bindable variable (a single document) and its
    // plural is the natural name for a collection of them.
    out.push({
      name: model.key,
      label: model.label,
      type: VAR_TYPES.Object,
      source: model.name,
      path: "",
      ref: model.name,
      category: categoryFor(model.name),
      required: false,
      nullable: true,
      enumValues: [],
      isArray: false,
      description: `A single ${model.label} document`,
      kind: "schema",
      deprecated: false,
      isRoot: true,
    });
    out.push({
      name: model.collectionKey,
      label: `${model.label} (list)`,
      type: `Array<${VAR_TYPES.Reference}>`,
      itemType: VAR_TYPES.Reference,
      source: model.name,
      path: "",
      ref: model.name,
      category: categoryFor(model.name),
      required: false,
      nullable: true,
      enumValues: [],
      isArray: true,
      description: `A list of ${model.label} documents — use it as a Repeat collection`,
      kind: "schema",
      deprecated: false,
      isRoot: true,
    });
    flattenModel(model, model.fields, model.key, out);
  }
  return out;
}

/** The nested tree the Variable Explorer renders. */
export function schemaTree({ refresh = false } = {}) {
  return getSchemaRegistry({ refresh }).map((m) => ({
    name: m.name,
    label: m.label,
    key: m.key,
    collectionKey: m.collectionKey,
    category: categoryFor(m.name),
    fields: m.fields,
  }));
}

/* ------------------------------------------------------------------ *
 * merged registry (schema + database)
 * ------------------------------------------------------------------ */

function serializeCustom(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    label: doc.label || doc.name,
    type: doc.type || VAR_TYPES.String,
    source: doc.source || "",
    path: doc.path || "",
    ref: doc.ref || "",
    category: doc.category || "Custom Variables",
    required: !!doc.required,
    nullable: doc.nullable !== false,
    enumValues: Array.isArray(doc.validation?.options) ? doc.validation.options : [],
    isArray: String(doc.type || "").startsWith("Array"),
    description: doc.description || "",
    value: doc.value,
    defaultValue: doc.defaultValue,
    scope: doc.scope || "global",
    validation: doc.validation || {},
    kind: "custom",
    deprecated: !!doc.deprecated,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

/**
 * Full variable list: discovered fields (with any stored description /
 * deprecation applied) followed by custom variables.
 */
export async function getVariables({ refresh = false } = {}) {
  await connectDB();
  const docs = await CmsVariable.find({}).lean();
  const byName = new Map(docs.map((d) => [d.name, d]));

  const schema = schemaVariables({ refresh }).map((v) => {
    const stored = byName.get(v.name);
    if (!stored) return v;
    return {
      ...v,
      id: String(stored._id),
      description: stored.description || v.description,
      label: stored.label || v.label,
      deprecated: false, // it exists in the live schema, so it is not deprecated
    };
  });
  const schemaNames = new Set(schema.map((v) => v.name));

  const custom = docs
    .filter((d) => d.kind === "custom")
    .map(serializeCustom)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Annotations left behind for fields that no longer exist — surfaced so
  // existing pages warn instead of silently rendering blanks.
  const missing = docs
    .filter((d) => d.kind === "schema" && !schemaNames.has(d.name))
    .map((d) => ({
      ...serializeCustom(d),
      kind: "schema",
      deprecated: true,
      description: d.description || "Field no longer present in the schema",
    }));

  return [...schema, ...custom, ...missing];
}

/** Values of custom variables, keyed for the page data context ("site.name"). */
export async function getCustomVariableContext() {
  await connectDB();
  const docs = await CmsVariable.find({ kind: "custom" }).lean();
  const ctx = {};
  for (const doc of docs) {
    const value = doc.value === "" || doc.value === null || doc.value === undefined
      ? doc.defaultValue
      : doc.value;
    const parts = String(doc.name || "").split(".").filter(Boolean);
    if (!parts.length) continue;
    let node = ctx;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = value;
      } else {
        if (typeof node[part] !== "object" || node[part] === null) node[part] = {};
        node = node[part];
      }
    });
  }
  return ctx;
}

/** Categories for the Variables sidebar, with counts. */
export function categoriesFrom(variables) {
  const counts = new Map();
  for (const v of variables) {
    counts.set(v.category, (counts.get(v.category) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (a.name === "Custom Variables") return 1;
      if (b.name === "Custom Variables") return -1;
      return a.name.localeCompare(b.name);
    });
}

/* ------------------------------------------------------------------ *
 * sync
 * ------------------------------------------------------------------ */

/**
 * Rescan the live Mongoose schemas.
 *
 * Nothing is deleted: a stored annotation whose field disappeared is flagged
 * `deprecated` (so pages using it show a builder warning and fall back
 * gracefully), and un-flagged again if the field comes back.
 */
export async function syncVariables({ email = "" } = {}) {
  await connectDB();
  clearSchemaRegistryCache();

  const discovered = schemaVariables({ refresh: true });
  const discoveredNames = new Set(discovered.map((v) => v.name));
  const registry = getSchemaRegistry();

  const stored = await CmsVariable.find({ kind: "schema" }).lean();
  const storedNames = new Set(stored.map((d) => d.name));

  const nowDeprecated = stored.filter((d) => !d.deprecated && !discoveredNames.has(d.name));
  const restored = stored.filter((d) => d.deprecated && discoveredNames.has(d.name));

  if (nowDeprecated.length) {
    await CmsVariable.updateMany(
      { _id: { $in: nowDeprecated.map((d) => d._id) } },
      { $set: { deprecated: true, deprecatedAt: new Date() } }
    );
  }
  if (restored.length) {
    await CmsVariable.updateMany(
      { _id: { $in: restored.map((d) => d._id) } },
      { $set: { deprecated: false, deprecatedAt: null } }
    );
  }

  const added = discovered.filter((v) => !storedNames.has(v.name)).length;

  const state = await CmsRegistryState.findOneAndUpdate(
    { singleton: "registry" },
    {
      $set: {
        lastSyncedAt: new Date(),
        modelCount: registry.length,
        variableCount: discovered.length,
        addedCount: added,
        deprecatedCount: nowDeprecated.length,
        restoredCount: restored.length,
        lastSyncedByEmail: email,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    models: registry.length,
    variables: discovered.length,
    added,
    deprecated: nowDeprecated.map((d) => d.name),
    restored: restored.map((d) => d.name),
    lastSyncedAt: state?.lastSyncedAt ? new Date(state.lastSyncedAt).toISOString() : null,
  };
}

export async function getRegistryState() {
  await connectDB();
  const state = await CmsRegistryState.findOne({ singleton: "registry" }).lean();
  const registry = getSchemaRegistry();
  return {
    lastSyncedAt: state?.lastSyncedAt ? new Date(state.lastSyncedAt).toISOString() : null,
    modelCount: registry.length,
    variableCount: schemaVariables().length,
    deprecatedCount: state?.deprecatedCount || 0,
  };
}
