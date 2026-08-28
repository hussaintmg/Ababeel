/**
 * Dynamic-CMS capabilities, mapped onto the application's existing roles.
 *
 * The app has four roles — owner, admin, organization, user. The CMS is an
 * owner tool, so owners get everything; admins may look (variables, live data
 * preview, data inspector) but may not change definitions; nobody else has any
 * CMS capability at all.
 */
export const CAPABILITIES = [
  "viewVariables",
  "manageVariables",
  "importVariables",
  "exportVariables",
  "useLiveData",
  "manageDataSources",
  "useExpressions",
  "dataInspector",
];

const ROLE_CAPABILITIES = {
  owner: new Set(CAPABILITIES),
  admin: new Set(["viewVariables", "exportVariables", "useLiveData", "dataInspector"]),
  organization: new Set(),
  user: new Set(),
};

export function can(role, capability) {
  return !!ROLE_CAPABILITIES[role]?.has(capability);
}

export function capabilitiesFor(role) {
  return Object.fromEntries(CAPABILITIES.map((c) => [c, can(role, c)]));
}

/**
 * Route guard: `const { user, error } = await requireCmsCapability(request, "manageVariables")`
 * Returns the same `{ user, error }` shape as lib/auth so call sites read the same.
 */
export async function requireCmsCapability(request, capability) {
  const { getAuthenticatedUser } = await import("@/lib/auth");
  const { forbiddenResponse } = await import("@/lib/errors");
  const { user, error } = await getAuthenticatedUser(request);
  if (error) return { user: null, error };
  if (!can(user.role, capability)) {
    return { user: null, error: forbiddenResponse("Insufficient permissions for this CMS action") };
  }
  return { user, error: null };
}
