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
import { CMSScopeFrame, SCOPE_TYPES } from "@/lib/cms/contracts";

export const MAX_REPEAT_ITEMS = 200;

/** Infer a human-readable singular alias from an array/collection source name */
export function inferAlias(source = "") {
  if (!source) return "item";
  const leaf = String(source).split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
  if (!leaf) return "item";
  if (leaf.endsWith("ies")) return leaf.slice(0, -3) + "y";
  if (leaf.endsWith("ses") || leaf.endsWith("xes") || leaf.endsWith("ches") || leaf.endsWith("shes")) return leaf.slice(0, -2);
  if (leaf.endsWith("s") && !leaf.endsWith("ss")) return leaf.slice(0, -1);
  return leaf || "item";
}

/** Blank repeat config for the builder. */
export function defaultRepeat() {
  return { enabled: false, source: "", item: "item", alias: "item", limit: "", offset: "", emptyText: "", emptyMode: "hide" };
}

/* ------------------------------------------------------------------ *
 * prop resolution
 * ------------------------------------------------------------------ */

// Property names whose value is injected as raw HTML by the renderer. Anything
// resolved into one of these is HTML-escaped first.
const HTML_PROPS = new Set(["html", "content", "customCss", "css"]);

export function extractDisplayString(res, propKey = "") {
  if (res === null || res === undefined) return "";
  if (typeof res === "string") return res;
  if (typeof res === "number" || typeof res === "boolean") return String(res);
  if (res instanceof Date) return res.toLocaleDateString("en-GB");
  if (Array.isArray(res)) return res.map((r) => extractDisplayString(r, propKey)).filter(Boolean).join(", ");
  if (typeof res === "object") {
    const pk = String(propKey || "").toLowerCase();
    if (["image", "src", "url", "href", "coverimage", "featuredimage", "logo"].some((k) => pk.includes(k))) {
      if (typeof res.url === "string" && res.url) return res.url;
      if (typeof res.src === "string" && res.src) return res.src;
      if (typeof res.href === "string" && res.href) return res.href;
      if (typeof res.logo === "string" && res.logo) return res.logo;
      if (typeof res.image === "string" && res.image) return res.image;
    }
    if (typeof res.name === "string" && res.name) return res.name;
    if (typeof res.title === "string" && res.title) return res.title;
    if (typeof res.courseName === "string" && res.courseName) return res.courseName;
    if (typeof res.referenceName === "string" && res.referenceName) return res.referenceName;
    if (typeof res.label === "string" && res.label) return res.label;
    if (typeof res.heading === "string" && res.heading) return res.heading;
    if (typeof res.text === "string" && res.text) return res.text;
    if (typeof res.referenceCode === "string" && res.referenceCode) return res.referenceCode;
    if (typeof res.referenceNumber === "string" && res.referenceNumber) return res.referenceNumber;
    if (typeof res.value === "string" || typeof res.value === "number") return String(res.value);
    if (typeof res.slug === "string" && res.slug) return res.slug;
    if (typeof res.description === "string" && res.description) return res.description;
    if (typeof res.question === "string" && res.question) return res.question;
    if (typeof res.answer === "string" && res.answer) return res.answer;
    if (res.course && typeof res.course === "object") {
      const cn = extractDisplayString(res.course, propKey);
      if (cn) return cn;
    }
    if (res.level && typeof res.level === "object") {
      const ln = extractDisplayString(res.level, propKey);
      if (ln) return ln;
    }
    if (res.awardingBody && typeof res.awardingBody === "object") {
      const abn = extractDisplayString(res.awardingBody, propKey);
      if (abn) return abn;
    }
    return "";
  }
  return String(res);
}

function resolveValue(value, ctx, opts, key, path = key) {
  if (["_code", "code", "_fields", "fields", "_runtimeData"].includes(key)) return value;
  if (opts.fallbacks && Object.prototype.hasOwnProperty.call(opts.fallbacks, path)) opts = { ...opts, fallback: opts.fallbacks[path] };
  if (typeof value === "string") {
    if (!isDynamic(value)) return value;
    const res = resolveTemplate(value, ctx, { ...opts, escapeHtml: HTML_PROPS.has(key) });
    if (res && typeof res === "object" && !Array.isArray(res) && !(res instanceof Date)) {
      return extractDisplayString(res, key);
    }
    return res;
  }
  if (Array.isArray(value)) return value.map((v, i) => resolveValue(v, ctx, opts, key, `${path}.${i}`));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v, ctx, opts, k, `${path}.${k}`);
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
        fallbacks,
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
  let raw = isDynamic(source) ? resolveTemplate(source, ctx) : getPath(ctx, source);

  // If source returns a normalized dataset { items: [...], pagination: {...} }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.items)) {
    raw = raw.items;
  }

  if (Array.isArray(raw)) return raw;
  if (raw === null || raw === undefined) return [];
  return [raw];
}

/** Create a rich, resilient sample item for previews when database collections have 0 records */
export function createSampleItem(source = "", itemName = "item", ctx = {}) {
  const s = String(source || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // If ctx has a sample or singular document for this, use it
  if (ctx) {
    if (ctx[source] && !Array.isArray(ctx[source]) && typeof ctx[source] === "object") {
      return wrapSampleProxy(ctx[source]);
    }
    if (Array.isArray(ctx[source]) && ctx[source].length > 0 && typeof ctx[source][0] === "object") {
      return wrapSampleProxy(ctx[source][0]);
    }
    const checkKeys = ["courseReference", "course", "courses", "courseRef", "candidate", "candidates"];
    for (const k of checkKeys) {
      if (s.includes(k.toLowerCase())) {
        if (ctx[k] && !Array.isArray(ctx[k]) && typeof ctx[k] === "object") return wrapSampleProxy(ctx[k]);
        if (Array.isArray(ctx[k]) && ctx[k].length > 0 && typeof ctx[k][0] === "object") return wrapSampleProxy(ctx[k][0]);
      }
    }
  }

  // Pre-configured realistic datasets for core domains
  let baseSample = {};
  if (s.includes("course") || s.includes("courseref") || s.includes("training")) {
    baseSample = {
      courseName: "First Aid at Work (Level 3 RQF)",
      coursePrice: 249,
      price: 249,
      currencySymbol: "£",
      referenceNumber: "AB-FAW-2026-001",
      referenceName: "Weekend Intensive Batch",
      referenceCode: "FAW-001",
      sequenceId: "01",
      duration: "3 Days (18 Hours)",
      mode: "Classroom",
      modeLabel: "Classroom Training",
      location: "London Training Centre, UK",
      seats: 12,
      category: "Health & Safety",
      description: "Comprehensive qualification covering primary first-aid, emergency triage, CPR, and workplace safety compliance.",
      shortDescription: "3-day regulated course with official certification.",
      thumbnail: "/ababeel-logo.svg",
      image: "/ababeel-logo.svg",
      badge: "Regulated",
      level: "Level 3",
      instructor: { firstName: "Aisha", lastName: "Khan", name: "Aisha Khan" },
      trainerName: "Aisha Khan",
      atcName: "Ababeel Training Centre",
      startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      examDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      status: "available",
      isPublished: true,
      slug: "first-aid-at-work",
    };
  } else if (s.includes("candidate") || s.includes("student")) {
    baseSample = {
      firstName: "Hassan",
      lastName: "Ali",
      fullName: "Hassan Ali",
      email: "hassan.ali@example.com",
      phone: "+44 7700 900077",
      status: "Enrolled",
      courseName: "Emergency First Aid",
    };
  } else if (s.includes("team") || s.includes("instructor") || s.includes("trainer") || s.includes("staff")) {
    baseSample = {
      name: "Dr. Tariq Mahmood",
      firstName: "Tariq",
      lastName: "Mahmood",
      role: "Lead Safety Consultant & Senior Trainer",
      bio: "Over 15 years experience in occupational health and safety consultancy across the UK and UAE.",
      image: "/ababeel-logo.svg",
      thumbnail: "/ababeel-logo.svg",
      email: "t.mahmood@ababeelsafety.com",
    };
  } else if (s.includes("testimonial") || s.includes("review")) {
    baseSample = {
      name: "Sarah Jenkins",
      role: "Operations Manager, BuildCorp Ltd",
      company: "BuildCorp Ltd",
      rating: 5,
      content: "The training was exceptional. Hands-on, practical and our staff passed their certification with flying colours!",
      quote: "Exceptional training and high standards.",
      image: "/ababeel-logo.svg",
    };
  } else {
    baseSample = {
      title: `Sample ${source || itemName} Item`,
      name: `Sample ${source || itemName}`,
      description: "Sample dynamic data record for builder preview and design.",
      price: 99,
      image: "/ababeel-logo.svg",
      thumbnail: "/ababeel-logo.svg",
      status: "active",
      category: "General",
    };
  }

  return wrapSampleProxy(baseSample);
}

/** Proxy wrapper so any unmapped property safely returns a readable sample value instead of undefined */
export function wrapSampleProxy(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (typeof Proxy === "undefined") return obj;
  return new Proxy(obj, {
    get(target, prop) {
      if (typeof prop === "symbol") return target[prop];
      if (prop in target) return target[prop];
      if (prop === "toJSON") return () => target;
      if (prop === "toString") return () => `[${target.courseName || target.title || target.name || "Sample Record"}]`;
      if (typeof prop === "string" && !prop.startsWith("_")) {
        return `[Sample ${prop}]`;
      }
      return target[prop];
    },
  });
}

function sliceItems(items, repeat) {
  const offset = Math.max(parseInt(repeat?.offset, 10) || 0, 0);
  const limitRaw = parseInt(repeat?.limit, 10);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : MAX_REPEAT_ITEMS;
  return items.slice(offset, offset + Math.min(limit, MAX_REPEAT_ITEMS));
}

/** Child context for one repeat iteration. */
export function repeatContext(ctx, itemName, item, index, total) {
  const alias = itemName || "item";
  const parentStack = Array.isArray(ctx?.__scopeStack) ? ctx.__scopeStack : [];
  const parentFrame = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null;

  const frame = new CMSScopeFrame({
    type: SCOPE_TYPES.LOOP,
    alias,
    data: item,
    index,
    total,
    parent: parentFrame,
  });

  const nextStack = [...parentStack, frame];

  const loopMeta = {
    index,
    number: index + 1,
    first: index === 0,
    last: index === total - 1,
    isFirst: index === 0,
    isLast: index === total - 1,
    even: index % 2 === 1,
    odd: index % 2 === 0,
    isEven: index % 2 === 1,
    isOdd: index % 2 === 0,
    count: total,
  };

  return {
    ...ctx,
    __scopeStack: nextStack,
    [alias]: item,
    loop: loopMeta,
    _loopMeta: loopMeta,
    // Backward compatibility for existing templates
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

// Authoring-only keys. They are stripped from resolved output so a published
// page never ships the unresolved templates, the condition rules, or (for a
// repeater) the child blocks a condition removed.
const AUTHORING_KEYS = ["_conditions", "_condProps", "_fallbacks", "_repeat", "_dataSource", "children"];

function stripAuthoringKeys(block) {
  const out = { ...block };
  for (const key of AUTHORING_KEYS) delete out[key];
  return out;
}

/** Pick declared/static SDK dependencies from an already public-safe context.
 * Never serialize the full page context or internal scope frames to a client.
 * Computed data access must declare roots in props._dataDependencies.
 */
export function sdkRuntimeData(block, ctx = {}) {
  const code = block.props?._code || block.props?.code || "";
  const roots = new Set(templatePaths(code).map((p) => p.split(/[.\[]/)[0]));
  for (const match of code.matchAll(/\bdata(?:\?\.)?\.?(?:([A-Za-z_$][\w$]*)|\[\s*['"]([^'"]+)['"]\s*\])/g)) roots.add(match[1] || match[2]);
  for (const match of code.matchAll(/(?:useCMSData\s*\(\s*|source\s*=\s*)['"]([^'"]+)['"]/g)) roots.add(match[1].split(/[.\[]/)[0]);
  for (const path of block.props?._dataDependencies || []) if (typeof path === "string") roots.add(path.split(/[.\[]/)[0]);
  const result = {};
  for (const root of roots) {
    if (!root || root.startsWith("_") || ["constructor", "prototype", "user"].includes(root)) continue;
    const value = getPath(ctx, root);
    if (value !== undefined) result[root] = value;
  }
  return result;
}

/**
 * Resolve one block against a context.
 * Returns `null` when a visibility condition hides it.
 */
export function resolveBlock(block, ctx, opts = {}) {
  if (!block) return null;
  if (block._resolved) return block;
  if (block._conditions && !evaluateConditions(block._conditions, ctx)) return null;

  let effectiveCtx = ctx;
  if (opts.sampleMode === true && block._dataSource?.enabled && block._dataSource?.alias) {
    const alias = block._dataSource.alias;
    if (!effectiveCtx[alias]) {
      const sample = createSampleItem(block._dataSource.model || alias, alias, effectiveCtx);
      effectiveCtx = { ...effectiveCtx, [alias]: sample };
    }
  }

  const missing = [];
  const onMissing = (info) => {
    missing.push(info);
    opts.onMissing?.({ blockId: block.id, ...info });
  };

  const fallbacks = block._fallbacks && typeof block._fallbacks === "object" ? block._fallbacks : {};
  let props = resolveProps(block.props, effectiveCtx, { fallbacks, onMissing });
  let style = resolveProps(block._style, effectiveCtx, { onMissing });
  ({ props, style } = applyConditionalProps(block, props, style, effectiveCtx, { onMissing }));

  return {
    ...stripAuthoringKeys(block),
    props,
    _style: style,
    _resolved: true,
    _missing: missing,
    ...(block.type === "sdkCustomSection" ? { _runtimeData: sdkRuntimeData(block, effectiveCtx) } : {}),
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

    if (block._resolved) { out.push(block); continue; }

    if (block.type === "repeater") {
      const resolved = resolveRepeater(block, ctx, opts);
      if (resolved) out.push(resolved);
      continue;
    }

    // Any block may also repeat itself directly (without a container).
    const repeat = block._repeat;
    if (repeat?.enabled && repeat.source) {
      if (block._conditions && !evaluateConditions(block._conditions, ctx)) continue;
      const rawCollection = readCollection(ctx, repeat.source);
      const items = sliceItems(rawCollection, repeat);
      const alias = repeat.alias || repeat.item || inferAlias(repeat.source);

      // Check if block has an inner list property (e.g. cardGrid.items, testimonials.items, team.members, pricing.plans)
      const listPropKey = repeat.targetProp || Object.keys(block.props || {}).find(
        (k) => Array.isArray(block.props[k]) && !k.startsWith("_")
      );
      const repeatInnerList = Boolean(listPropKey && repeat.target !== "block");

      if (repeatInnerList) {
        const rawTemplateList = Array.isArray(block.props[listPropKey]) ? block.props[listPropKey] : [];
        const templateItem = rawTemplateList[0] || {};

        if (items.length === 0) {
          const isBuilderOrPreview = Boolean(opts.isBuilder || opts.preview);
          const emptyMode = repeat.emptyMode || (isBuilderOrPreview ? "showSample" : "hide");

          if (opts.sampleMode === true) {
            const sample = createSampleItem(repeat.source, alias, ctx);
            const childCtx = repeatContext(ctx, alias, sample, 0, 1);
            const sampleItem = resolveProps(templateItem, childCtx, { fallbacks: block._fallbacks || {} });
            const singleBlock = resolveBlock(
              {
                ...block,
                props: { ...block.props, [listPropKey]: [sampleItem] },
              },
              ctx,
              opts
            );
            if (singleBlock) {
              out.push({
                ...singleBlock,
                _isRepeatPlaceholder: true,
                _repeatInfo: {
                  source: repeat.source,
                  item: alias,
                  alias,
                  count: 0,
                  emptyMode,
                  emptyText: repeat.emptyText || "No records in collection",
                },
              });
            }
          } else if (emptyMode === "showEmptyMessage" && repeat.emptyText) {
            out.push({
              id: `${block.id}__empty_notice`,
              type: "richText",
              props: {
                content: `<div class="py-12 text-center text-gray-400 text-sm font-medium">${repeat.emptyText}</div>`,
              },
              _style: block._style || {},
              _resolved: true,
            });
          }
          continue;
        }

        // Expand the single template item N times against the database records
        const expandedList = items.map((item, i) => {
          const childCtx = repeatContext(ctx, alias, item, i, items.length);
          return resolveProps(templateItem, childCtx, { fallbacks: block._fallbacks || {} });
        });

        const singleBlock = resolveBlock(
          {
            ...block,
            props: { ...block.props, [listPropKey]: expandedList },
          },
          ctx,
          opts
        );
        if (singleBlock) out.push(singleBlock);
        continue;
      }

      // Standalone block repeat (repeats the entire block N times)
      if (items.length === 0) {
        const isBuilderOrPreview = Boolean(opts.isBuilder || opts.preview);
        const emptyMode = repeat.emptyMode || (isBuilderOrPreview ? "showSample" : "hide");

        if (opts.sampleMode === true) {
          const sample = createSampleItem(repeat.source, alias, ctx);
          const childCtx = repeatContext(ctx, alias, sample, 0, 1);
          const r = resolveBlock(block, childCtx, opts);
          if (r) {
            out.push({
              ...r,
              id: `${block.id}__empty_preview`,
              _isRepeatPlaceholder: true,
              _repeatInfo: {
                source: repeat.source,
                item: alias,
                alias,
                count: 0,
                emptyMode,
                emptyText: repeat.emptyText || "No records in collection",
              },
            });
          }
        } else if (emptyMode === "showEmptyMessage" && repeat.emptyText) {
          out.push({
            id: `${block.id}__empty_notice`,
            type: "richText",
            props: {
              content: `<div class="py-8 text-center text-gray-400 text-sm font-medium">${repeat.emptyText}</div>`,
            },
            _style: block._style || {},
            _resolved: true,
          });
        }
        continue;
      }

      items.forEach((item, i) => {
        const childCtx = repeatContext(ctx, alias, item, i, items.length);
        const r = resolveBlock(block, childCtx, opts);
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
  const itemName = props.alias || props.item || block._repeat?.alias || block._repeat?.item || inferAlias(source);
  const items = sliceItems(readCollection(ctx, source), {
    limit: props.limit,
    offset: props.offset,
  });

  const children = Array.isArray(block.children) ? block.children : [];
  let rendered = items.map((item, i) => ({
    key: `${block.id || "rep"}__${i}`,
    blocks: expandBlocks(children, repeatContext(ctx, itemName, item, i, items.length), opts),
  }));

  if (rendered.length === 0 && opts.sampleMode === true) {
    const sample = createSampleItem(source, itemName, ctx);
    rendered = [
      {
        key: `${block.id || "rep"}__sample`,
        _isRepeatPlaceholder: true,
        blocks: expandBlocks(children, repeatContext(ctx, itemName, sample, 0, 1), opts),
      },
    ];
  }

  const style = resolveProps(block._style, ctx, {});
  return {
    ...stripAuthoringKeys(block),
    _style: style,
    _resolved: true,
    props: {
      ...resolveProps({ ...props, source: undefined, item: undefined, alias: undefined }, ctx, {}),
      source,
      item: itemName,
      alias: itemName,
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
