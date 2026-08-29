import fs from "fs";
import path from "path";

/**
 * Client-safety guard.
 *
 * Card components import `registrationCta` and the status lists directly. If
 * one of those modules ever imports a Mongoose model again, the whole MongoDB
 * driver is pulled into the browser bundle and the production build fails —
 * which is exactly what happened once, and cost a build cycle to diagnose.
 *
 * These are source-level checks rather than runtime ones, because the failure
 * is at bundle time and there is nothing to observe at runtime until it is too
 * late.
 */
const ROOT = process.cwd();

/** Modules a "use client" component is allowed to reach for. */
const CLIENT_SAFE = [
  "lib/training/constants.js",
  "lib/training/status.js",
  "lib/training/format.js",
  "lib/training/defaultFields.js",
  "Components/owner/training/fieldSpecs.js",
];

function importsOf(relPath) {
  const source = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const specifiers = [];
  const re = /(?:^|\n)\s*(?:import|export)[^;]*?from\s+["']([^"']+)["']/g;
  let match = re.exec(source);
  while (match) {
    specifiers.push(match[1]);
    match = re.exec(source);
  }
  // Dynamic `await import("…")` too — those bundle just the same.
  const dyn = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
  let d = dyn.exec(source);
  while (d) {
    specifiers.push(d[1]);
    d = dyn.exec(source);
  }
  return specifiers;
}

describe("client-safe training modules", () => {
  test.each(CLIENT_SAFE)("%s imports no model and no mongoose", (relPath) => {
    const specs = importsOf(relPath);
    const offenders = specs.filter(
      (s) => s === "mongoose" || s.startsWith("@/models") || s.startsWith("@/utils/db"),
    );
    expect(offenders).toEqual([]);
  });

  test.each(CLIENT_SAFE)("%s pulls in no server-only lib", (relPath) => {
    const specs = importsOf(relPath);
    // These reach the database or the filesystem; none belongs in a browser.
    const serverOnly = ["@/lib/cms", "@/lib/auth", "@/lib/training/queries", "@/lib/training/settings"];
    const offenders = specs.filter((s) => serverOnly.some((m) => s === m || s.startsWith(`${m}/`)));
    expect(offenders).toEqual([]);
  });
});

describe("payment boundary stays closed", () => {
  test("the registration route never reaches the payment layer or Stripe", () => {
    const source = fs.readFileSync(path.join(ROOT, "app/api/registration/route.js"), "utf8");
    expect(source).not.toMatch(/\bstripe\b/i);
    expect(source).not.toMatch(/getPaymentProvider|createIntent/);
  });

  test("the registration model stores no payment field", () => {
    const source = fs.readFileSync(path.join(ROOT, "models/Registration.js"), "utf8");
    // A schema key like `amount:` or `paymentStatus:` — not the word in prose.
    expect(source).not.toMatch(/^\s*(amount|currency|paymentStatus|cardNumber|iban)\s*:/m);
  });

  test("payments are disabled and every provider method refuses", () => {
    const source = fs.readFileSync(path.join(ROOT, "lib/payments/provider.js"), "utf8");
    expect(source).toMatch(/export const PAYMENTS_ENABLED = false/);
    expect(source).not.toMatch(/require\(["']stripe|from ["']stripe/);
  });
});
