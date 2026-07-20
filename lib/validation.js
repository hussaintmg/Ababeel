import { z } from "zod";
import { NextResponse } from "next/server";

const MONGO_INJECTION_PATTERNS = [
  /\$where/i,
  /\$gt/i,
  /\$lt/i,
  /\$gte/i,
  /\$lte/i,
  /\$ne/i,
  /\$in/i,
  /\$nin/i,
  /\$regex/i,
  /\$or\b/i,
  /\$and\b/i,
  /\$not\b/i,
  /\$exists/i,
  /\$unset/i,
  /\$push/i,
  /\$pull/i,
  /\$rename/i,
  /\$pop/i,
  /\$inc/i,
];

const PROTOTYPE_POLLUTION_KEYS = [
  "__proto__",
  "constructor",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
];

const UNSAFE_PROTOCOLS = ["javascript:", "data:", "vbscript:"];

export function sanitizeString(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export function checkNoSQLInjection(value, path = "") {
  if (typeof value === "string") {
    for (const pattern of MONGO_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return { safe: false, reason: `Potential NoSQL injection at ${path || "input"}` };
      }
    }
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const result = checkNoSQLInjection(value[i], `${path}[${i}]`);
      if (!result.safe) return result;
    }
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    for (const key of Object.keys(value)) {
      if (PROTOTYPE_POLLUTION_KEYS.includes(key)) {
        return { safe: false, reason: `Prototype pollution key detected: ${key}` };
      }

      const keyPath = path ? `${path}.${key}` : key;

      // A `$`-prefixed key is itself the operator injection, whatever its
      // value type. Checking only `typeof value[key] === "object"` let
      // `{ $gt: "" }` and `{ $or: [...] }` through untouched.
      if (key.startsWith("$")) {
        return { safe: false, reason: `Potential NoSQL injection at ${keyPath}` };
      }

      // Recurse into every value, not just operator keys, so injections
      // nested inside ordinary fields are still caught.
      const result = checkNoSQLInjection(value[key], keyPath);
      if (!result.safe) return result;
    }
  }

  return { safe: true };
}

export function checkUnsafeUrl(url) {
  if (typeof url !== "string") return { safe: false, reason: "URL must be a string" };
  const lower = url.toLowerCase().trim();
  for (const protocol of UNSAFE_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return { safe: false, reason: `Unsafe protocol: ${protocol}` };
    }
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return { safe: false, reason: `Protocol not allowed: ${parsed.protocol}` };
    }
  } catch {
    if (lower.startsWith("/") || lower.startsWith("#")) {
      return { safe: true };
    }
    return { safe: false, reason: "Invalid URL format" };
  }
  return { safe: true };
}

export function isFiniteNumber(value) {
  return typeof value === "number" && isFinite(value) && !isNaN(value);
}

export function isValidObjectId(id) {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

export function validateAndSanitize(schema, data) {
  const injectionCheck = checkNoSQLInjection(data);
  if (!injectionCheck.safe) {
    return { success: false, error: injectionCheck.reason, status: 400 };
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    // Zod v4 exposes `issues`; `errors` was the v3 name and is undefined here.
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError ? firstError.message : "Validation failed",
      status: 400,
    };
  }

  return { success: true, data: result.data, status: 200 };
}

export function validationErrorResponse(message) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  );
}

export const schemas = {
  login: z.object({
    username: z.string().min(1, "Username is required").max(200),
    password: z.string().min(1, "Password is required").max(200),
    remember: z.boolean().optional(),
  }),

  forgotPassword: z.object({
    username: z.string().min(1).max(200),
    // The forgot-password form sends this as a boolean ("is the value a
    // username rather than an email"). Declaring it as a string rejected every
    // request with "Invalid input". The lookup below matches on either field,
    // so the value is accepted but not relied upon.
    stateAsU: z.union([z.boolean(), z.string()]).optional(),
  }),

  resetPassword: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
  }),

  checkCode: z.object({
    code: z.string().length(6, "Code must be 6 digits"),
    token: z.string().min(1),
  }),

  verifyEmail: z.object({
    token: z.string().min(1),
  }),

  contactForm: z.object({
    contact_fullname: z.string().min(1).max(200),
    contact_company: z.string().max(200).optional(),
    contact_no: z.string().min(1).max(30),
    contact_email: z.string().email().max(200),
    contact_inquiryreg: z.string().max(200).optional(),
    contact_country: z.string().max(100).optional(),
    contact_message: z.string().min(1).max(5000),
    status: z.string().optional(),
  }),

  courseId: z.object({
    courseId: z.string().min(1),
  }),

  invoiceId: z.object({
    invoiceId: z.string().min(1),
  }),

  mongoId: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format"),
  }),

  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().max(50).optional(),
    search: z.string().max(200).optional(),
  }),

  amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),

  email: z.string().email("Invalid email address").max(200),

  createAdmin: z.object({
    fullName: z.string().min(2, "Full name is required").max(100),
    email: z.string().email("Invalid email address").max(200),
    phone: z.string().max(30).optional().default(""),
  }),

  createOrganization: z.object({
    name: z.string().min(2, "Organization name is required").max(200),
    slug: z.string().max(200).optional().default(""),
    contactPerson: z.string().max(200).optional().default(""),
    contactEmail: z
      .string()
      .email("Invalid contact email")
      .max(200)
      .optional()
      .default(""),
    phone: z.string().max(30).optional().default(""),
    address: z.string().max(500).optional().default(""),
    website: z.string().max(200).optional().default(""),
    registrationNumber: z.string().max(100).optional().default(""),
  }),

  activateAccount: z.object({
    token: z.string().min(1, "Activation token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200),
  }),

  updateOrganization: z.object({
    name: z.string().min(2, "Organization name is required").max(200).optional(),
    slug: z.string().max(200).optional(),
    contactPerson: z.string().max(200).optional(),
    contactEmail: z.string().email("Invalid contact email").max(200).optional().or(z.literal("")),
    phone: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    website: z.string().max(200).optional(),
    registrationNumber: z.string().max(100).optional(),
    status: z.enum(["active", "inactive", "suspended"]).optional(),
  }),

  mongoIdParam: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format"),
  }),
};
