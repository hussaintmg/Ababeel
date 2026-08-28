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
];

export const OPERATOR_VALUES = OPERATORS.map((o) => o.value);

export function operatorArity(op) {
  return OPERATORS.find((o) => o.value === op)?.arity ?? 2;
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

// Loose equality that copes with "5" vs 5 and "true" vs true, which is what a
// CMS author typing into a text box actually means.
function looseEquals(a, b) {
  if (a === b) return true;
  if (isMissing(a) || isMissing(b)) return isMissing(a) && isMissing(b);
  if (typeof a === "boolean" || typeof b === "boolean") {
    return String(a) === String(b);
  }
  const na = toNumber(a);
  const nb = toNumber(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  return String(a) === String(b);
}

/** Apply one operator to already-resolved operands. */
export function applyOperator(op, left, right) {
  switch (op) {
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
    default:
      return true;
  }
}

// The left side of a rule is normally a plain variable path picked from the
// variable tree; it may also be a full `{{ }}` template.
function resolveOperand(raw, ctx, treatAsPath) {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "string") return raw;
  if (isDynamic(raw)) return resolveTemplate(raw, ctx);
  if (treatAsPath && /^[A-Za-z_$][A-Za-z0-9_$.[\]]*$/.test(raw.trim())) {
    return getPath(ctx, raw.trim());
  }
  return raw;
}

function isGroup(node) {
  return node && Array.isArray(node.rules);
}

/**
 * Evaluate a condition group. An empty / disabled group is always true, so a
 * block with no conditions renders exactly as it did before this feature.
 */
export function evaluateConditions(group, ctx) {
  if (!group) return true;
  if (group.enabled === false) return true;
  const rules = Array.isArray(group.rules) ? group.rules : [];
  if (!rules.length) return true;

  const match = group.match === "any" ? "any" : "all";
  const results = rules.map((rule) => {
    if (isGroup(rule)) return evaluateConditions(rule, ctx);
    const left = resolveOperand(rule.left, ctx, true);
    const arity = operatorArity(rule.op);
    const right = arity === 1 ? undefined : resolveOperand(rule.right, ctx, !!rule.rightIsVariable);
    return applyOperator(rule.op, left, right);
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
