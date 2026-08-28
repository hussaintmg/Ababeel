/**
 * Public-page data resolution helpers.
 *
 * Shared by the public CMS API route, the `/[slug]` custom-page renderer and
 * the dynamic template route so all three resolve a page's context the same
 * way — including the feature switches and the "does this page need data at
 * all?" check that keeps purely static pages on the fast, cacheable path.
 */
import { getGlobalSettings } from "@/lib/cms";
import { getFeatures } from "@/lib/cms/features";
import { resolvePageContext } from "@/lib/cms/pageData";
import { pageBindings } from "@/lib/cms/binding";

/** True when a page actually binds to data (so it must not be cached shared). */
export function hasDynamicContent(doc) {
  if (!doc) return false;
  if (Array.isArray(doc.dataSources) && doc.dataSources.length) return true;
  if (doc.dynamicRoute?.enabled) return true;
  return pageBindings(doc.blocks).length > 0;
}

/** The signed-in user, or null — never throws for anonymous visitors. */
export async function optionalUser(request) {
  try {
    const { getAuthenticatedUser } = await import("@/lib/auth");
    const { user } = await getAuthenticatedUser(request);
    return user || null;
  } catch {
    return null;
  }
}

/**
 * Same, for a server component, where there is no `request` object — reads the
 * auth cookie through next/headers.
 */
export async function optionalServerUser() {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = store.get("token")?.value;
    if (!token) return null;
    const { verifyAuthToken } = await import("@/lib/auth");
    const decoded = verifyAuthToken(token);
    const connectDB = (await import("@/utils/db")).default;
    const User = (await import("@/models/User")).default;
    await connectDB();
    return await User.findById(decoded.id).select("-password").lean();
  } catch {
    return null;
  }
}

/**
 * Resolve the data context for a published page.
 * Returns `null` when the page needs no data or the dynamic CMS is switched off.
 */
export async function resolvePublicPageData(doc, { request = null, params = {}, user = null } = {}) {
  if (!hasDynamicContent(doc)) return null;

  const settings = await getGlobalSettings();
  const features = getFeatures(settings);
  if (!features.dynamicCms) return null;

  const currentUser = user || (request ? await optionalUser(request) : null);
  const usableDoc = features.liveData
    ? doc
    : { ...doc, dataSources: [], dynamicRoute: null };

  const { context, meta } = await resolvePageContext(usableDoc, {
    params,
    user: currentUser,
    globalSettings: settings,
  });
  return { context, meta, features };
}
