/**
 * The registration form: its definition, and the server-side validation of a
 * submission against it.
 *
 * The browser gets a *presentation* copy of the field list. This module rebuilds
 * the rules from the database on every submission and validates there, so a
 * crafted request cannot skip a required field, submit a value that is not one
 * of the offered options, or smuggle a field that was never on the form.
 *
 * Server-only.
 */
import connectDB from "@/utils/db";
import RegistrationField from "@/models/RegistrationField";
import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/training/defaultFields";
import { sanitizeString } from "@/lib/validation";

/** Hard ceiling on any single answer, whatever the CMS says. */
const ABSOLUTE_MAX = 5000;

/**
 * The enabled fields, in order.
 *
 * An empty collection means the site has never been seeded; rather than
 * present a form with no fields, the built-in defaults stand in. They are the
 * same shapes the seed writes, so the behaviour does not change once it runs.
 */
export async function getFormFields() {
  await connectDB();
  const rows = await RegistrationField.find({ enabled: true }).sort({ displayOrder: 1 }).lean();
  if (rows.length) return rows;
  return DEFAULT_REGISTRATION_FIELDS.filter((f) => f.enabled !== false).map((f, i) => ({
    ...f,
    displayOrder: f.displayOrder ?? i,
  }));
}

/** The field list as the public form needs it — no internal flags. */
export function toPublicField(field) {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder || "",
    helpText: field.helpText || "",
    required: !!field.required,
    width: field.width || "full",
    options: (field.options || []).map((o) => ({
      label: o.label || o.value,
      value: o.value || o.label,
    })),
    minLength: field.minLength || 0,
    maxLength: field.maxLength || 0,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Digits, spaces and the punctuation real phone numbers are written with.
const PHONE_RE = /^[+()\-.\s0-9]{6,32}$/;

/**
 * Validate a submitted `{ key: value }` bag against the live field definitions.
 *
 * @returns {{ ok: boolean, errors: Object, values: Array, bound: Object }}
 *   `values` is what goes into `Registration.fields`; `bound` holds the
 *   promoted columns (email, phone…). Unknown keys in `payload` are dropped.
 */
export function validateSubmission(fields, payload) {
  const errors = {};
  const values = [];
  const bound = {};
  const data = payload && typeof payload === "object" ? payload : {};

  for (const field of fields) {
    const raw = data[field.key];
    const type = field.type || "text";

    let value;
    if (type === "checkbox") {
      value = raw === true || raw === "true" || raw === "on" || raw === 1;
    } else if (Array.isArray(raw)) {
      // A multi-answer control; keep it as a joined string so the owner's
      // table shows something readable.
      value = raw.map((v) => clean(v)).filter(Boolean).join(", ");
    } else {
      value = clean(raw);
    }

    const isEmpty = type === "checkbox" ? value === false : value === "";

    if (field.required && isEmpty) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }

    if (!isEmpty && type !== "checkbox") {
      const str = String(value);

      if (str.length > ABSOLUTE_MAX) {
        errors[field.key] = `${field.label} is too long`;
        continue;
      }
      if (field.minLength && str.length < field.minLength) {
        errors[field.key] = `${field.label} must be at least ${field.minLength} characters`;
        continue;
      }
      if (field.maxLength && str.length > field.maxLength) {
        errors[field.key] = `${field.label} cannot exceed ${field.maxLength} characters`;
        continue;
      }
      if (type === "email" && !EMAIL_RE.test(str)) {
        errors[field.key] = "Enter a valid email address";
        continue;
      }
      if (type === "phone" && !PHONE_RE.test(str)) {
        errors[field.key] = "Enter a valid phone number";
        continue;
      }
      if (type === "number" && !Number.isFinite(Number(str))) {
        errors[field.key] = `${field.label} must be a number`;
        continue;
      }
      if (type === "date" && Number.isNaN(Date.parse(str))) {
        errors[field.key] = `${field.label} must be a valid date`;
        continue;
      }
      // A select/radio answer must be one the form actually offered.
      if ((type === "select" || type === "radio") && (field.options || []).length) {
        const allowed = field.options.map((o) => String(o.value || o.label));
        if (!allowed.includes(str)) {
          errors[field.key] = `Choose one of the available options for ${field.label}`;
          continue;
        }
      }
      if (field.pattern && !matchesPattern(field.pattern, str)) {
        errors[field.key] = field.patternMessage || `${field.label} is not in the expected format`;
        continue;
      }
    }

    values.push({ key: field.key, label: field.label, type, value });
    if (field.bindTo && !isEmpty) bound[field.bindTo] = String(value);
  }

  return { ok: Object.keys(errors).length === 0, errors, values, bound };
}

/**
 * A CMS-authored pattern is untrusted input compiled into a RegExp, so it is
 * length-capped and the test is wrapped: a malformed pattern must fail the
 * field, not throw out of the request handler.
 */
function matchesPattern(pattern, str) {
  try {
    if (String(pattern).length > 200) return true;
    return new RegExp(pattern).test(str);
  } catch {
    return true;
  }
}

function clean(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v !== "string") return "";
  return sanitizeString(v.slice(0, ABSOLUTE_MAX)).trim();
}

/**
 * Build the name/email/phone columns a registration list is searched by.
 * Falls back to whatever the form did collect rather than leaving a row blank.
 */
export function promoteContact(bound) {
  const firstName = bound.firstName || "";
  const lastName = bound.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return {
    firstName,
    lastName,
    fullName: fullName || bound.email || "",
    email: (bound.email || "").toLowerCase(),
    phone: bound.phone || "",
    company: bound.company || "",
    country: bound.country || "",
  };
}
