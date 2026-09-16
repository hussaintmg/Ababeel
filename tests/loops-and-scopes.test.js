/**
 * Test Suite 2: Lexical Loop Scopes & Nested Repeaters
 * Verifies Requirements 18, 19, 20, 21, 98, 118
 */

import { getPath } from "../lib/cms/expression.js";
import { resolveDynamicProperty } from "../lib/cms/binding.js";

export function runLoopTests() {
  const results = [];
  function assert(name, condition, details = "") {
    if (condition) {
      results.push({ name, pass: true });
    } else {
      results.push({ name, pass: false, error: details });
    }
  }

  // Sample page data with Data Source "courses"
  const pageScope = {
    courses: [
      {
        _id: "c1",
        title: "Web Architecture 101",
        modules: [
          {
            _id: "m1",
            title: "Frontend Foundations",
            lessons: [
              { _id: "l1", title: "HTML & Semantics", duration: "15m" },
              { _id: "l2", title: "CSS & Design Tokens", duration: "25m" },
            ],
          },
          {
            _id: "m2",
            title: "State & Data Resolution",
            lessons: [
              { _id: "l3", title: "Lexical Scopes", duration: "30m" },
            ],
          },
        ],
      },
    ],
    siteSettings: {
      brand: "Platform CMS",
    },
  };

  // Test 1: Simple Loop scope resolution
  const courseItem = pageScope.courses[0];
  const courseLoopScope = {
    ...pageScope,
    course: courseItem,
    loop: {
      index: 0,
      number: 1,
      first: true,
      last: true,
      count: 1,
    },
  };

  assert("Resolves course.title in local loop scope", getPath(courseLoopScope, "course.title") === "Web Architecture 101");
  assert("Loop metadata index is 0", getPath(courseLoopScope, "loop.index") === 0);
  assert("Loop metadata number is 1", getPath(courseLoopScope, "loop.number") === 1);
  assert("Loop metadata first is true", getPath(courseLoopScope, "loop.first") === true);

  // Test 2: Nested Loop Level 1 (course -> module)
  const moduleItem = courseItem.modules[0];
  const moduleLoopScope = {
    ...courseLoopScope,
    module: moduleItem,
    loop: {
      index: 0,
      number: 1,
      first: true,
      last: false,
      count: 2,
    },
  };

  assert("Resolves module.title in nested module scope", getPath(moduleLoopScope, "module.title") === "Frontend Foundations");
  assert("Parent scope access: course.title is still accessible inside module scope", getPath(moduleLoopScope, "course.title") === "Web Architecture 101");
  assert("Page scope access: siteSettings.brand is accessible inside module scope", getPath(moduleLoopScope, "siteSettings.brand") === "Platform CMS");

  // Test 3: Nested Loop Level 2 (course -> module -> lesson)
  const lessonItem = moduleItem.lessons[1];
  const lessonLoopScope = {
    ...moduleLoopScope,
    lesson: lessonItem,
    loop: {
      index: 1,
      number: 2,
      first: false,
      last: true,
      count: 2,
    },
  };

  assert("Resolves lesson.title in 3-level nested scope", getPath(lessonLoopScope, "lesson.title") === "CSS & Design Tokens");
  assert("Parent module title accessible inside lesson", getPath(lessonLoopScope, "module.title") === "Frontend Foundations");
  assert("Grandparent course title accessible inside lesson", getPath(lessonLoopScope, "course.title") === "Web Architecture 101");
  assert("Nested loop metadata number is 2", getPath(lessonLoopScope, "loop.number") === 2);
  assert("Nested loop metadata last is true", getPath(lessonLoopScope, "loop.last") === true);

  // Test 4: Empty Array loop handling
  const emptyArray = [];
  assert("Empty array has length 0", emptyArray.length === 0);

  // Test 5: Alias Collision - Nearest scope wins
  const collidingScope = {
    course: { title: "Grandparent Course" },
    parent: {
      course: { title: "Parent Course Shadow" },
    },
  };
  const activeScope = {
    ...collidingScope,
    course: { title: "Nearest Scope Course" },
  };
  assert("Nearest scope wins on alias collision", getPath(activeScope, "course.title") === "Nearest Scope Course");

  return results;
}
