/**
 * Visual condition engine — client-safe.
 *
 * A condition group is what the no-code condition builder produces:
 *
 *   { match: "all" | "any",
 *     rules: [ { left, op, right, rightIsVariable } | <nested group> ] }
 *
 * `left` and `right` are either plain literals or `{{ }}` templates resolved
 * through the expression engine, so authors never write code.
 */

import { resolveTemplate, isDynamic, getPath } from "@/lib/cms/expression";

export const OPERATORS = [
  { value: "==", label: "equals", arity: 2 },
  { value: "!=", label: "not equals", arity: 2 },
  { value: ">", label: "greater than", arity: 2 },
  { value: "<", label: "less than", arity: 2 },
  { value: ">=", label: "greater or equal", arity: 2 },
  { value: "<=", label: "less or equal", arity: 2 },
  { value: "contains", label: "contains", arity: 2 },
  { value: "notContains", label: "does not contain", arity: 2 },
  { value: "startsWith", label: "starts with", arity: 2 },
  { value: "endsWith", label: "ends with", arity: 2 },
  { value: "exists", label: "exists", arity: 1 },
  { value: "notExists", label: "does not exist", arity: 1 },
  { value: "isEmpty", label: "is empty", arity: 1 },
  { value: "isNotEmpty", label: "is not empty", arity: 1 },
  { value: "isTrue", label: "is true", arity: 1 },
  { value: "isFalse", label: "is false", arity: 1 },
  { value: "isBefore", label: "is before date", arity: 2 },
  { value: "isAfter", label: "is after date", arity: 2 },
  { value: "isPast", label: "is in the past", arity: 1 },
  { value: "isFuture", label: "is in the future", arity: 1 },
  { value: "isToday", label: "is today", arity: 1 },
  { value: "countEquals", label: "items count equals", arity: 2 },
  { value: "countGreaterThan", label: "items count >", arity: 2 },
  { value: "countLessThan", label: "items count <", arity: 2 },
  { value: "hasProperty", label: "has property", arity: 2 },
];

export const OPERATOR_VALUES = OPERATORS.map((o) => o.value);

export function operatorArity(op) {
  const norm = normalizeOperator(op);
  return OPERATORS.find((o) => o.value === norm)?.arity ?? 2;
}

function isMissing(v) {
  return v === undefined || v === null;
}

function isEmptyValue(v) {
  if (isMissing(v)) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

function toNumber(v) {
  const n = typeof v === "boolean" ? (v ? 1 : 0) : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function toDate(v) {
  if (isMissing(v)) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Loose equality that copes with "5" vs 5 and "true" vs true, object references,
// which is what a CMS author typing into a text box actually means.
function looseEquals(a, b) {
  if (a === b) return true;
  if (isMissing(a) || isMissing(b)) return isMissing(a) && isMissing(b);
  if (typeof a === "boolean" || typeof b === "boolean") {
    return String(a) === String(b);
  }
  // Reference / Object comparison (matching by ID, name, slug)
  if (typeof a === "object" && a !== null) {
    if (a._id && looseEquals(String(a._id), b)) return true;
    if (a.id && looseEquals(String(a.id), b)) return true;
    if (a.name && looseEquals(String(a.name), b)) return true;
    if (a.title && looseEquals(String(a.title), b)) return true;
    if (a.slug && looseEquals(String(a.slug), b)) return true;
  }
  if (typeof b === "object" && b !== null) {
    if (b._id && looseEquals(a, String(b._id))) return true;
    if (b.id && looseEquals(a, String(b.id))) return true;
    if (b.name && looseEquals(a, String(b.name))) return true;
    if (b.title && looseEquals(a, String(b.title))) return true;
    if (b.slug && looseEquals(a, String(b.slug))) return true;
  }
  const na = toNumber(a);
  const nb = toNumber(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  return String(a) === String(b);
}

/** Apply one operator to already-resolved operands. */
const WORD_OP_MAP = {
  equals: "==",
  not_equals: "!=",
  notEquals: "!=",
  greater_than: ">",
  greaterThan: ">",
  less_than: "<",
  lessThan: "<",
  greater_or_equal: ">=",
  greaterThanOrEqual: ">=",
  less_or_equal: "<=",
  lessThanOrEqual: "<=",
  is_empty: "isEmpty",
  is_not_empty: "isNotEmpty",
  is_true: "isTrue",
  is_false: "isFalse",
  not_exists: "notExists",
  before: "isBefore",
  after: "isAfter",
  past: "isPast",
  future: "isFuture",
  today: "isToday",
  count_equals: "countEquals",
  count_greater_than: "countGreaterThan",
  count_less_than: "countLessThan",
  has_property: "hasProperty",
};

export function normalizeOperator(op) {
  return WORD_OP_MAP[op] || op;
}

export function applyOperator(op, left, right) {
  const normOp = normalizeOperator(op);
  switch (normOp) {
    case "==":
      return looseEquals(left, right);
    case "!=":
      return !looseEquals(left, right);
    case ">":
      return toNumber(left) > toNumber(right);
    case "<":
      return toNumber(left) < toNumber(right);
    case ">=":
      return toNumber(left) >= toNumber(right);
    case "<=":
      return toNumber(left) <= toNumber(right);
    case "contains":
      if (Array.isArray(left)) return left.some((x) => looseEquals(x, right));
      return String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase());
    case "notContains":
      if (Array.isArray(left)) return !left.some((x) => looseEquals(x, right));
      return !String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase());
    case "startsWith":
      return String(left ?? "").toLowerCase().startsWith(String(right ?? "").toLowerCase());
    case "endsWith":
      return String(left ?? "").toLowerCase().endsWith(String(right ?? "").toLowerCase());
    case "exists":
      return !isMissing(left);
    case "notExists":
      return isMissing(left);
    case "isEmpty":
      return isEmptyValue(left);
    case "isNotEmpty":
      return !isEmptyValue(left);
    case "isTrue":
      return left === true || String(left) === "true";
    case "isFalse":
      return left === false || String(left) === "false";
    case "isBefore": {
      const dL = toDate(left), dR = toDate(right);
      return dL && dR ? dL.getTime() < dR.getTime() : false;
    }
    case "isAfter": {
      const dL = toDate(left), dR = toDate(right);
      return dL && dR ? dL.getTime() > dR.getTime() : false;
    }
    case "isPast": {
      const dL = toDate(left);
      return dL ? dL.getTime() < Date.now() : false;
    }
    case "isFuture": {
      const dL = toDate(left);
      return dL ? dL.getTime() > Date.now() : false;
    }
    case "isToday": {
      const dL = toDate(left);
      if (!dL) return false;
      const now = new Date();
      return (
        dL.getUTCFullYear() === now.getUTCFullYear() &&
        dL.getUTCMonth() === now.getUTCMonth() &&
        dL.getUTCDate() === now.getUTCDate()
      );
    }
    case "countEquals": {
      const count = Array.isArray(left) ? left.length : 0;
      return count === toNumber(right);
    }
    case "countGreaterThan": {
      const count = Array.isArray(left) ? left.length : 0;
      return count > toNumber(right);
    }
    case "countLessThan": {
      const count = Array.isArray(left) ? left.length : 0;
      return count < toNumber(right);
    }
    case "hasProperty": {
      if (!left || typeof left !== "object") return false;
      return String(right || "").trim() in left;
    }
    default:
      return true;
  }
}

// The left side of a rule is normally a plain variable path picked from the
// variable tree; it may also be a full `{{ }}` template, or a structured binding AST
function resolveOperand(raw, ctx, treatAsPath) {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "object") {
    if (raw.type === "binding") {
      const p = Array.isArray(raw.path) ? raw.path.join(".") : raw.path;
      const val = getPath(ctx, p);
      return val !== undefined && val !== null ? val : raw.fallback;
    }
    if (raw.binding) {
      const val = getPath(ctx, raw.binding);
      return val !== undefined && val !== null ? val : raw.fallback;
    }
    return raw;
  }
  if (typeof raw !== "string") return raw;
  if (isDynamic(raw)) return resolveTemplate(raw, ctx);
  if (treatAsPath && /^[A-Za-z_$][A-Za-z0-9_$.[\]]*$/.test(raw.trim())) {
    return getPath(ctx, raw.trim());
  }
  return raw;
}

function isGroup(node) {
  return node && (Array.isArray(node.rules) || Array.isArray(node.conditions));
}

/**
 * Evaluate a condition group or condition AST.
 * Supports both:
 *   { match: "all" | "any", rules: [...] }
 * and
 *   { operator: "and" | "or", conditions: [...] }
 */
export function evaluateConditions(group, ctx) {
  if (!group) return true;
  if (group.enabled === false) return true;
  const rules = Array.isArray(group.rules)
    ? group.rules
    : Array.isArray(group.conditions)
    ? group.conditions
    : [];
  if (!rules.length) return true;

  const match = (group.match === "any" || group.operator === "or") ? "any" : "all";
  const results = rules.map((rule) => {
    if (isGroup(rule)) return evaluateConditions(rule, ctx);
    const left = resolveOperand(rule.left, ctx, true);
    const op = normalizeOperator(rule.op || rule.operator || "==");
    const arity = operatorArity(op);
    const right = arity === 1 ? undefined : resolveOperand(rule.right, ctx, !!rule.rightIsVariable);
    return applyOperator(op, left, right);
  });

  return match === "any" ? results.some(Boolean) : results.every(Boolean);
}

/** A blank rule for the condition builder UI. */
export function newRule() {
  return { left: "", op: "==", right: "", rightIsVariable: false };
}

export function newGroup() {
  return { enabled: true, match: "all", rules: [newRule()] };
}

/** Human-readable summary shown on the collapsed condition card. */
export function describeConditions(group) {
  if (!group || group.enabled === false) return "";
  const rules = Array.isArray(group.rules) ? group.rules : [];
  if (!rules.length) return "";
  const join = group.match === "any" ? " OR " : " AND ";
  return rules
    .map((r) => {
      if (isGroup(r)) return `(${describeConditions(r)})`;
      const label = OPERATORS.find((o) => o.value === r.op)?.label || r.op;
      return operatorArity(r.op) === 1
        ? `${r.left} ${label}`
        : `${r.left} ${label} ${r.right}`;
    })
    .join(join);
}
