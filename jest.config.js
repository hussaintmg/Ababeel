import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  // Server-side code under test (mongoose models, next/server route helpers)
  // needs Node globals such as Request; jsdom resolves ESM-only browser
  // builds of bson and omits the fetch primitives these modules rely on.
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  // Only *.test.js are suites; setup.js is a helper and must not be collected.
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  collectCoverageFrom: [
    "lib/**/*.js",
    "models/**/*.js",
    "app/api/owner/**/*.js",
    "app/api/admin/**/*.js",
  ],
};

export default createJestConfig(config);
