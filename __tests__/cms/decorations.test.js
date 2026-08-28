import { decorationRule, decorationCss, emptyDecoration } from "@/lib/cms/decorations";

const SCOPE = ".cms-b-1.cms-b-1";
const norm = (s) => s.replace(/\s+/g, " ").trim();

describe("::before / ::after as settings", () => {
  test("a layer that is off produces nothing", () => {
    expect(decorationRule(SCOPE, "before", null)).toBe("");
    expect(decorationRule(SCOPE, "before", emptyDecoration())).toBe("");
    expect(decorationCss(SCOPE, {})).toBe("");
  });

  test("content is always emitted — without it the layer never appears", () => {
    const css = decorationRule(SCOPE, "before", { kind: "color", color: "#f26722" });
    expect(css).toContain('content:""');
    expect(css).toContain("position:absolute");
    expect(css).toContain("background-color:#f26722");
    expect(css.startsWith(`${SCOPE}::before`)).toBe(true);
  });

  test("a strip is positioned on the edge it names", () => {
    const top = decorationRule(SCOPE, "before", { kind: "color", size: "top", thickness: "8" });
    expect(top).toContain("top:0;");
    expect(top).toContain("height:8px");
    expect(top).not.toContain("inset:0");

    const right = decorationRule(SCOPE, "after", { kind: "color", size: "right", thickness: "4" });
    expect(right).toContain("right:0;");
    expect(right).toContain("width:4px");
  });

  test("a front layer sits above the content, a behind layer below it", () => {
    expect(decorationRule(SCOPE, "after", { kind: "color", layer: "front" })).toContain("z-index:2");
    expect(decorationRule(SCOPE, "before", { kind: "color", layer: "behind" })).toContain("z-index:0");
  });

  test("the section is made a containing block, or the layer would escape it", () => {
    const css = decorationCss(SCOPE, { decorBefore: { kind: "color" } });
    expect(norm(css)).toContain(`${SCOPE} { position:relative; }`);
    expect(norm(css)).toContain(`${SCOPE} > * { position:relative; z-index:1; }`);
  });

  test("both layers can be used at once", () => {
    const css = decorationCss(SCOPE, {
      decorBefore: { kind: "color", color: "#000" },
      decorAfter: { kind: "gradient", gradFrom: "#fff", gradTo: "#000" },
    });
    expect(css).toContain("::before");
    expect(css).toContain("::after");
    expect(css).toContain("linear-gradient");
  });

  test("a layer with nothing to show is skipped rather than emitted empty", () => {
    expect(decorationRule(SCOPE, "before", { kind: "image", image: "" })).toBe("");
    expect(decorationRule(SCOPE, "before", { kind: "text", text: "   " })).toBe("");
  });

  test("a quote in a value cannot close the string and start a new rule", () => {
    // Braces inside the quoted value are inert; what matters is that the value
    // never terminates its own string early. Removing the escaped quotes should
    // leave exactly the opening and closing pair.
    const unescapedQuotes = (css) => (css.replace(/\\"/g, "").match(/"/g) || []).length;

    // content:"…" is one pair; an image adds url("…") for a second.
    const text = decorationRule(SCOPE, "before", { kind: "text", text: 'a"; } body { display:none } /*' });
    expect(text).toContain('\\"');
    expect(unescapedQuotes(text)).toBe(2);

    const img = decorationRule(SCOPE, "after", { kind: "image", image: 'x.png"); } body {' });
    expect(img).toContain('\\"');
    expect(unescapedQuotes(img)).toBe(4);
  });

  test("opacity and blend are applied only when they do something", () => {
    const plain = decorationRule(SCOPE, "before", { kind: "color", opacity: "100" });
    expect(plain).not.toContain("opacity:");
    expect(plain).not.toContain("mix-blend-mode");
    const fancy = decorationRule(SCOPE, "before", { kind: "color", opacity: "40", blend: "multiply" });
    expect(fancy).toContain("opacity:0.4");
    expect(fancy).toContain("mix-blend-mode:multiply");
  });
});
