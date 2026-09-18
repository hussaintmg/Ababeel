/**
 * Validation runner for SDK Starter Package.
 * Tests each starter section definition and ensures zero errors.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { validateTemplate } from "../../../lib/cms/templateValidator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sections = [
  "SimpleHero.jsx",
  "DynamicHero.jsx",
  "CourseGrid.jsx",
  "TestimonialsLoop.jsx",
  "NestedLoopSection.jsx",
  "ConditionalCta.jsx",
  "DynamicProfileCard.jsx",
];

console.log("--------------------------------------------------");
console.log("CMS Template SDK: Validating Starter Sections...");
console.log("--------------------------------------------------");

let allPassed = true;

for (const sec of sections) {
  const filePath = resolve(__dirname, "../sections", sec);
  const code = readFileSync(filePath, "utf-8");

  const result = validateTemplate({
    name: sec.replace(".jsx", ""),
    id: `starter-${sec.replace(".jsx", "").toLowerCase()}`,
    sdkVersion: "2.0.0",
    code,
    thumbnail: "/ababeel-logo.svg",
  });

  if (result.valid) {
    console.log(`[PASS] ${sec}`);
  } else {
    allPassed = false;
    console.error(`[FAIL] ${sec}:`, result.errors.join("; "));
  }
}

console.log("--------------------------------------------------");
if (allPassed) {
  console.log("SUCCESS: All starter sections validated successfully!");
  process.exit(0);
} else {
  console.error("FAILURE: One or more sections failed validation.");
  process.exit(1);
}
