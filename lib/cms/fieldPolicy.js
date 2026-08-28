/**
 * Field exposure policy.
 *
 * The variable registry and the data-query engine both run every candidate
 * field through here. A blocked field is never discovered as a variable, never
 * projected out of MongoDB and never sent to a browser — so a CMS author
 * cannot bind `user.password` even by hand-typing the path.
 */

// Exact paths that must never leave the server, keyed by model name.
const BLOCKED_PATHS = {
  User: [
    "password",
    "resetCode",
    "resetCodeExpires",
    "resetToken",
    "resetTokenExpires",
    "authToken",
    "authTokenExpires",
    "stripeCustomerId",
    "transactions",
    "accountBalance",
  ],
  ActivationToken: ["token"],
  Deposit: ["stripePaymentId", "stripeCustomerId", "receiptUrl"],
  AuditLog: ["details", "ipAddress"],
  Invoice: ["transactions"],
};

// Whole models that are never exposed to the public page runtime: credential
// stores, the audit trail, and the CMS's own configuration collections (a page
// must not be able to read the CMS's stored variable values or page sources).
const BLOCKED_MODELS = new Set([
  "ActivationToken",
  "AuditLog",
  "SiteContent",
  "CmsVariable",
  "CmsDataSource",
  "CmsRegistryState",
  "RateLimit",
]);

// Name patterns blocked on every model — belt and braces for models added later.
const BLOCKED_PATTERNS = [
  /password/i,
  /passwordhash/i,
  /(^|[._])salt$/i,
  /secret/i,
  /(^|[._])(access|refresh|auth|reset|private|api)[-_]?token/i,
  /^token$/i,
  /apikey/i,
  /api_key/i,
  /credential/i,
  /webhook.*secret/i,
  /(^|\.)__v$/,
  /privatekey/i,
  /sessionid/i,
  /otp$/i,
  /verificationcode/i,
];

/** True when this whole model is off-limits to the CMS. */
export function isBlockedModel(modelName) {
  return BLOCKED_MODELS.has(modelName);
}

/**
 * True when `path` (dot notation, relative to the model root) must be hidden.
 * A blocked parent blocks all of its descendants.
 */
export function isBlockedField(modelName, path) {
  const p = String(path || "");
  if (!p) return false;

  const list = BLOCKED_PATHS[modelName] || [];
  for (const blocked of list) {
    if (p === blocked || p.startsWith(`${blocked}.`)) return true;
  }

  const segments = p.split(".");
  for (const seg of segments) {
    for (const re of BLOCKED_PATTERNS) {
      if (re.test(seg)) return true;
    }
  }
  return BLOCKED_PATTERNS.some((re) => re.test(p));
}

/**
 * Deep-strip anything the policy blocks from a plain document object. Applied
 * to query results as a second line of defence behind the projection.
 */
export function sanitizeDocument(modelName, doc, prefix = "") {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map((d) => sanitizeDocument(modelName, d, prefix));
  if (typeof doc !== "object") return doc;
  if (doc instanceof Date) return doc;

  const out = {};
  for (const [key, value] of Object.entries(doc)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isBlockedField(modelName, path)) continue;
    out[key] =
      value && typeof value === "object" && !(value instanceof Date)
        ? sanitizeDocument(modelName, value, path)
        : value;
  }
  return out;
}

export const POLICY = { BLOCKED_PATHS, BLOCKED_MODELS, BLOCKED_PATTERNS };
