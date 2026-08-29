/**
 * Mongoose 9 middleware no longer receives a `next` callback — hooks are
 * plain sync or async functions. A hook written `function (next) { … next() }`
 * passes every DB-less unit test and then throws `TypeError: next is not a
 * function` on the first real save, which is exactly how it slipped through
 * to a live database once. This test reads the model sources so it fails in
 * CI, not in production.
 */
import fs from "fs";
import path from "path";

const MODELS_DIR = path.resolve(process.cwd(), "models");

describe("mongoose middleware is Mongoose 9 safe", () => {
  const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith(".js"));

  test.each(files)("%s declares no callback-style hooks", (file) => {
    const src = fs.readFileSync(path.join(MODELS_DIR, file), "utf8");
    // `.pre("save", function (next)` / `.post('validate', function foo(next,`…
    const callbackHook =
      /\.(pre|post)\(\s*['"][^'"]+['"]\s*,\s*(?:async\s+)?function[^(]*\(\s*next\b/;
    const match = src.match(callbackHook);
    expect(match ? match[0] : null).toBeNull();
  });
});
