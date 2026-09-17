// Jest setup shared by every suite.
import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ababeel-test";

jest.setTimeout(20000);

