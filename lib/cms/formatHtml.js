/**
 * Pretty-print HTML for the code view.
 *
 * What comes out of the DOM is one enormous line. This re-indents it so a
 * person can read and edit it, without a formatter dependency and without
 * changing what the markup means: whitespace is only ever added between tags,
 * never inside text, and never inside an element where whitespace is
 * significant.
 */

/** Elements with no closing tag. */
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** Elements whose contents must be left exactly as they are. */
const PRESERVE = new Set(["pre", "textarea", "script", "style", "code"]);

/** Split markup into tags and the text between them. */
function tokenize(html) {
  const tokens = [];
  const re = /<\/?[A-Za-z][^>]*>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>/g;
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index > last) tokens.push({ type: "text", value: html.slice(last, m.index) });
    tokens.push({ type: "tag", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < html.length) tokens.push({ type: "text", value: html.slice(last) });
  return tokens;
}

/** The tag name of a tag token, lowercased; "" for comments and doctypes. */
function nameOf(tag) {
  const m = /^<\/?\s*([A-Za-z][A-Za-z0-9-]*)/.exec(tag);
  return m ? m[1].toLowerCase() : "";
}

const isClose = (tag) => tag.startsWith("</");
const isSelfClosing = (tag) => /\/>$/.test(tag);

/**
 * @param html    markup, typically an element's outerHTML
 * @param indent  spaces per level
 */
export function formatHtml(html, indent = 2) {
  const src = String(html || "").trim();
  if (!src) return "";

  const pad = " ".repeat(Math.min(Math.max(indent, 0), 8));
  const lines = [];
  let depth = 0;
  // While inside <pre> and friends, everything is emitted verbatim.
  let preserving = "";
  let buffer = "";

  const push = (text) => lines.push(pad.repeat(Math.max(depth, 0)) + text);

  for (const token of tokenize(src)) {
    if (preserving) {
      buffer += token.value;
      if (token.type === "tag" && isClose(token.value) && nameOf(token.value) === preserving) {
        push(buffer.trim());
        preserving = "";
        buffer = "";
      }
      continue;
    }

    if (token.type === "text") {
      const text = token.value.replace(/\s+/g, " ").trim();
      if (text) push(text);
      continue;
    }

    const tag = token.value;
    const name = nameOf(tag);

    if (isClose(tag)) {
      depth -= 1;
      push(tag);
      continue;
    }

    if (PRESERVE.has(name) && !isSelfClosing(tag)) {
      preserving = name;
      buffer = tag;
      continue;
    }

    push(tag);
    if (name && !VOID.has(name) && !isSelfClosing(tag) && !tag.startsWith("<!")) {
      depth += 1;
    }
  }

  if (buffer) push(buffer.trim());
  return lines.join("\n");
}
