import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Every public route must actually be in the repository.
 *
 * `app/resources` was gitignored from the first commit, in a list of routes
 * that were never built. Writing the pages there produced a feature that
 * compiled locally, passed every test, and would have silently not existed on
 * the deployed site — nothing else in the suite could see it, because
 * everything else reads the working tree.
 *
 * This reads git instead.
 */
const ROOT = process.cwd();

function isIgnored(relPath) {
  try {
    execFileSync("git", ["check-ignore", "-q", relPath], { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false; // non-zero exit means "not ignored"
  }
}

/** Every directory under app/ that serves a page. */
function routeDirs(dir = path.join(ROOT, "app"), out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "api" || entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (fs.readdirSync(full).some((f) => /^page\.(jsx?|tsx?)$/.test(f))) out.push(full);
    routeDirs(full, out);
  }
  return out;
}

describe("public routes are tracked by git", () => {
  const routes = routeDirs();

  test("app/ has routes to check", () => {
    expect(routes.length).toBeGreaterThan(10);
  });

  test("no route on disk is excluded from the repository", () => {
    const ignored = routes
      .map((full) => path.relative(ROOT, full))
      .filter((rel) => isIgnored(rel));
    expect(ignored).toEqual([]);
  });

  test("the training routes specifically are tracked", () => {
    for (const route of [
      "app/courses",
      "app/schedule",
      "app/registration",
      "app/resources",
      "app/awarding-bodies",
      "app/about",
    ]) {
      expect(isIgnored(route)).toBe(false);
    }
  });
});
