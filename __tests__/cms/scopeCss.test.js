import { scopeCss, blockScopeId, blockScopeSelector } from "@/lib/cms/scopeCss";

const norm = (s) => s.replace(/\s+/g, " ").trim().split(blockScopeSelector("b1")).join("SCOPE");

describe("scoping a block's CSS", () => {
  test("a bare selector matches inside the block", () => {
    expect(norm(scopeCss("h2 { color: red }", "b1"))).toBe("SCOPE h2 { color: red }");
  });

  test("& is the block itself", () => {
    expect(norm(scopeCss("& { padding: 0 }", "b1"))).toBe("SCOPE { padding: 0 }");
    expect(norm(scopeCss("&:hover h2 { color: red }", "b1"))).toBe("SCOPE:hover h2 { color: red }");
  });

  test("every selector in a list is scoped, not just the first", () => {
    expect(norm(scopeCss("h2, h3 { margin: 0 }", "b1"))).toBe("SCOPE h2, SCOPE h3 { margin: 0 }");
  });

  test("rules inside a media query are scoped, the query is not", () => {
    const out = norm(scopeCss("@media (max-width: 640px) { h2 { font-size: 20px } }", "b1"));
    expect(out).toBe("@media (max-width: 640px) { SCOPE h2 { font-size: 20px } }");
  });

  test("keyframes are left alone — scoping the steps would break them", () => {
    const out = norm(scopeCss("@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }", "b1"));
    expect(out).toContain("@keyframes spin");
    expect(out).not.toContain("SCOPE from");
  });

  test("comments cannot smuggle a brace past the splitter", () => {
    expect(norm(scopeCss("/* } tricky { */ h2 { color: red }", "b1"))).toBe("SCOPE h2 { color: red }");
  });

  test("a rule the author is still typing produces nothing, not broken CSS", () => {
    expect(scopeCss("h2 { color: re", "b1")).toBe("");
    expect(scopeCss("", "b1")).toBe("");
  });

  test("multiple rules and nesting survive together", () => {
    const out = norm(
      scopeCss("& { gap: 8px } .card { border: 0 } @media (min-width: 900px) { .card, & > p { color: blue } }", "b1")
    );
    expect(out).toBe(
      "SCOPE { gap: 8px } SCOPE .card { border: 0 } @media (min-width: 900px) { SCOPE .card, SCOPE > p { color: blue } }"
    );
  });

  test("the scope id drops anything that would not be a valid selector", () => {
    expect(blockScopeId("b_1a2#$b")).toBe("cms-b-b_1a2b");
  });

  test("the scope repeats the class, so it beats a Tailwind utility", () => {
    expect(blockScopeSelector("b1")).toBe(".cms-b-b1.cms-b-b1");
    expect(scopeCss("h2 { color: red }", "b1")).toContain(".cms-b-b1.cms-b-b1 h2");
  });
});
