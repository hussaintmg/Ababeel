// Jest setup shared by every suite.
//
// The dynamic-CMS suites introspect the real Mongoose schemas but never open a
// connection, so silence the noisy env warnings and keep console output
// meaningful when a test does fail.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ababeel-test";

jest.setTimeout(20000);
