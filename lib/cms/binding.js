/**
 * Data binding engine — client-safe, used by both the builder preview and the
 * public renderer so what you design is literally what ships.
 *
 * Takes the stored page blocks plus a data context and produces render-ready
 * blocks:
 *
 *   Page blocks ─▶ conditions ─▶ repeaters ─▶ variable resolution ─▶ render
 *
 * Everything is additive: a block with no bindings, no conditions and no
 * repeat comes back exactly as it went in.
 */
import { resolveTemplate, isDynamic, templatePaths, getPath } from "@/lib/cms/expression";
import { evaluateConditions } from "@/lib/cms/conditions";

export const MAX_REPEAT_ITEMS = 200;

/** Blank repeat config for the builder. */
export function defaultRepeat() {
  return { enabled: false, source: "", item: "item", limit: "", offset: "", emptyText: "" };
}

/* ------------------------------------------------------------------ *
 * prop resolution
 * ------------------------------------------------------------------ */

// Property names whose value is injected as raw HTML by the renderer. Anything
// resolved into one of these is HTML-escaped first.
const HTML_PROPS = new Set(["html", "content", "customCss", "css"]);

function resolveValue(value, ctx, opts, key) {
  if (typeof value === "string") {
    if (!isDynamic(value)) return value;
    return resolveTemplate(value, ctx, { ...opts, escapeHtml: HTML_PROPS.has(key) });
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(v, ctx, opts, key));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v, ctx, opts, k);
    return out;
  }
  return value;
}

/**
 * Resolve every `{{ }}` in a prop bag.
 *
 * `fallbacks` maps a top-level prop key to the value used when its binding
 * cannot resolve, which is how "course.thumbnail → default-course.jpg" works.
 */
export function resolveProps(props, ctx, { fallbacks = {}, onMissing } = {}) {
  if (!props || typeof props !== "object") return props;
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    out[key] = resolveValue(
      value,
      ctx,
      {
        fallback: Object.prototype.hasOwnProperty.call(fallbacks, key) ? fallbacks[key] : undefined,
        onMissing: onMissing ? (path, error) => onMissing({ prop: key, path, error }) : undefined,
      },
      key
    );
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * conditional properties
 * ------------------------------------------------------------------ */

/**
 * `_condProps` entries look like:
 *   { prop: "bgColor", group: <condition group>, then: "#f59e0b", else: "" }
 * The winning branch replaces the prop (or the style key, when `target` is
 * "style"). Both branches may themselves contain `{{ }}` tokens.
 */
function applyConditionalProps(block, props, style, ctx, opts) {
  const rules = Array.isArray(block._condProps) ? block._condProps : [];
  if (!rules.length) return { props, style };
  const nextProps = { ...props };
  const nextStyle = { ...style };
  for (const rule of rules) {
    if (!rule?.prop) continue;
    const pass = evaluateConditions(rule.group, ctx);
    const branch = pass ? rule.then : rule.else;
    if (branch === undefined || branch === null || branch === "") {
      if (!pass && (rule.else === undefined || rule.else === "")) continue;
    }
    const value = resolveValue(branch, ctx, opts, rule.prop);
    if (rule.target === "style") nextStyle[rule.prop] = value;
    else nextProps[rule.prop] = value;
  }
  return { props: nextProps, style: nextStyle };
}

/* ------------------------------------------------------------------ *
 * repeaters
 * ------------------------------------------------------------------ */

/** Read a repeat source out of the context and normalise it to an array. */
export function readCollection(ctx, source) {
  if (!source) return [];
  const raw = isDynamic(source) ? resolveTemplate(source, ctx) : getPath(ctx, source);
  if (Array.isArray(raw)) return raw;
  if (raw === null || raw === undefined) return [];
  return [raw];
}

function sliceItems(items, repeat) {
  const offset = Math.max(parseInt(repeat?.offset, 10) || 0, 0);
  const limitRaw = parseInt(repeat?.limit, 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : MAX_REPEAT_ITEMS;
  return items.slice(offset, offset + Math.min(limit, MAX_REPEAT_ITEMS));
}

/** Child context for one repeat iteration. */
export function repeatContext(ctx, itemName, item, index, total) {
  return {
    ...ctx,
    [itemName || "item"]: item,
    index,
    number: index + 1,
    isFirst: index === 0,
    isLast: index === total - 1,
    isEven: index % 2 === 1,
    isOdd: index % 2 === 0,
  };
}

/* ------------------------------------------------------------------ *
 * block resolution
 * ------------------------------------------------------------------ */

/**
 * Resolve one block against a context.
 * Returns `null` when a visibility condition hides it.
 */
export function resolveBlock(block, ctx, opts = {}) {
  if (!block) return null;
  if (block._conditions && !evaluateConditions(block._conditions, ctx)) return null;

  const missing = [];
  const onMissing = (info) => {
    missing.push(info);
    opts.onMissing?.({ blockId: block.id, ...info });
  };

  const fallbacks = block._fallbacks && typeof block._fallbacks === "object" ? block._fallbacks : {};
  let props = resolveProps(block.props, ctx, { fallbacks, onMissing });
  let style = resolveProps(block._style, ctx, { onMissing });
  ({ props, style } = applyConditionalProps(block, props, style, ctx, { onMissing }));

  return {
    ...block,
    props,
    _style: style,
    _resolved: true,
    _missing: missing,
  };
}

/**
 * Expand a block list into render-ready blocks: conditions applied, repeat
 * containers unrolled once per item, every `{{ }}` resolved.
 *
 * Repeater blocks keep their children as `props._items`, an array of
 * `{ key, blocks }` — the renderer just lays them out.
 */
export function expandBlocks(blocks, ctx, opts = {}) {
  const list = Array.isArray(blocks) ? blocks : [];
  const out = [];

  for (const block of list) {
    if (!block || typeof block !== "object") continue;

    if (block.type === "repeater") {
      const resolved = resolveRepeater(block, ctx, opts);
      if (resolved) out.push(resolved);
      continue;
    }

    // Any block may also repeat itself directly (without a container).
    const repeat = block._repeat;
    if (repeat?.enabled && repeat.source) {
      if (block._conditions && !evaluateConditions(block._conditions, ctx)) continue;
      const items = sliceItems(readCollection(ctx, repeat.source), repeat);
      items.forEach((item, i) => {
        const childCtx = repeatContext(ctx, repeat.item, item, i, items.length);
        const r = resolveBlock({ ...block, _repeat: undefined }, childCtx, opts);
        if (r) out.push({ ...r, id: `${block.id}__${i}` });
      });
      continue;
    }

    const resolved = resolveBlock(block, ctx, opts);
    if (resolved) out.push(resolved);
  }

  return out;
}

function resolveRepeater(block, ctx, opts) {
  if (block._conditions && !evaluateConditions(block._conditions, ctx)) return null;

  const props = block.props || {};
  const source = props.source || block._repeat?.source || "";
  const itemName = props.item || block._repeat?.item || "item";
  const items = sliceItems(readCollection(ctx, source), {
    limit: props.limit,
    offset: props.offset,
  });

  const children = Array.isArray(block.children) ? block.children : [];
  const rendered = items.map((item, i) => ({
    key: `${block.id || "rep"}__${i}`,
    blocks: expandBlocks(children, repeatContext(ctx, itemName, item, i, items.length), opts),
  }));

  const style = resolveProps(block._style, ctx, {});
  return {
    ...block,
    _style: style,
    _resolved: true,
    props: {
      ...resolveProps({ ...props, source: undefined, item: undefined }, ctx, {}),
      source,
      item: itemName,
      _items: rendered,
      _count: items.length,
    },
  };
}

/* ------------------------------------------------------------------ *
 * introspection (data inspector / builder warnings)
 * ------------------------------------------------------------------ */

function walkStrings(value, visit) {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => walkStrings(v, visit));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((v) => walkStrings(v, visit));
  }
}

/** Every variable path a block references, including its style and children. */
export function blockBindings(block) {
  const paths = new Set();
  const visit = (s) => templatePaths(s).forEach((p) => paths.add(p));
  walkStrings(block?.props, visit);
  walkStrings(block?._style, visit);
  walkStrings(block?._condProps, visit);
  for (const rule of block?._conditions?.rules || []) {
    if (rule?.left) visit(String(rule.left).includes("{{") ? rule.left : `{{${rule.left}}}`);
  }
  if (block?.type === "repeater" && block?.props?.source) paths.add(block.props.source);
  if (block?._repeat?.enabled && block?._repeat?.source) paths.add(block._repeat.source);
  for (const child of block?.children || []) {
    blockBindings(child).forEach((p) => paths.add(p));
  }
  return [...paths];
}

/** Bindings for a whole page, keyed by block id — powers the Data Inspector. */
export function pageBindings(blocks) {
  const out = [];
  for (const block of Array.isArray(blocks) ? blocks : []) {
    const paths = blockBindings(block);
    if (paths.length) out.push({ id: block.id, type: block.type, paths });
  }
  return out;
}

/** Resolve one path against a context, reporting whether it was found. */
export function probePath(ctx, path) {
  const value = getPath(ctx, path);
  return { path, value, found: value !== undefined };
}
