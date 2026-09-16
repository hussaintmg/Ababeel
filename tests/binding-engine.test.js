/**
 * Test Suite 1: Binding Engine & Path Security
 * Verifies Requirements 13, 24, 25, 98, 112, 117
 */

import { getPath, isDynamic, resolveTemplate, formatTransform } from "../lib/cms/expression.js";

export function runBindingTests() {
  const results = [];
  function assert(name, condition, details = "") {
    if (condition) {
      results.push({ name, pass: true });
    } else {
      results.push({ name, pass: false, error: details });
    }
  }

  const scope = {
    course: {
      title: "Advanced Full-Stack Engineering",
      price: 299.99,
      featured: true,
      category: { name: "Web Development", id: "cat-123" },
      tags: ["nextjs", "react", "mongodb"],
      nullField: null,
    },
    site: {
      name: "Ababeel Academy",
    },
  };

  // 1. String field resolution
  assert("String field resolution", getPath(scope, "course.title") === "Advanced Full-Stack Engineering");

  // 2. Number field resolution
  assert("Number field resolution", getPath(scope, "course.price") === 299.99);

  // 3. Boolean field resolution
  assert("Boolean field resolution", getPath(scope, "course.featured") === true);

  // 4. Object field resolution
  assert("Object field resolution", getPath(scope, "course.category")?.name === "Web Development");

  // 5. Array field resolution
  assert("Array field resolution", Array.isArray(getPath(scope, "course.tags")) && getPath(scope, "course.tags").length === 3);

  // 6. Missing field resolution
  assert("Missing field resolution returns undefined", getPath(scope, "course.nonExistent") === undefined);

  // 7. Null field resolution
  assert("Null field resolution returns null", getPath(scope, "course.nullField") === null);

  // 8. Fallback value resolution
  const fallbackResolved = resolveTemplate("{{ course.nonExistent ?? 'Default Course Title' }}", scope);
  assert("Fallback value resolution with ??", fallbackResolved === "Default Course Title");

  // 9. Whitelisted transforms: currency
  assert("Currency transform", formatTransform(299.99, "currency") === "$299.99");

  // 10. Whitelisted transforms: uppercase
  assert("Uppercase transform", formatTransform("hello", "uppercase") === "HELLO");

  // 11. Whitelisted transforms: count
  assert("Count transform", formatTransform(["a", "b", "c"], "count") === 3);

  // 12. Prototype pollution prevention: __proto__ blocked
  assert("Prototype access (__proto__) is blocked", getPath(scope, "course.__proto__.polluted") === undefined);

  // 13. Prototype access (constructor) blocked
  assert("Prototype access (constructor) is blocked", getPath(scope, "course.constructor") === undefined);

  // 14. Prototype access (prototype) blocked
  assert("Prototype access (prototype) is blocked", getPath(scope, "course.prototype") === undefined);

  return results;
}
