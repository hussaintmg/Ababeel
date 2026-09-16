/**
 * Test Suite 4: SDK, Template Validator & Dynamic Prompt Generator
 * Verifies Requirements 44, 46, 47, 48, 67, 68, 69, 70, 71, 72, 82, 120, 121
 */

import { generateTemplatePrompt } from "../lib/cms/promptGenerator.js";
import { validateTemplate } from "../lib/cms/templateValidator.js";

export function runSdkAndPromptTests() {
  const results = [];
  function assert(name, condition, details = "") {
    if (condition) {
      results.push({ name, pass: true });
    } else {
      results.push({ name, pass: false, error: details });
    }
  }

  // 1. Template Prompt Generator tests
  const prompt = generateTemplatePrompt({
    sectionType: "Course Grid",
    category: "Courses",
    selectedModels: ["Course"],
    expectedInputs: [
      { name: "heading", type: "string", dynamic: true },
      { name: "courses", type: "array", model: "Course", dynamic: true },
    ],
    loopAlias: "course",
    sdkVersion: "2.0.0",
  });

  assert("Prompt contains correct SDK version", prompt.includes("SDK Version: 2.0.0"));
  assert("Prompt contains allowed SDK imports", prompt.includes("@platform/cms-sdk"));
  assert("Prompt specifies Course fields", prompt.includes("course.title") && prompt.includes("course.price"));
  assert("Prompt does NOT dump unrelated user/order models", !prompt.includes("passwordHash") && !prompt.includes("stripeCustomerId"));
  assert("Prompt explicitly instructs loop alias course", prompt.includes('Loop alias: "course"'));
  assert("Prompt warns against using item.title", prompt.includes('Do NOT use "item.*"'));
  assert("Prompt includes responsive layout instructions", prompt.includes("desktop: 3 columns"));
  assert("Prompt specifies required output format", prompt.includes("template.jsx"));

  // 2. Template Validator: Valid template passes
  const validTemplate = {
    name: "ValidCourseGrid",
    sdkVersion: "2.0.0",
    props: {
      heading: { type: "string", dynamic: true },
      courses: { type: "array", model: "Course", dynamic: true },
    },
    code: `
      import React from "react";
      import { defineSection, CMSField, CMSLoop, CMSImage } from "@platform/cms-sdk";
      export default defineSection({
        id: "course-grid",
        name: "Course Grid",
        component: ({ heading, courses }) => (
          <div>
            <h2><CMSField value={heading} /></h2>
            <CMSLoop source={courses} as="course">
              {(course) => (
                <div>
                  <CMSImage source={course.coverImage} />
                  <h3><CMSField value={course.title} /></h3>
                </div>
              )}
            </CMSLoop>
          </div>
        )
      });
    `,
  };

  const validResult = validateTemplate(validTemplate);
  assert("Valid template passes validation", validResult.valid === true);
  assert("Valid template has 0 errors", validResult.errors.length === 0);

  // 3. Template Validator: Catches process.env forbidden access
  const dangerousTemplateEnv = {
    name: "MaliciousEnvTemplate",
    code: `
      export default function Test() {
        const secret = process.env.DATABASE_URL;
        return <div>{secret}</div>;
      }
    `,
  };
  const envResult = validateTemplate(dangerousTemplateEnv);
  assert("process.env access is caught and rejected", envResult.valid === false && envResult.errors.some(e => e.includes("process.env")));

  // 4. Template Validator: Catches mongoose database access
  const dangerousTemplateMongoose = {
    name: "MaliciousMongooseTemplate",
    code: `
      import mongoose from "mongoose";
      export default function Test() {
        return <div>DB</div>;
      }
    `,
  };
  const mongooseResult = validateTemplate(dangerousTemplateMongoose);
  assert("Mongoose import is caught and rejected", mongooseResult.valid === false && mongooseResult.errors.some(e => e.includes("mongoose")));

  // 5. Template Validator: Catches prototype pollution (__proto__)
  const dangerousTemplateProto = {
    name: "MaliciousProtoTemplate",
    code: `
      export default function Test() {
        const x = course.__proto__.admin = true;
        return <div>{x}</div>;
      }
    `,
  };
  const protoResult = validateTemplate(dangerousTemplateProto);
  assert("Prototype access is caught and rejected", protoResult.valid === false && protoResult.errors.some(e => e.includes("Prototype access")));

  // 6. Template Validator: Detects array binding used as scalar diagnostic
  const invalidArrayBindingTemplate = {
    name: "InvalidArrayBinding",
    code: `
      export default function Test() {
        return <div><CMSField value={courses.title} /></div>;
      }
    `,
  };
  const arrayResult = validateTemplate(invalidArrayBindingTemplate);
  assert("Detects scalar access on array with educational diagnostic", arrayResult.diagnostics.some(d => d.type === "ARRAY_AS_SCALAR"));

  return results;
}
