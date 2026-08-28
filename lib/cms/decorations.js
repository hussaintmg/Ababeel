/**
 * The `::before` and `::after` layers of a section, as settings rather than CSS.
 *
 * These two pseudo-elements are how most decorative work on a section gets
 * done — a tint over a photograph, a gradient that fades a band into the next
 * one, a corner shape, a watermark. The Design tab had no way to reach them,
 * and the Custom CSS box, while it can express them, asks the author to know
 * that `content: ""` is mandatory or the layer never appears at all, and that
 * without a `position` and a `z-index` it lands in the wrong place.
 *
 * So the decisions are offered as fields and the CSS is generated here, with
 * those three things always correct.
 *
 * Shared by the renderer and the editor, so the preview and the published page
 * are produced by the same function.
 */

/** Where a layer sits relative to the section's own content. */
export const DECOR_LAYERS = [
  { value: "behind", label: "Behind the content" },
  { value: "front", label: "In front of the content" },
];

export const DECOR_KINDS = [
  { value: "none", label: "Off" },
  { value: "color", label: "Solid colour" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
  { value: "text", label: "Text / emoji" },
];

/** How far a layer stretches across the section. */
export const DECOR_SIZES = [
  { value: "full", label: "Whole section" },
  { value: "top", label: "A strip along the top" },
  { value: "bottom", label: "A strip along the bottom" },
  { value: "left", label: "A strip down the left" },
  { value: "right", label: "A strip down the right" },
  { value: "corner", label: "A shape in the corner" },
];

export const DECOR_BLENDS = [
  { value: "", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft light" },
  { value: "luminosity", label: "Luminosity" },
];

const num = (v, fallback) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

/** CSS escaping for a value that goes inside a url() or a content string. */
function cssString(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** The box a layer occupies, from its size setting. */
function geometry(d) {
  const thickness = `${num(d.thickness, 6)}px`;
  switch (d.size) {
    case "top":
      return `top:0; left:0; right:0; height:${thickness};`;
    case "bottom":
      return `bottom:0; left:0; right:0; height:${thickness};`;
    case "left":
      return `top:0; bottom:0; left:0; width:${thickness};`;
    case "right":
      return `top:0; bottom:0; right:0; width:${thickness};`;
    case "corner": {
      const s = `${num(d.thickness, 160)}px`;
      const x = d.corner === "left" ? "left:0;" : "right:0;";
      const y = d.cornerY === "bottom" ? "bottom:0;" : "top:0;";
      return `${x} ${y} width:${s}; height:${s};`;
    }
    default:
      return "inset:0;";
  }
}

/** The paint for a layer, from its kind. */
function paint(d) {
  switch (d.kind) {
    case "color":
      return `background-color:${d.color || "#000000"};`;
    case "gradient": {
      const angle = num(d.gradAngle, 180);
      const from = d.gradFrom || "rgba(0,0,0,0)";
      const to = d.gradTo || "#000000";
      return `background-image:linear-gradient(${angle}deg, ${from}, ${to});`;
    }
    case "image":
      return d.image
        ? `background-image:url("${cssString(d.image)}"); background-size:${d.fit === "contain" ? "contain" : "cover"}; background-position:center; background-repeat:no-repeat;`
        : "";
    default:
      return "";
  }
}

/**
 * One pseudo-element rule, or "" when the layer is off.
 *
 * @param scope  the selector the section resolves to
 * @param which  "before" | "after"
 * @param d      the layer's settings
 */
export function decorationRule(scope, which, d) {
  if (!d || !d.kind || d.kind === "none") return "";
  if (d.kind === "image" && !d.image) return "";
  if (d.kind === "text" && !String(d.text || "").trim()) return "";

  const parts = [];
  // Without content the pseudo-element is never generated at all. This is the
  // single most common reason a hand-written ::before does nothing.
  parts.push(d.kind === "text" ? `content:"${cssString(d.text)}";` : 'content:"";');
  parts.push("position:absolute;");
  parts.push("pointer-events:none;");
  parts.push(geometry(d));
  parts.push(paint(d));

  if (d.kind === "text") {
    parts.push("display:flex; align-items:center; justify-content:center;");
    parts.push(`font-size:${num(d.fontSize, 120)}px;`);
    parts.push(`color:${d.color || "#ffffff"};`);
    parts.push("font-weight:800; line-height:1; white-space:nowrap;");
  }

  const opacity = num(d.opacity, 100) / 100;
  if (opacity !== 1) parts.push(`opacity:${Math.min(Math.max(opacity, 0), 1)};`);
  if (d.blend) parts.push(`mix-blend-mode:${d.blend};`);
  if (d.radius) parts.push(`border-radius:${num(d.radius, 0)}px;`);
  if (d.rotate) parts.push(`transform:rotate(${num(d.rotate, 0)}deg);`);
  parts.push(`z-index:${d.layer === "front" ? 2 : 0};`);

  return `${scope}::${which} { ${parts.filter(Boolean).join(" ")} }`;
}

/**
 * Both layers for a section, plus the positioning the section needs for them.
 *
 * A pseudo-element positioned absolutely inside a section that is `position:
 * static` escapes to the nearest positioned ancestor — usually the page — and
 * ends up somewhere baffling. So the section is made a containing block
 * whenever it has a layer, and its content is lifted above a "behind" layer.
 */
export function decorationCss(scope, style) {
  const before = style?.decorBefore;
  const after = style?.decorAfter;
  const rules = [
    decorationRule(scope, "before", before),
    decorationRule(scope, "after", after),
  ].filter(Boolean);
  if (!rules.length) return "";
  return [
    `${scope} { position:relative; }`,
    `${scope} > * { position:relative; z-index:1; }`,
    ...rules,
  ].join("\n");
}

/** An empty layer, for the editor's defaults. */
export function emptyDecoration() {
  return {
    kind: "none",
    layer: "behind",
    size: "full",
    thickness: "6",
    corner: "right",
    cornerY: "top",
    color: "#0b2a4a",
    gradFrom: "rgba(0,0,0,0)",
    gradTo: "#0b2a4a",
    gradAngle: "180",
    image: "",
    fit: "cover",
    text: "",
    fontSize: "120",
    opacity: "100",
    blend: "",
    radius: "0",
    rotate: "0",
  };
}
