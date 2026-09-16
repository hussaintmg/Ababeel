/**
 * Canonical CMS Contracts & Architecture Definitions
 * 
 * Strict architectural separation between:
 * 1. Model Schema (CMSModelDefinition) - describes what data exists structurally
 * 2. Data Source Definition (CMSDataSourceDefinition) - describes how data will be obtained
 * 3. Query (CMSQuery) - safe server-side query filters, sort, limits
 * 4. Runtime Result (CMSQueryResult) - normalized { items, pagination, meta } or single record
 * 5. Binding (CMSBinding) - structured accessors and paths
 * 6. Scope (CMSScope) - lexical scope stack (loop items, page data, route params, site globals)
 * 7. Component Property - component inputs (static, dynamic, expression)
 */

export const FIELD_VISIBILITY = {
  PUBLIC: "publicReadable",
  AUTHENTICATED: "authenticatedReadable",
  PRIVATE: "private",
};

export const DATA_SOURCE_OPERATIONS = {
  FIND_MANY: "findMany",
  FIND_ONE: "findOne",
  FIND_BY_ID: "findById",
  FIND_BY_SLUG: "findBySlug",
  CURRENT_USER: "currentUser",
  ROUTE_PARAM: "routeParam",
  RELATED_RECORDS: "relatedRecords",
  STATIC: "static",
  AGGREGATE: "aggregate",
  COUNT: "count",
};

export const SCOPE_TYPES = {
  LOOP: "loop",
  PAGE: "page",
  ROUTE: "route",
  SITE: "site",
  GLOBAL: "global",
};

export const COMPATIBILITY_STATES = {
  RECOMMENDED: "recommended",
  CONVERTIBLE: "convertible",
  INCOMPATIBLE: "incompatible",
};

export const WHITELISTED_TRANSFORMS = {
  // Text transforms
  uppercase: { id: "uppercase", label: "UPPERCASE", category: "text" },
  lowercase: { id: "lowercase", label: "lowercase", category: "text" },
  capitalize: { id: "capitalize", label: "Capitalize", category: "text" },
  truncate: { id: "truncate", label: "Truncate", category: "text", args: ["length"] },
  trim: { id: "trim", label: "Trim", category: "text" },
  slug: { id: "slug", label: "Slugify", category: "text" },
  prefix: { id: "prefix", label: "Prefix", category: "text", args: ["text"] },
  suffix: { id: "suffix", label: "Suffix", category: "text", args: ["text"] },

  // Number transforms
  currency: { id: "currency", label: "Currency (£/$/€)", category: "number", args: ["currencyCode"] },
  formatNumber: { id: "formatNumber", label: "Formatted Number", category: "number", args: ["decimals"] },
  percentage: { id: "percentage", label: "Percentage (%)", category: "number" },
  round: { id: "round", label: "Round", category: "number" },
  ceil: { id: "ceil", label: "Ceiling", category: "number" },
  floor: { id: "floor", label: "Floor", category: "number" },

  // Date transforms
  formatDate: { id: "formatDate", label: "Date (e.g. 12 Oct 2026)", category: "date", args: ["format"] },
  time: { id: "time", label: "Time", category: "date" },
  relative: { id: "relative", label: "Relative (e.g. 2 days ago)", category: "date" },

  // Array transforms
  count: { id: "count", label: "Item Count", category: "array" },
  first: { id: "first", label: "First Item", category: "array" },
  last: { id: "last", label: "Last Item", category: "array" },
  join: { id: "join", label: "Join to text", category: "array", args: ["delimiter"] },

  // Media transforms
  url: { id: "url", label: "Media URL", category: "media" },
  alt: { id: "alt", label: "Alt Text", category: "media" },
};

/**
 * Normalizes collection and record results to a stable, predictable contract
 * across editor, preview, public renderer, and SDK.
 */
export function normalizeQueryResult({
  operation = DATA_SOURCE_OPERATIONS.FIND_MANY,
  model = "",
  items = [],
  single = null,
  total = 0,
  page = 1,
  limit = 20,
  hasNextPage = false,
  hasPrevPage = false,
  error = null,
  meta = {},
} = {}) {
  const isSingle =
    operation === DATA_SOURCE_OPERATIONS.FIND_ONE ||
    operation === DATA_SOURCE_OPERATIONS.FIND_BY_ID ||
    operation === DATA_SOURCE_OPERATIONS.FIND_BY_SLUG ||
    operation === DATA_SOURCE_OPERATIONS.CURRENT_USER;

  const isCount = operation === DATA_SOURCE_OPERATIONS.COUNT;

  if (isCount) {
    return {
      value: typeof total === "number" ? total : 0,
      total: typeof total === "number" ? total : 0,
      error: error || null,
      meta: { model, operation, ...meta },
    };
  }

  if (isSingle) {
    return {
      item: single || null,
      error: error || null,
      meta: { model, operation, ...meta },
    };
  }

  const safeItems = Array.isArray(items) ? items : items ? [items] : [];
  const safeTotal = typeof total === "number" ? total : safeItems.length;
  const safeLimit = Math.max(1, limit || 20);
  const totalPages = Math.ceil(safeTotal / safeLimit) || 1;

  return {
    items: safeItems,
    pagination: {
      page: Math.max(1, page || 1),
      limit: safeLimit,
      total: safeTotal,
      totalPages,
      hasNextPage: hasNextPage || page < totalPages,
      hasPrevPage: hasPrevPage || page > 1,
    },
    error: error || null,
    meta: {
      model,
      operation,
      itemCount: safeItems.length,
      ...meta,
    },
  };
}

/**
 * Creates a typed structured CMS binding
 */
export function createStructuredBinding({
  scope = SCOPE_TYPES.PAGE,
  source = "",
  alias = "",
  path = [],
  fallback = undefined,
  transform = undefined,
  transformArgs = [],
}) {
  return {
    type: "binding",
    scope,
    source,
    alias,
    path: Array.isArray(path) ? path : String(path).split(".").filter(Boolean),
    fallback,
    transform,
    transformArgs,
  };
}

/**
 * Validates if an object is a structured binding definition
 */
export function isStructuredBinding(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    val.type === "binding" &&
    Array.isArray(val.path)
  );
}

/**
 * Lexical Scope Frame Descriptor
 */
export class CMSScopeFrame {
  constructor({
    type = SCOPE_TYPES.LOOP,
    alias = "item",
    data = null,
    source = "",
    index = 0,
    total = 1,
    parent = null,
    metadata = {},
  }) {
    this.type = type;
    this.alias = alias;
    this.data = data;
    this.source = source;
    this.index = index;
    this.total = total;
    this.parent = parent;
    this.metadata = {
      index,
      number: index + 1,
      first: index === 0,
      last: index === total - 1,
      odd: index % 2 === 0,
      even: index % 2 === 1,
      count: total,
      ...metadata,
    };
  }

  /**
   * Resolves a path starting with the frame's alias or loop namespace.
   * e.g. "course.title", "loop.index", "first", "index"
   */
  resolve(part, remainingParts = []) {
    // 1. Loop metadata namespace: loop.index, loop.first, etc.
    if (part === "loop" || part === "$loop") {
      const metaKey = remainingParts[0];
      if (metaKey && metaKey in this.metadata) {
        return { found: true, value: this.metadata[metaKey] };
      }
    }

    // 2. Loop metadata directly if matching: index, first, last, number
    if (remainingParts.length === 0 && part in this.metadata) {
      return { found: true, value: this.metadata[part] };
    }

    // 3. Alias match: e.g. alias is "course", part is "course"
    if (part === this.alias) {
      let cur = this.data;
      for (const p of remainingParts) {
        if (cur === null || cur === undefined) return { found: false };
        cur = cur[p];
      }
      return { found: true, value: cur };
    }

    // 4. If part is not our alias, delegate to parent scope
    if (this.parent) {
      return this.parent.resolve(part, remainingParts);
    }

    return { found: false };
  }
}
