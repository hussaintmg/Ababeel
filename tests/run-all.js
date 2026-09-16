/**
 * Master CMS Dynamic Data & Template SDK Test Runner
 * Executes all 5 test suites covering Requirements 117-124.
 */

import { runBindingTests } from "./binding-engine.test.js";
import { runLoopTests } from "./loops-and-scopes.test.js";
import { runSecurityTests } from "./security.test.js";
import { runSdkAndPromptTests } from "./sdk-and-prompt.test.js";
import { runE2ETests } from "./e2e-pages.test.js";

async function main() {
  console.log("================================================================================");
  console.log(" CMS DYNAMIC DATA & TEMPLATE SDK AUTOMATED TEST SUITE");
  console.log("================================================================================");

  const suites = [
    { name: "1. Binding Engine & Path Security (Req 117)", runner: runBindingTests },
    { name: "2. Lexical Loop Scopes & Repeaters (Req 118)", runner: runLoopTests },
    { name: "3. Public Data Security & Isolation (Req 119)", runner: runSecurityTests },
    { name: "4. Template SDK, Validator & Prompt Generator (Req 120, 121)", runner: runSdkAndPromptTests },
    { name: "5. E2E Realistic Pages & Parity (Req 122, 123, 124)", runner: runE2ETests },
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of suites) {
    console.log(`\n▶ Running Suite: ${suite.name}`);
    const results = await suite.runner();

    for (const res of results) {
      totalTests++;
      if (res.pass) {
        passedTests++;
        console.log(`  ✔ [PASS] ${res.name}`);
      } else {
        failedTests++;
        console.error(`  ✖ [FAIL] ${res.name}: ${res.error || "Assertion failed"}`);
      }
    }
  }

  console.log("\n================================================================================");
  console.log(` SUMMARY: ${passedTests}/${totalTests} Tests Passed (${failedTests} Failed)`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log("ALL TESTS COMPLETED SUCCESSFULLY!\n");
    process.exit(0);
  }
}

main().catch(err => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
