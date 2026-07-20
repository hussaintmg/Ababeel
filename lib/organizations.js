// Organizations are Users with role === "organization".
//
// CourseReference.userId and Invoice.userId already reference User, so keeping
// organizations on the User collection puts them on the same identity that
// courses, candidates, and invoices attach to, instead of a parallel registry
// that nothing else pointed at.
//
// The functions here translate between the User storage shape and the
// organization shape the UI consumes, so the API response contract is
// unchanged from the previous Organization-model implementation.
import crypto from "crypto";
import User from "@/models/User";
import ActivationToken from "@/models/ActivationToken";

export const ORG_ROLE = "organization";

export const ACTIVATION_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const ALLOWED_STATUSES = ["active", "inactive", "suspended"];
export const ALLOWED_CREATOR_ROLES = ["admin", "owner"];

export const MAX_SEARCH_LENGTH = 200;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

// Client-supplied sort keys are mapped through this allowlist so an arbitrary
// database path can never be sorted on.
export const ALLOWED_SORT_FIELDS = {
  name: "username",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  status: "status",
  createdByRole: "createdByRole",
  contactEmail: "email",
};

export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSearch(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Map a User document onto the organization shape the UI expects.
 * Never includes password, reset tokens, or auth tokens.
 */
export function serializeOrganization(user) {
  if (!user) return null;
  const details = user.organizationDetails || {};
  return {
    _id: user._id?.toString?.() ?? user._id,
    name: user.username || "",
    slug: details.slug || "",
    contactPerson: details.contactPerson || "",
    contactEmail: user.email || "",
    phone: user.contact || "",
    address: user.address || "",
    website: details.website || "",
    registrationNumber: details.registrationNumber || "",
    status: user.status || "active",
    createdByUserId: user.createdByUserId?.toString?.() ?? user.createdByUserId ?? null,
    createdByRole: user.createdByRole ?? null,
    createdByNameSnapshot: user.createdByNameSnapshot || "",
    // Surfaces whether the organization has finished setting its password.
    activationPending: user.authenticatedEmail === false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Build the Mongo query for an organization listing.
 *
 * `scopeToCreatorId` is the authorization boundary: when present (admin
 * requests) only organizations created by that user can match. It is applied
 * here rather than in the caller so no endpoint can forget it.
 */
export function buildOrganizationQuery({
  search = "",
  status = "",
  createdByRole = "",
  createdByUserId = "",
  dateFrom = "",
  dateTo = "",
  scopeToCreatorId = null,
} = {}) {
  const query = { role: ORG_ROLE };

  if (scopeToCreatorId) {
    query.createdByUserId = scopeToCreatorId;
  } else if (createdByUserId) {
    query.createdByUserId = createdByUserId;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { username: regex },
      { email: regex },
      { contact: regex },
      { "organizationDetails.slug": regex },
      { "organizationDetails.contactPerson": regex },
      { createdByNameSnapshot: regex },
    ];
  }

  if (status) query.status = status;
  if (createdByRole) query.createdByRole = createdByRole;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }

  return query;
}

/**
 * Duplicate checks against the documented business rules.
 * Returns an error string, or null when the values are free.
 */
export async function findOrganizationConflict({ name, slug, email, excludeId = null }) {
  const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};

  if (name) {
    const clash = await User.findOne({
      ...notSelf,
      role: ORG_ROLE,
      username: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
    }).lean();
    if (clash) return "An organization with this name already exists";
  }

  if (slug) {
    const clash = await User.findOne({
      ...notSelf,
      "organizationDetails.slug": slug,
    }).lean();
    if (clash) return "An organization with this identifier already exists";
  }

  if (email) {
    // Email is unique across every role, so a clash with an admin or owner
    // account must be reported rather than silently reused.
    const clash = await User.findOne({
      ...notSelf,
      email: email.toLowerCase(),
    }).lean();
    if (clash) return "An account with this email already exists";
  }

  return null;
}

/**
 * Create an organization as a User with role "organization".
 *
 * The account is created with an unusable random password and a single-use,
 * expiring activation token, mirroring owner admin creation. No plaintext
 * password is ever generated in, sent to, or displayed by the browser.
 *
 * Returns { organization, activationToken } — the raw token is returned once
 * so the caller can build an activation link, and is never persisted in
 * plaintext (only its SHA-256 hash is stored).
 */
export async function createOrganizationUser({ data, creator, creatorRole }) {
  const { default: bcrypt } = await import("bcryptjs");

  const placeholderPassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(placeholderPassword, 12);

  const slug = data.slug || generateSlug(data.name);

  const organization = await User.create({
    username: data.name.trim(),
    email: data.contactEmail.toLowerCase().trim(),
    password: hashedPassword,
    role: ORG_ROLE,
    status: "active",
    contact: data.phone || "",
    address: data.address || "",
    organizationDetails: {
      slug,
      contactPerson: data.contactPerson || "",
      website: data.website || "",
      registrationNumber: data.registrationNumber || "",
    },
    // Owner/admin created it directly, so no separate owner approval step —
    // but the account still has to set its own password before it is usable.
    authenticatedByOwner: true,
    authenticatedEmail: false,
    createdByUserId: creator._id,
    createdByRole: creatorRole,
    createdByNameSnapshot: creator.username || "",
  });

  const activationTokenValue = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(activationTokenValue)
    .digest("hex");

  await ActivationToken.create({
    userId: organization._id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_EXPIRY_MS),
    createdByUserId: creator._id,
  });

  return { organization, activationToken: activationTokenValue };
}

/**
 * Apply a validated update to an organization User document.
 * Only the organization fields are writable — role, password, balance, and
 * every other User field are untouched, so this cannot be used to escalate.
 */
export function applyOrganizationUpdate(user, data) {
  if (data.name !== undefined) user.username = data.name.trim();
  if (data.contactEmail !== undefined) {
    user.email = data.contactEmail.toLowerCase().trim();
  }
  if (data.phone !== undefined) user.contact = data.phone;
  if (data.address !== undefined) user.address = data.address;
  if (data.status !== undefined) user.status = data.status;

  if (!user.organizationDetails) user.organizationDetails = {};
  if (data.slug !== undefined) user.organizationDetails.slug = data.slug;
  if (data.contactPerson !== undefined) {
    user.organizationDetails.contactPerson = data.contactPerson;
  }
  if (data.website !== undefined) user.organizationDetails.website = data.website;
  if (data.registrationNumber !== undefined) {
    user.organizationDetails.registrationNumber = data.registrationNumber;
  }

  return user;
}
