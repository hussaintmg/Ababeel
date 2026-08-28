/**
 * Scope a block's CSS to that block.
 *
 * The Design tab covers background, spacing, borders and animation. Everything
 * else — a letter-spacing, a grid change at one breakpoint, a pseudo-element —
 * needed the author to invent a class name, then write the rule in the page's
 * global CSS box and hope nothing else on the page matched it. This lets them
 * write the rule against the block they are looking at instead.
 *
 * `&` means the block's own wrapper; anything else is matched inside it:
 *
 *   h2 { color: red }        →  .cms-b-3.cms-b-3 h2 { color: red }
 *   & { padding: 0 }         →  .cms-b-3.cms-b-3 { padding: 0 }
 *   &:hover h2 { ... }       →  .cms-b-3.cms-b-3:hover h2 { ... }
 *
 * The class is repeated on purpose. A block body carries Tailwind utilities
 * (`text-gray-900`), which are single classes; a single-class scope would tie
 * with them and lose or win by source order alone. Doubling it wins reliably
 * while staying weak enough that an `!important` or a page-level rule can
 * still override.
 *
 * Written by hand rather than with a CSS parser: this only has to understand
 * selectors, blocks and at-rules, and a dependency that runs on every keystroke
 * in the editor is a poor trade for that.
 */

/** The class put on a block's wrapper element, and the scope its CSS gets. */
export function blockScopeId(blockId) {
  return `cms-b-${String(blockId || "").replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** The selector that scope resolves to. */
export function blockScopeSelector(blockId) {
  const cls = blockScopeId(blockId);
  return `.${cls}.${cls}`;
}

/** Strip comments — they can contain braces and would confuse the split. */
function stripComments(css) {
  return String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Prefix one comma-separated selector list with the scope. */
function scopeSelector(selector, scope) {
  return selector
    .split(",")
    .map((part) => {
      const sel = part.trim();
      if (!sel) return "";
      // `&` is the block itself, wherever it appears in the selector.
      if (sel.includes("&")) return sel.replace(/&/g, scope);
      // A bare selector is matched inside the block.
      return `${scope} ${sel}`;
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * Split CSS into top-level chunks, respecting nesting.
 * Returns [{ prelude, body }] where body is null for a statement like @import.
 */
function chunks(css) {
  const out = [];
  let prelude = "";
  let depth = 0;
  let body = "";

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (depth === 0) {
      if (ch === "{") {
        depth = 1;
        body = "";
      } else if (ch === ";") {
        // A statement at the top level (@import, @charset).
        if (prelude.trim()) out.push({ prelude: prelude.trim(), body: null });
        prelude = "";
      } else {
        prelude += ch;
      }
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        out.push({ prelude: prelude.trim(), body });
        prelude = "";
        body = "";
        continue;
      }
    }
    body += ch;
  }
  // Unterminated block — the author is still typing. Keep what parses.
  if (prelude.trim() && depth > 0) out.push({ prelude: prelude.trim(), body, unterminated: true });
  return out;
}

// At-rules whose body is a list of ordinary rules, so the scope goes inside.
const NESTED_AT_RULES = /^@(media|supports|container|layer|scope)\b/i;
// At-rules whose body is not selectors at all; pass them through untouched.
const OPAQUE_AT_RULES = /^@(keyframes|-webkit-keyframes|font-face|counter-style|property|page|font-feature-values)\b/i;

/**
 * Rewrite `css` so every rule applies only inside the given block.
 *
 * @param css      what the author typed
 * @param blockId  the block's id
 * @returns CSS safe to drop into a <style> tag, or "" for empty input
 */
export function scopeCss(css, blockId) {
  const text = stripComments(css).trim();
  if (!text) return "";
  const scope = blockScopeSelector(blockId);
  return render(text, scope);
}

function render(text, scope) {
  const out = [];
  for (const { prelude, body, unterminated } of chunks(text)) {
    if (body === null) {
      out.push(`${prelude};`);
      continue;
    }
    if (unterminated) continue;

    if (OPAQUE_AT_RULES.test(prelude)) {
      // A @keyframes name is global, which is the author's to manage; scoping
      // its percentage steps would break the animation outright.
      out.push(`${prelude} { ${body.trim()} }`);
      continue;
    }
    if (NESTED_AT_RULES.test(prelude)) {
      out.push(`${prelude} { ${render(body, scope)} }`);
      continue;
    }
    if (prelude.startsWith("@")) {
      out.push(`${prelude} { ${body.trim()} }`);
      continue;
    }
    const selector = scopeSelector(prelude, scope);
    if (selector) out.push(`${selector} {${body}}`);
  }
  return out.join("\n");
}
