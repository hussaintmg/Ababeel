import { isBlockedField, isBlockedModel, sanitizeDocument, POLICY } from "@/lib/cms/fieldPolicy";

describe("blocked models", () => {
  test("token and audit collections are never exposed", () => {
    expect(isBlockedModel("ActivationToken")).toBe(true);
    expect(isBlockedModel("AuditLog")).toBe(true);
    expect(isBlockedModel("Course")).toBe(false);
  });
});

describe("blocked fields", () => {
  test("named credential fields on User", () => {
    for (const path of ["password", "resetToken", "resetCode", "authToken", "stripeCustomerId", "transactions", "accountBalance"]) {
      expect(isBlockedField("User", path)).toBe(true);
    }
  });

  test("a blocked parent blocks its descendants", () => {
    expect(isBlockedField("User", "transactions.amount")).toBe(true);
  });

  test("pattern rules apply to models the policy has never seen", () => {
    expect(isBlockedField("SomeFutureModel", "passwordHash")).toBe(true);
    expect(isBlockedField("SomeFutureModel", "apiKey")).toBe(true);
    expect(isBlockedField("SomeFutureModel", "refreshToken")).toBe(true);
    expect(isBlockedField("SomeFutureModel", "webhookSecret")).toBe(true);
    expect(isBlockedField("SomeFutureModel", "nested.privateToken")).toBe(true);
    expect(isBlockedField("SomeFutureModel", "__v")).toBe(true);
  });

  test("ordinary fields are allowed", () => {
    expect(isBlockedField("User", "email")).toBe(false);
    expect(isBlockedField("Course", "price")).toBe(false);
    expect(isBlockedField("Course", "keywords")).toBe(false);
  });
});

describe("sanitizeDocument", () => {
  test("strips blocked keys at every depth", () => {
    const doc = {
      email: "a@b.com",
      password: "hash",
      atcDetails: { atcName: "ATC", secretCode: "x" },
      transactions: [{ amount: 5 }],
    };
    const clean = sanitizeDocument("User", doc);
    expect(clean.email).toBe("a@b.com");
    expect(clean.password).toBeUndefined();
    expect(clean.transactions).toBeUndefined();
    expect(clean.atcDetails.atcName).toBe("ATC");
    expect(clean.atcDetails.secretCode).toBeUndefined();
  });

  test("handles arrays, dates and nullish values", () => {
    const now = new Date();
    const clean = sanitizeDocument("Course", { list: [{ name: "a" }], when: now, nothing: null });
    expect(clean.list[0].name).toBe("a");
    expect(clean.when).toBe(now);
    expect(clean.nothing).toBeNull();
    expect(sanitizeDocument("Course", null)).toBeNull();
  });

  test("the policy tables are exported for auditing", () => {
    expect(POLICY.BLOCKED_PATHS.User).toContain("password");
  });
});
