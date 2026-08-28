/**
 * The page's own data as bindable variables.
 *
 * The variable registry describes what the database *could* offer — every field
 * of every model. What it cannot know is what this particular page has asked
 * for: a page that defines a count source called `programmeCount` publishes
 * `{{programmeCount}}` into its own context, and until now that name appeared
 * nowhere in the picker. An author had to remember it and type it by hand,
 * which is the same as not having the variable at all.
 *
 * This derives those names from the page's data sources and dynamic route, in
 * the same shape the registry uses, so the pickers, the autocomplete and the
 * variables panel all show them alongside everything else.
 *
 * Pure and client-safe: it reads only the page config and the already-loaded
 * schema tree.
 */

/** The category every page-owned variable is filed under. */
export const PAGE_CATEGORY = "This page";

/** Descriptor for one bindable name. */
function variable(name, { label, type, ref = "", description, isArray = false }) {
  return {
    name,
    label,
    type,
    itemType: null,
    source: ref || "",
    path: "",
    ref,
    category: PAGE_CATEGORY,
    required: false,
    nullable: true,
    enumValues: [],
    isArray,
    description,
    kind: "source",
    deprecated: false,
  };
}

/** The model node in the loaded schema tree, by model name. */
function modelNode(tree, model) {
  return (tree || []).find((m) => m.name === model) || null;
}

/**
 * Re-root a model's fields under a new prefix.
 * `candidate.profile.url` under prefix `learner` becomes `learner.profile.url`.
 */
function reroot(fields, prefix, out, depth = 0) {
  // Deep models (Course Reference has 216 fields) would drown the picker; two
  // levels is what an author binds to in practice.
  if (depth > 1) return;
  for (const f of fields || []) {
    const name = `${prefix}.${f.name}`;
    out.push({
      ...f,
      name,
      fullPath: name,
      category: PAGE_CATEGORY,
      kind: "source",
      source: "",
      deprecated: false,
    });
    if (f.children?.length) {
      reroot(f.children, f.isArray ? `${name}[]` : name, out, depth + 1);
    }
  }
}

/**
 * Variables published by this page.
 *
 * @param sources       the page's dataSources array
 * @param tree          the loaded schema tree (for a source's model fields)
 * @param dynamicRoute  the page's dynamicRoute config, if enabled
 */
export function sourceVariables(sources, tree = [], dynamicRoute = null) {
  const out = [];
  const seen = new Set();
  const add = (v) => {
    if (!v.name || seen.has(v.name)) return;
    seen.add(v.name);
    out.push(v);
  };

  for (const s of Array.isArray(sources) ? sources : []) {
    const key = String(s?.key || "").trim();
    if (!key) continue;
    const model = String(s?.model || "");
    const node = modelNode(tree, model);
    const modelLabel = node?.label || model || "record";
    const mode = s?.mode === "single" || s?.mode === "count" ? s.mode : "list";

    if (mode === "count") {
      add(
        variable(key, {
          label: s?.label || `${modelLabel} count`,
          type: "Number",
          description: `How many ${modelLabel} records match this page's filter`,
        })
      );
      continue;
    }

    if (mode === "single") {
      add(
        variable(key, {
          label: s?.label || modelLabel,
          type: "Object",
          ref: model,
          description: `One ${modelLabel} record, loaded by this page`,
        })
      );
      const fields = [];
      reroot(node?.fields, key, fields);
      fields.forEach(add);
      continue;
    }

    add(
      variable(key, {
        label: s?.label || `${modelLabel} list`,
        type: "Array<Reference>",
        ref: model,
        isArray: true,
        description: `${modelLabel} records loaded by this page — use a Repeat block`,
      })
    );
    // Inside a Repeat the item is addressed as `key[]`, matching the registry's
    // own notation for array children.
    const fields = [];
    reroot(node?.fields, `${key}[]`, fields);
    fields.forEach(add);
  }

  if (dynamicRoute?.enabled) {
    const key = String(dynamicRoute.itemKey || "item").trim();
    const model = String(dynamicRoute.model || "");
    const node = modelNode(tree, model);
    if (key) {
      add(
        variable(key, {
          label: `${node?.label || model || "Item"} (from the URL)`,
          type: "Object",
          ref: model,
          description: `The record this URL resolves to, looked up by ${dynamicRoute.lookupField || "slug"}`,
        })
      );
      const fields = [];
      reroot(node?.fields, key, fields);
      fields.forEach(add);
    }
    const param = String(dynamicRoute.paramName || "slug").trim();
    if (param) {
      add(
        variable(`params.${param}`, {
          label: `URL parameter: ${param}`,
          type: "String",
          description: "The value taken from the address bar",
        })
      );
    }
  }

  return out;
}

/** The same variables as one synthetic tree node, for the variables panel. */
export function sourceTreeNode(variables) {
  if (!variables.length) return null;
  return {
    name: "__page",
    label: PAGE_CATEGORY,
    key: "",
    collectionKey: "",
    category: PAGE_CATEGORY,
    // Only the top-level names; the nested ones are reachable through the flat
    // list and would repeat the whole model here.
    fields: variables
      .filter((v) => !v.name.includes("."))
      .map((v) => ({
        name: v.name,
        label: v.label,
        path: v.name,
        fullPath: v.name,
        type: v.type,
        required: false,
        nullable: true,
        enumValues: [],
        ref: v.ref || "",
        isArray: !!v.isArray,
        description: v.description || "",
      })),
  };
}
