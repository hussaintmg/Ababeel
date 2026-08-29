import fs from "fs";
import path from "path";

/**
 * WCAG contrast for the design system's own colour pairings.
 *
 * This exists because the primary button shipped as white-on-orange, which
 * measures 3.12:1 — a clear AA failure for 15px text that nobody notices by
 * looking, because vivid orange *feels* high-contrast. The palette is read from
 * `app/globals.css` rather than duplicated here, so changing a token is what
 * runs this check.
 */
const CSS = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

/** Pull the `--color-<name>: #hex;` tokens out of the @theme block. */
function palette() {
  const out = {};
  const re = /--color-([a-z]+-\d+):\s*(#[0-9a-fA-F]{6})\s*;/g;
  let m = re.exec(CSS);
  while (m) {
    out[m[1]] = m[2].toLowerCase();
    m = re.exec(CSS);
  }
  out.white = "#ffffff";
  return out;
}

const P = palette();

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const l1 = luminance(P[a] || a);
  const l2 = luminance(P[b] || b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/** AA for normal text. Everything checked here is body or button sized. */
const AA = 4.5;

describe("the palette is readable", () => {
  test("the tokens are defined in globals.css", () => {
    // If Tailwind's theme block moves or is renamed, the parse silently returns
    // nothing and every assertion below passes vacuously.
    expect(Object.keys(P).length).toBeGreaterThan(12);
    expect(P["ink-900"]).toBeDefined();
    expect(P["brand-500"]).toBeDefined();
  });

  test.each([
    ["body copy", "ink-600", "white"],
    ["muted copy", "ink-500", "white"],
    ["muted copy on the mist band", "ink-500", "ink-50"],
    ["brand links and eyebrows", "brand-700", "white"],
    ["brand links on the mist band", "brand-700", "ink-50"],
    ["primary button label", "ink-900", "brand-500"],
    ["primary button label on hover", "ink-900", "brand-400"],
    ["dark button label", "white", "ink-900"],
    ["copy on the dark band", "ink-200", "ink-900"],
    ["muted copy on the dark band", "ink-300", "ink-900"],
    ["brand accent on the dark band", "brand-400", "ink-900"],
  ])("%s meets AA", (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  test("white on the brand orange is still the trap it was", () => {
    // Documents *why* the button uses dark text. If a future palette change
    // makes this pass, the button can go back to white and this test can go.
    expect(contrast("white", "brand-500")).toBeLessThan(AA);
  });
});

describe("the primary button uses the readable pairing", () => {
  const BUTTON = fs.readFileSync(
    path.join(process.cwd(), "Components", "ui", "Button.jsx"),
    "utf8",
  );

  test("it is dark text on orange, not white", () => {
    const primary = BUTTON.match(/primary:\s*"([^"]+)"/)?.[1] || "";
    expect(primary).toContain("bg-brand-500");
    expect(primary).toContain("text-ink-900");
    expect(primary).not.toContain("text-white");
  });
});
