/**
 * Variable import / export — client-safe validation shared by the API route
 * and the import preview UI, so the preview shows exactly what the server will
 * do rather than a guess.
 */
import { TYPE_LIST, isArrayType, arrayItemType, VAR_TYPES } from "@/lib/cms/types";

export const EXPORT_VERSION = 1;

const EXPORT_FIELDS = [
  "name", "type", "source", "path", "ref", "category", "label", "description",
  "required", "nullable", "isArray", "kind", "value", "defaultValue", "scope", "validation",
];

/** Serialise a variable list into the portable JSON envelope. */
export function buildExport(variables, { models = [] } = {}) {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    models,
    variables: (variables || []).map((v) => {
      const out = {};
      for (const key of EXPORT_FIELDS) {
        if (v[key] !== undefined) out[key] = v[key];
      }
      return out;
    }),
  };
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CSV_COLUMNS = ["name", "type", "source", "path", "ref", "category", "kind", "required", "nullable", "description"];

export function buildCsv(variables) {
  const rows = [CSV_COLUMNS.join(",")];
  for (const v of variables || []) {
    rows.push(CSV_COLUMNS.map((c) => csvCell(v[c])).join(","));
  }
  return rows.join("\n");
}

/** True when `type` is a name the type system understands. */
export function isValidType(type) {
  if (!type) return false;
  if (isArrayType(type)) {
    const item = arrayItemType(type);
    return item === null || TYPE_LIST.includes(item);
  }
  return TYPE_LIST.includes(type);
}

const NAME_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;

/**
 * Validate one incoming variable against the current registry.
 *
 * @returns { ok, errors[], warnings[], status, variable }
 *   status: "new" | "duplicate" | "invalid"
 */
export function validateImportItem(item, { existingNames = new Set(), modelNames = new Set() } = {}) {
  const errors = [];
  const warnings = [];

  const name = String(item?.name || "").trim();
  if (!name) errors.push("Missing variable name");
  else if (!NAME_RE.test(name)) errors.push(`"${name}" is not a valid variable name`);

  const type = item?.type || VAR_TYPES.String;
  if (!isValidType(type)) errors.push(`Unknown type "${type}"`);

  const source = item?.source ? String(item.source) : "";
  if (source && modelNames.size && !modelNames.has(source)) {
    errors.push(`Unknown model "${source}"`);
  }

  const ref = item?.ref ? String(item.ref) : "";
  if (ref && modelNames.size && !modelNames.has(ref)) {
    errors.push(`Unknown referenced model "${ref}"`);
  }

  const kind = item?.kind === "schema" ? "schema" : "custom";
  if (kind === "schema" && !source) {
    warnings.push("Schema variable without a source model — imported as an annotation only");
  }

  const duplicate = existingNames.has(name);
  if (duplicate) warnings.push("A variable with this name already exists");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    status: errors.length ? "invalid" : duplicate ? "duplicate" : "new",
    variable: {
      name,
      kind,
      type,
      source,
      path: item?.path ? String(item.path) : "",
      ref,
      label: item?.label ? String(item.label).slice(0, 120) : "",
      description: item?.description ? String(item.description).slice(0, 500) : "",
      category: item?.category ? String(item.category).slice(0, 80) : "Custom Variables",
      value: item?.value ?? "",
      defaultValue: item?.defaultValue ?? "",
      required: !!item?.required,
      nullable: item?.nullable !== false,
      scope: item?.scope === "environment" ? "environment" : "global",
      validation: item?.validation && typeof item.validation === "object" ? item.validation : {},
    },
  };
}

/**
 * Validate a whole import payload and produce the preview the UI shows before
 * anything is written.
 *
 * @param mode "skip" | "replace" | "createNew" — what to do with duplicates.
 */
export function planImport(payload, { existingNames = new Set(), modelNames = new Set(), mode = "skip" } = {}) {
  const raw = Array.isArray(payload) ? payload : payload?.variables;
  if (!Array.isArray(raw)) {
    return { ok: false, error: "Import file must contain a `variables` array", items: [], summary: null };
  }
  if (raw.length > 2000) {
    return { ok: false, error: "Too many variables in one import (max 2000)", items: [], summary: null };
  }

  const seen = new Set();
  const items = raw.map((item) => {
    const result = validateImportItem(item, { existingNames, modelNames });
    if (result.ok && seen.has(result.variable.name)) {
      result.warnings.push("Duplicated inside the import file — only the first is applied");
      result.action = "skip";
    }
    if (result.ok) seen.add(result.variable.name);

    if (!result.action) {
      if (!result.ok) result.action = "skip";
      else if (result.status === "duplicate") {
        result.action = mode === "replace" ? "replace" : mode === "createNew" ? "createNew" : "skip";
      } else result.action = "create";
    }
    return result;
  });

  const summary = {
    total: items.length,
    create: items.filter((i) => i.action === "create" || i.action === "createNew").length,
    replace: items.filter((i) => i.action === "replace").length,
    skip: items.filter((i) => i.action === "skip").length,
    invalid: items.filter((i) => !i.ok).length,
  };
  return { ok: true, error: null, items, summary };
}

/** Free name for the "create new" conflict strategy: site.name → site.name_2 */
export function uniqueName(name, existingNames) {
  if (!existingNames.has(name)) return name;
  let i = 2;
  while (existingNames.has(`${name}_${i}`)) i += 1;
  return `${name}_${i}`;
}
