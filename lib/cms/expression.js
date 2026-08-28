/**
 * Safe expression + template engine for the dynamic CMS.
 *
 * Two syntaxes live inside ordinary block property strings, which is what
 * makes the whole thing backward compatible: a property with no `{{ }}` in it
 * is static text and is returned untouched.
 *
 *   {{ course.title }}                     variable
 *   {{ course.price | currency:GBP }}      variable through a pipe chain
 *   {{= course.price * 0.8 }}              formula (arithmetic / logic)
 *
 * Nothing here ever calls eval/Function — formulas go through a hand-written
 * recursive-descent parser that only understands literals, paths, a fixed
 * operator set and a whitelist of helper functions. CMS authors therefore
 * cannot execute JavaScript, reach the filesystem, or build a Mongo query.
 */

/* ------------------------------------------------------------------ *
 * path access
 * ------------------------------------------------------------------ */

// "course.instructor.firstName" / "courses[0].title" → ["course","instructor",…]
export function parsePath(path) {
  const out = [];
  const re = /[^.[\]]+/g;
  let m;
  while ((m = re.exec(String(path || "")))) out.push(m[0]);
  return out;
}

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/** Read `path` out of `ctx`. Returns undefined for any missing hop. */
export function getPath(ctx, path) {
  const parts = Array.isArray(path) ? path : parsePath(path);
  let cur = ctx;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (UNSAFE_KEYS.has(part)) return undefined;
    if (Array.isArray(cur) && /^\d+$/.test(part)) {
      cur = cur[Number(part)];
      continue;
    }
    if (typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
}

/* ------------------------------------------------------------------ *
 * helper functions (the only callables an author can reach)
 * ------------------------------------------------------------------ */

function asDate(v) {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string" && v) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const DATE_PRESETS = {
  short: { dateStyle: "short" },
  medium: { dateStyle: "medium" },
  long: { dateStyle: "long" },
  full: { dateStyle: "full" },
  datetime: { dateStyle: "medium", timeStyle: "short" },
  time: { timeStyle: "short" },
};

export const FUNCTIONS = {
  concat: (...args) => args.map((a) => (a == null ? "" : String(a))).join(""),
  uppercase: (v) => String(v ?? "").toUpperCase(),
  lowercase: (v) => String(v ?? "").toLowerCase(),
  capitalize: (v) => {
    const s = String(v ?? "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  },
  trim: (v) => String(v ?? "").trim(),
  formatDate: (v, preset = "medium", locale = "en-GB") => {
    const d = asDate(v);
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat(locale, DATE_PRESETS[preset] || DATE_PRESETS.medium).format(d);
    } catch {
      return d.toISOString().slice(0, 10);
    }
  },
  formatNumber: (v, decimals = 0, locale = "en-GB") => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    const d = Math.min(Math.max(parseInt(decimals, 10) || 0, 0), 10);
    try {
      return new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
    } catch {
      return n.toFixed(d);
    }
  },
  currency: (v, code = "GBP", locale = "en-GB") => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: String(code).toUpperCase() }).format(n);
    } catch {
      return `${code} ${n.toFixed(2)}`;
    }
  },
  truncate: (v, len = 100, suffix = "…") => {
    const s = String(v ?? "");
    const n = parseInt(len, 10) || 100;
    return s.length > n ? s.slice(0, n).trimEnd() + suffix : s;
  },
  default: (v, fallback = "") => {
    if (v === null || v === undefined || v === "") return fallback;
    if (Array.isArray(v) && v.length === 0) return fallback;
    return v;
  },
  join: (v, sep = ", ") => (Array.isArray(v) ? v.map((x) => (x == null ? "" : String(x))).join(sep) : String(v ?? "")),
  length: (v) => {
    if (v == null) return 0;
    if (Array.isArray(v) || typeof v === "string") return v.length;
    if (typeof v === "object") return Object.keys(v).length;
    return 0;
  },
  first: (v) => (Array.isArray(v) ? v[0] : v),
  last: (v) => (Array.isArray(v) ? v[v.length - 1] : v),
  // lookup(collection, key, value) → the first entry whose `key` equals `value`
  lookup: (v, key, value) => {
    if (!Array.isArray(v)) return undefined;
    return v.find((item) => String(getPath(item, key)) === String(value));
  },
  slug: (v) =>
    String(v ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  abs: (v) => Math.abs(Number(v) || 0),
  round: (v, d = 0) => {
    const f = 10 ** (parseInt(d, 10) || 0);
    return Math.round((Number(v) || 0) * f) / f;
  },
  ceil: (v) => Math.ceil(Number(v) || 0),
  floor: (v) => Math.floor(Number(v) || 0),
  min: (...a) => Math.min(...a.map(Number)),
  max: (...a) => Math.max(...a.map(Number)),
  if: (cond, a, b) => (cond ? a : b),
};

export const FUNCTION_LIST = Object.keys(FUNCTIONS);

/* ------------------------------------------------------------------ *
 * formula tokenizer + parser
 * ------------------------------------------------------------------ */

const PUNCT = ["===", "!==", "==", "!=", "<=", ">=", "&&", "||", "?", ":", "(", ")", ",", "+", "-", "*", "/", "%", "<", ">", "!"];

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const s = String(src);
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    // string literal
    if (c === '"' || c === "'") {
      let j = i + 1;
      let val = "";
      while (j < s.length && s[j] !== c) {
        if (s[j] === "\\" && j + 1 < s.length) {
          val += s[j + 1];
          j += 2;
        } else {
          val += s[j];
          j += 1;
        }
      }
      if (j >= s.length) throw new Error("Unterminated string literal");
      tokens.push({ t: "str", v: val });
      i = j + 1;
      continue;
    }
    // number
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(s[i + 1] || ""))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      tokens.push({ t: "num", v: parseFloat(s.slice(i, j)) });
      i = j;
      continue;
    }
    // identifier / path
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_$.[\]]/.test(s[j])) j += 1;
      tokens.push({ t: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    const punct = PUNCT.find((p) => s.startsWith(p, i));
    if (punct) {
      tokens.push({ t: "punct", v: punct });
      i += punct.length;
      continue;
    }
    throw new Error(`Unexpected character "${c}" in expression`);
  }
  return tokens;
}

// Precedence climbing over the fixed operator table.
const BINARY = [
  ["||"],
  ["&&"],
  ["==", "!=", "===", "!=="],
  ["<", "<=", ">", ">="],
  ["+", "-"],
  ["*", "/", "%"],
];

function parseTokens(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = (v) => {
    const t = tokens[pos];
    if (!t || (v && t.v !== v)) throw new Error(`Expected "${v}" in expression`);
    pos += 1;
    return t;
  };

  function parseExpression() {
    return parseTernary();
  }

  function parseTernary() {
    const cond = parseBinary(0);
    const t = peek();
    if (t && t.t === "punct" && t.v === "?") {
      eat("?");
      const yes = parseExpression();
      eat(":");
      const no = parseExpression();
      return { k: "cond", cond, yes, no };
    }
    return cond;
  }

  function parseBinary(level) {
    if (level >= BINARY.length) return parseUnary();
    let left = parseBinary(level + 1);
    for (;;) {
      const t = peek();
      if (!t || t.t !== "punct" || !BINARY[level].includes(t.v)) return left;
      pos += 1;
      const right = parseBinary(level + 1);
      left = { k: "bin", op: t.v, left, right };
    }
  }

  function parseUnary() {
    const t = peek();
    if (t && t.t === "punct" && (t.v === "-" || t.v === "!")) {
      pos += 1;
      return { k: "un", op: t.v, arg: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (!t) throw new Error("Unexpected end of expression");
    if (t.t === "num") {
      pos += 1;
      return { k: "lit", v: t.v };
    }
    if (t.t === "str") {
      pos += 1;
      return { k: "lit", v: t.v };
    }
    if (t.t === "punct" && t.v === "(") {
      eat("(");
      const e = parseExpression();
      eat(")");
      return e;
    }
    if (t.t === "id") {
      pos += 1;
      const next = peek();
      if (next && next.t === "punct" && next.v === "(") {
        eat("(");
        const args = [];
        if (!(peek() && peek().t === "punct" && peek().v === ")")) {
          for (;;) {
            args.push(parseExpression());
            const p = peek();
            if (p && p.t === "punct" && p.v === ",") {
              pos += 1;
              continue;
            }
            break;
          }
        }
        eat(")");
        if (!Object.prototype.hasOwnProperty.call(FUNCTIONS, t.v)) {
          throw new Error(`Unknown function "${t.v}"`);
        }
        return { k: "call", fn: t.v, args };
      }
      if (t.v === "true") return { k: "lit", v: true };
      if (t.v === "false") return { k: "lit", v: false };
      if (t.v === "null") return { k: "lit", v: null };
      return { k: "path", path: t.v };
    }
    throw new Error(`Unexpected token "${t.v}" in expression`);
  }

  const ast = parseExpression();
  if (pos !== tokens.length) throw new Error("Trailing characters in expression");
  return ast;
}

const astCache = new Map();
const AST_CACHE_MAX = 500;

export function parseExpressionSource(src) {
  const key = String(src);
  if (astCache.has(key)) return astCache.get(key);
  const ast = parseTokens(tokenize(key));
  if (astCache.size > AST_CACHE_MAX) astCache.clear();
  astCache.set(key, ast);
  return ast;
}

// Deliberately loose comparison for author-typed values ("5" vs 5).
function looseEqual(a, b) {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a === typeof b) return a === b;
  return String(a) === String(b);
}

function evalAst(node, ctx) {
  switch (node.k) {
    case "lit":
      return node.v;
    case "path":
      return getPath(ctx, node.path);
    case "un": {
      const v = evalAst(node.arg, ctx);
      return node.op === "-" ? -(Number(v) || 0) : !v;
    }
    case "cond":
      return evalAst(node.cond, ctx) ? evalAst(node.yes, ctx) : evalAst(node.no, ctx);
    case "call": {
      const args = node.args.map((a) => evalAst(a, ctx));
      return FUNCTIONS[node.fn](...args);
    }
    case "bin": {
      const op = node.op;
      if (op === "&&") return evalAst(node.left, ctx) && evalAst(node.right, ctx);
      if (op === "||") return evalAst(node.left, ctx) || evalAst(node.right, ctx);
      const l = evalAst(node.left, ctx);
      const r = evalAst(node.right, ctx);
      switch (op) {
        case "+":
          return typeof l === "string" || typeof r === "string"
            ? `${l ?? ""}${r ?? ""}`
            : (Number(l) || 0) + (Number(r) || 0);
        case "-":
          return (Number(l) || 0) - (Number(r) || 0);
        case "*":
          return (Number(l) || 0) * (Number(r) || 0);
        case "/": {
          const d = Number(r);
          return d === 0 || !Number.isFinite(d) ? 0 : (Number(l) || 0) / d;
        }
        case "%": {
          const d = Number(r);
          return d === 0 || !Number.isFinite(d) ? 0 : (Number(l) || 0) % d;
        }
        // Loose equality is deliberate: a CMS author typing 5 into a text box
        // means the number 5.
        case "==":
          return looseEqual(l, r);
        case "!=":
          return !looseEqual(l, r);
        case "===":
          return l === r;
        case "!==":
          return l !== r;
        case "<":
          return Number(l) < Number(r);
        case "<=":
          return Number(l) <= Number(r);
        case ">":
          return Number(l) > Number(r);
        case ">=":
          return Number(l) >= Number(r);
        default:
          throw new Error(`Unsupported operator "${op}"`);
      }
    }
    default:
      throw new Error("Malformed expression");
  }
}

/** Evaluate a formula source string against a data context. */
export function evaluateExpression(src, ctx) {
  return evalAst(parseExpressionSource(src), ctx);
}

/* ------------------------------------------------------------------ *
 * pipe chains  ("course.price | currency:GBP | default:—")
 * ------------------------------------------------------------------ */

// Split on "|" that is not inside quotes.
function splitPipes(src) {
  const out = [];
  let cur = "";
  let quote = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\" && i + 1 < src.length) {
        cur += c + src[i + 1];
        i += 1;
        continue;
      }
      if (c === quote) quote = null;
      cur += c;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "|") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter((s, i) => i === 0 || s.length > 0);
}

function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

// "currency:GBP:en-GB" → { name: "currency", args: ["GBP","en-GB"] }
function parsePipe(src) {
  const idx = src.indexOf(":");
  if (idx === -1) return { name: src.trim(), args: [] };
  const name = src.slice(0, idx).trim();
  const rest = src.slice(idx + 1);
  const args = [];
  let cur = "";
  let quote = null;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (quote) {
      if (c === quote) quote = null;
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === ":") {
      args.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  args.push(cur);
  return { name, args: args.map((a) => a.trim()) };
}

/**
 * Evaluate the inside of a single `{{ … }}` token.
 * Returns `{ value, missing }` — `missing` is true when the variable path did
 * not resolve, which lets the caller apply a fallback or show a builder warning.
 */
export function evaluateToken(source, ctx) {
  const src = String(source || "").trim();
  if (!src) return { value: "", missing: false };

  if (src.startsWith("=")) {
    try {
      return { value: evaluateExpression(src.slice(1), ctx), missing: false };
    } catch (err) {
      return { value: undefined, missing: true, error: err.message };
    }
  }

  const parts = splitPipes(src);
  const head = parts[0].trim();
  let value;
  let missing = false;
  try {
    // A bare path is by far the common case; anything else goes to the parser.
    if (/^[A-Za-z_$][A-Za-z0-9_$.[\]]*$/.test(head)) {
      value = getPath(ctx, head);
      missing = value === undefined;
    } else {
      value = evaluateExpression(head, ctx);
    }
  } catch (err) {
    return { value: undefined, missing: true, error: err.message };
  }

  for (const raw of parts.slice(1)) {
    const { name, args } = parsePipe(raw);
    const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, name) ? FUNCTIONS[name] : null;
    if (!fn) return { value: undefined, missing: true, error: `Unknown function "${name}"` };
    try {
      value = fn(value, ...args.map(unquote));
    } catch (err) {
      return { value: undefined, missing: true, error: err.message };
    }
    // `default:` intentionally fills a missing value — stop reporting it.
    if (name === "default") missing = false;
  }

  return { value, missing };
}

/* ------------------------------------------------------------------ *
 * template strings
 * ------------------------------------------------------------------ */

export const TOKEN_RE = /\{\{([\s\S]*?)\}\}/g;

/** True when a value contains at least one `{{ … }}` token. */
export function isDynamic(value) {
  return typeof value === "string" && /\{\{[\s\S]*?\}\}/.test(value);
}

/** Split a template into literal / token segments (used by the token editor). */
export function tokenizeTemplate(template) {
  const src = String(template ?? "");
  const out = [];
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(src))) {
    if (m.index > last) out.push({ kind: "text", value: src.slice(last, m.index) });
    out.push({ kind: "token", value: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ kind: "text", value: src.slice(last) });
  return out;
}

/** Every variable path referenced by a template (for the data inspector). */
export function templatePaths(template) {
  return tokenizeTemplate(template)
    .filter((s) => s.kind === "token")
    .map((s) => {
      const head = s.value.replace(/^=/, "").split("|")[0].trim();
      const m = /^[A-Za-z_$][A-Za-z0-9_$.[\]]*/.exec(head);
      return m ? m[0] : head;
    })
    .filter(Boolean);
}

/** Escape a resolved value before it is injected into an HTML-bearing prop. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stringify(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

/**
 * Resolve a template string against a data context.
 *
 * `opts.fallback`   value substituted when a token cannot resolve
 * `opts.onMissing`  callback(path, error) — the builder uses it to warn
 *
 * A single token that fills the whole string keeps its native type (so a
 * Number stays a Number and an Array stays an Array); mixed templates are
 * always stringified.
 */
export function resolveTemplate(template, ctx, opts = {}) {
  if (typeof template !== "string" || !isDynamic(template)) return template;
  const segments = tokenizeTemplate(template);

  // Resolved values are escaped when they land inside an HTML-bearing property
  // (rich text, custom HTML). Static author-written markup is left alone; only
  // the *data* is escaped, which is exactly what prevents stored-XSS through a
  // record whose title contains "<script>".
  const encode = opts.escapeHtml ? escapeHtml : stringify;

  const hasFallback = opts.fallback !== undefined && opts.fallback !== "";

  if (segments.length === 1 && segments[0].kind === "token") {
    const { value, missing, error } = evaluateToken(segments[0].value, ctx);
    // A configured fallback also covers a record that simply has no value for
    // the field (an empty thumbnail is as unusable as a missing one), which is
    // what "Fallback: default-course.jpg" is for.
    const blank = value === undefined || value === null || value === "";
    if (missing || (blank && hasFallback)) {
      if (missing) opts.onMissing?.(segments[0].value, error);
      const fb = opts.fallback !== undefined ? opts.fallback : "";
      return opts.escapeHtml ? encode(fb) : fb;
    }
    // A lone token keeps its native type unless the target is HTML.
    return opts.escapeHtml ? encode(value) : value;
  }

  let out = "";
  for (const seg of segments) {
    if (seg.kind === "text") {
      out += seg.value;
      continue;
    }
    const { value, missing, error } = evaluateToken(seg.value, ctx);
    if (missing) {
      opts.onMissing?.(seg.value, error);
      out += opts.fallback !== undefined ? encode(opts.fallback) : "";
    } else {
      out += encode(value);
    }
  }
  return out;
}

/** Build a `{{ … }}` token string from a variable path. */
export function toToken(path) {
  return `{{${path}}}`;
}
