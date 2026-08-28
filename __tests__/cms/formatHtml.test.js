import { formatHtml } from "@/lib/cms/formatHtml";

describe("formatting HTML for the code view", () => {
  test("indents nested elements", () => {
    expect(formatHtml('<div class="a"><p>Hi</p></div>')).toBe(
      ['<div class="a">', '  <p>', '    Hi', '  </p>', '</div>'].join("\n")
    );
  });

  test("void elements do not open a level", () => {
    expect(formatHtml("<div><img src='a.png'><br><p>x</p></div>")).toBe(
      ["<div>", "  <img src='a.png'>", "  <br>", "  <p>", "    x", "  </p>", "</div>"].join("\n")
    );
  });

  test("whitespace inside <pre> is left exactly as written", () => {
    const out = formatHtml("<div><pre>  a\n    b</pre></div>");
    expect(out).toContain("<pre>  a\n    b</pre>");
  });

  test("a <script> body is not re-indented", () => {
    const out = formatHtml("<div><script>if (a < b) { x() }</script></div>");
    expect(out).toContain("if (a < b) { x() }");
  });

  test("comments survive and do not open a level", () => {
    const out = formatHtml("<div><!-- note --><p>x</p></div>");
    expect(out.split("\n")[1]).toBe("  <!-- note -->");
    expect(out.split("\n")[2]).toBe("  <p>");
  });

  test("self-closing tags do not open a level", () => {
    expect(formatHtml("<div><svg /><p>x</p></div>").split("\n")[2]).toBe("  <p>");
  });

  test("text is collapsed but never lost", () => {
    expect(formatHtml("<p>  a   b  </p>")).toBe("<p>\n  a b\n</p>");
  });

  test("empty input gives empty output", () => {
    expect(formatHtml("")).toBe("");
    expect(formatHtml(null)).toBe("");
  });
});
