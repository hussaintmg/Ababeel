/**
 * Test Suite 3: Public Data Security & Tenant Isolation
 * Verifies Requirements 10, 37, 38, 39, 40, 41, 110, 112, 119
 */

import {
  isModelPubliclyReadable,
  sanitizePublicDoc,
  sanitizePublicList,
  buildSafePublicFilter,
  PUBLIC_QUERY_CONFIG,
  PUBLIC_MODELS,
} from "../lib/cms/publicData.js";

export function runSecurityTests() {
  const results = [];
  function assert(name, condition, details = "") {
    if (condition) {
      results.push({ name, pass: true });
    } else {
      results.push({ name, pass: false, error: details });
    }
  }

  // 1. Model allowlist: Course and Testimonial are public
  assert("Course model is public", isModelPubliclyReadable("Course") === true);
  assert("Testimonial model is public", isModelPubliclyReadable("Testimonial") === true);

  // 2. Unapproved model rejection: Account, Payment, SecretKey, Session are NOT public
  assert("Account model is forbidden", isModelPubliclyReadable("Account") === false);
  assert("Payment model is forbidden", isModelPubliclyReadable("Payment") === false);
  assert("SecretKey model is forbidden", isModelPubliclyReadable("SecretKey") === false);

  // 3. Field allowlist stripping on User: passwordHash, resetToken, internalNotes must be removed
  const rawUser = {
    _id: "u123",
    firstName: "Sarah",
    lastName: "Connor",
    avatar: "/avatars/sarah.jpg",
    jobTitle: "Lead Architect",
    passwordHash: "secret$hash$123456",
    resetToken: "reset_token_xyz",
    verificationToken: "verify_12345",
    internalNotes: "Admin comments only",
    permissions: ["admin", "superadmin"],
  };

  const sanitizedUser = sanitizePublicDoc("User", rawUser);
  assert("Allowed field firstName is preserved", sanitizedUser.firstName === "Sarah");
  assert("Allowed field avatar is preserved", sanitizedUser.avatar === "/avatars/sarah.jpg");
  assert("Sensitive field passwordHash is STRIPPED", sanitizedUser.passwordHash === undefined);
  assert("Sensitive field resetToken is STRIPPED", sanitizedUser.resetToken === undefined);
  assert("Sensitive field verificationToken is STRIPPED", sanitizedUser.verificationToken === undefined);
  assert("Sensitive field internalNotes is STRIPPED", sanitizedUser.internalNotes === undefined);
  assert("Sensitive field permissions is STRIPPED", sanitizedUser.permissions === undefined);

  // 4. Tenant isolation in query filters
  const filterWithTenant = buildSafePublicFilter({
    modelKey: "Course",
    rawFilter: { featured: true },
    tenantId: "tenant_abc123",
    publishedOnly: true,
  });

  assert("Tenant isolation injected: ownerId matches tenantId", filterWithTenant.ownerId === "tenant_abc123");
  assert("Published only injected: status is published", filterWithTenant.status === "published");
  assert("User filter featured preserved", filterWithTenant.featured === true);

  // 5. Query Security: Dangerous operators ($where, $regex) stripped
  const maliciousFilter = buildSafePublicFilter({
    modelKey: "Course",
    rawFilter: {
      $where: "sleep(5000)",
      $regex: ".*",
      $expr: { $gt: ["$price", 0] },
      title: "Allowed Course",
    },
    tenantId: "tenant_abc123",
  });

  assert("Malicious $where stripped", maliciousFilter.$where === undefined);
  assert("Malicious $regex stripped", maliciousFilter.$regex === undefined);
  assert("Malicious $expr stripped", maliciousFilter.$expr === undefined);
  assert("Safe filter title preserved", maliciousFilter.title === "Allowed Course");

  // 6. Max Public Limit
  assert("Maximum public limit is enforced to 100", PUBLIC_QUERY_CONFIG.MAX_LIMIT === 100);

  return results;
}
