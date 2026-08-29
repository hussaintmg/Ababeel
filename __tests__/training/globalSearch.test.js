import fs from "fs";
import path from "path";

/**
 * Global owner search.
 *
 * This is the one endpoint that reads registrations — real people's names,
 * emails and phone numbers — alongside everything else, so the checks that
 * matter most here are about who can call it and what it sends back.
 */
const ROUTE = fs.readFileSync(
  path.join(process.cwd(), "app", "api", "owner", "search", "route.js"),
  "utf8",
);
const UI = fs.readFileSync(
  path.join(process.cwd(), "Components", "owner", "GlobalSearch.jsx"),
  "utf8",
);

describe("the search endpoint is owner-only", () => {
  test("it requires an owner before anything else", () => {
    expect(ROUTE).toMatch(/requireOwner/);
    // The guard runs before the query, not after it.
    expect(ROUTE.indexOf("requireOwner")).toBeLessThan(ROUTE.indexOf("Promise.all"));
  });

  test("it is rate limited", () => {
    expect(ROUTE).toMatch(/checkRateLimit/);
  });

  test("it refuses to search on a fragment", () => {
    // Two characters, or it matches half the database on every keystroke.
    expect(ROUTE).toMatch(/term\.length < 2/);
  });

  test("the search term is escaped before it becomes a regex", () => {
    // An unescaped term is a user-supplied pattern running against every
    // collection in the dashboard.
    expect(ROUTE).toMatch(/replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g/);
  });

  test("registration results carry no contact details", () => {
    // The palette shows a name and a reference so the row is findable; the
    // email and phone stay on the detail page, behind the same owner guard.
    const select = ROUTE.match(/key: "registrations"[\s\S]*?select: "([^"]+)"/)?.[1] || "";
    expect(select).toContain("fullName");
    expect(select).not.toContain("phone");
    // `email` is the fallback title when someone registered without a name,
    // so it is selected — but nothing else about them is.
    expect(select).not.toMatch(/\bfields\b|internalNotes|company/);
  });

  test("one broken collection does not empty the whole palette", () => {
    expect(ROUTE).toMatch(/catch \(err\)[\s\S]*?items: \[\]/);
  });
});

describe("the palette is keyboard operable", () => {
  test.each([
    ["ArrowDown", /ArrowDown/],
    ["ArrowUp", /ArrowUp/],
    ["Enter", /"Enter"/],
    ["Escape", /"Escape"/],
  ])("%s is handled", (_key, pattern) => {
    expect(UI).toMatch(pattern);
  });

  test("the highlighted row is announced, not just coloured", () => {
    // A listbox whose selection exists only in CSS is unusable with a screen
    // reader.
    expect(UI).toMatch(/aria-activedescendant/);
    expect(UI).toMatch(/role="listbox"/);
    expect(UI).toMatch(/role="option"/);
    expect(UI).toMatch(/aria-selected/);
  });

  test("the shortcut does not fire while the user is typing elsewhere", () => {
    expect(UI).toMatch(/tag === "INPUT"/);
  });

  test("it sends one request, not one per entity", () => {
    const fetches = UI.match(/fetch\(/g) || [];
    expect(fetches.length).toBe(1);
    expect(UI).toMatch(/\/api\/owner\/search/);
  });

  test("typing is debounced", () => {
    expect(UI).toMatch(/setTimeout\(\(\) => run\(value\), \d+\)/);
  });
});

describe("it is mounted in the existing dashboard", () => {
  test("the owner layout renders it", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "app", "owner", "layout.js"), "utf8");
    expect(layout).toMatch(/GlobalSearch/);
  });

  test("no second dashboard was created for it", () => {
    expect(fs.existsSync(path.join(process.cwd(), "app", "owner", "search"))).toBe(false);
  });
});
