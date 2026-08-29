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
import { pageBindings, expandBlocks } from "@/lib/cms/binding";
import { injectTrainingData, TRAINING_BLOCK_TYPES } from "@/lib/cms/trainingBlocks";

/**
 * True when a page carries a block that reads the training catalogue.
 *
 * Distinct from `hasDynamicContent`: catalogue data is the same for every
 * visitor, so such a page still resolves on the server but its response stays
 * shared-cacheable. Conflating the two would either leave these blocks empty or
 * make every page carrying one uncacheable.
 */
export function hasTrainingBlocks(doc) {
  const blocks = Array.isArray(doc?.blocks) ? doc.blocks : [];
  return blocks.some((b) => TRAINING_BLOCK_TYPES.includes(b?.type));
}

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

/**
 * Blocks ready to hand to the renderer, with every binding already resolved.
 *
 * Resolution happens here, on the server, and only the surviving blocks are
 * returned. That matters for more than payload size: a block hidden by a
 * condition (`show if user.role == "admin"`) must not have its content
 * serialised into the HTML of a visitor who is not allowed to see it.
 */
export async function resolvePublicBlocks(doc, { request = null, params = {}, user = null } = {}) {
  const blocks = Array.isArray(doc?.blocks) ? doc.blocks : [];
  const resolved = await resolvePublicPageData(doc, { request, params, user });

  // Training blocks carry their own data need in their props, so they are
  // filled in whether or not the page binds to anything else — a page of
  // nothing but a "Featured courses" section is not "dynamic" by the check
  // above, and would otherwise render empty.
  //
  // This runs after binding expansion so a repeat that produced several course
  // sections gets each of them filled in.
  if (!resolved) {
    const filled = await injectTrainingData(blocks);
    return { blocks: filled, dynamic: false, context: null, meta: {} };
  }

  const expanded = expandBlocks(blocks, resolved.context);
  return {
    blocks: await injectTrainingData(expanded),
    dynamic: true,
    context: resolved.context,
    meta: resolved.meta,
  };
}
