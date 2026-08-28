/**
 * Page data resolution.
 *
 *   request ─▶ route params ─▶ dynamic-route lookup ─▶ data sources ─▶ context
 *
 * This is the "Data Binding Layer" the architecture calls for: the page
 * renderer never touches Mongoose, it only receives the plain object this
 * module produces. Server-only.
 */
import connectDB from "@/utils/db";
import mongoose from "mongoose";
import "@/models/index";
import { runDataSources, runDataSource, isAllowedModel, buildProjection, toPlain } from "@/lib/cms/dataQuery";
import { sanitizeDocument, isBlockedField } from "@/lib/cms/fieldPolicy";
import { isQueryableField } from "@/lib/cms/schemaRegistry";
import { getCustomVariableContext } from "@/lib/cms/variableRegistry";

/** The subset of the signed-in user a public page may bind to. */
export function publicUser(user) {
  if (!user) return null;
  const plain = typeof user.toObject === "function" ? user.toObject() : user;
  const safe = sanitizeDocument("User", toPlain(plain));
  // Convenience aliases page authors expect.
  const [firstName = "", ...rest] = String(safe.username || "").split(" ");
  return {
    ...safe,
    firstName,
    lastName: rest.join(" "),
    avatar: safe.profileImage?.url || "",
    isLoggedIn: true,
  };
}

/**
 * Look up the single document a dynamic-route page is rendering.
 * `/courses/react-masterclass` → Course.findOne({ slug: "react-masterclass" })
 */
export async function resolveDynamicItem(dynamicRoute, paramValue) {
  const cfg = dynamicRoute || {};
  if (!cfg.enabled || !paramValue) return { key: cfg.itemKey || "item", item: null, error: null };

  const modelName = String(cfg.model || "");
  const lookupField = String(cfg.lookupField || "slug");
  const itemKey = String(cfg.itemKey || "item");

  if (!isAllowedModel(modelName)) {
    return { key: itemKey, item: null, error: `Model "${modelName}" is not available` };
  }
  if (!isQueryableField(modelName, lookupField) || isBlockedField(modelName, lookupField)) {
    return { key: itemKey, item: null, error: `Field "${lookupField}" cannot be used for lookup` };
  }

  await connectDB();
  const model = mongoose.models[modelName];
  const schemaType = model.schema.path(lookupField);
  let value = String(paramValue);
  if (schemaType?.instance === "ObjectID" || schemaType?.instance === "ObjectId") {
    if (!mongoose.isValidObjectId(value)) return { key: itemKey, item: null, error: null };
    value = new mongoose.Types.ObjectId(value);
  }

  try {
    const doc = await model.findOne({ [lookupField]: value }, buildProjection(modelName)).lean();
    return {
      key: itemKey,
      item: doc ? sanitizeDocument(modelName, toPlain(doc)) : null,
      error: null,
    };
  } catch (err) {
    console.error("CMS dynamic route lookup failed:", err?.message);
    return { key: itemKey, item: null, error: "Lookup failed" };
  }
}

/**
 * Build the full data context for a page.
 *
 * @param doc      the SiteContent document (needs dataSources / dynamicRoute)
 * @param options  { params, user, globalSettings }
 */
export async function resolvePageContext(doc, { params = {}, user = null, globalSettings = null } = {}) {
  const context = {
    params: { ...params },
    site: {},
    user: publicUser(user),
    now: new Date().toISOString(),
  };
  const meta = {};

  // Custom variables ("site.name", "site.primaryColor"…) plus a few useful
  // values lifted out of the existing global CMS settings.
  try {
    const custom = await getCustomVariableContext();
    context.site = {
      name: globalSettings?.brand?.name || "",
      tagline: globalSettings?.brand?.tagline || "",
      description: globalSettings?.brand?.description || "",
      logo: globalSettings?.logos?.topbar || "",
      email: globalSettings?.contact?.infoEmail || globalSettings?.contact?.supportEmail || "",
      phone: globalSettings?.contact?.phone || "",
      address: globalSettings?.contact?.address || "",
      ...custom.site,
    };
    for (const [key, value] of Object.entries(custom)) {
      if (key !== "site") context[key] = value;
    }
  } catch (err) {
    console.error("CMS custom variable load failed:", err?.message);
  }

  // Dynamic route item (course, product…) — resolved first so data sources can
  // filter against it, e.g. "lessons where courseId equals {{course._id}}".
  const dyn = doc?.dynamicRoute;
  if (dyn?.enabled) {
    const paramName = String(dyn.paramName || "slug");
    const { key, item, error } = await resolveDynamicItem(dyn, params[paramName]);
    context[key] = item;
    meta[key] = { model: dyn.model, mode: "single", total: item ? 1 : 0, error };
  }

  const sources = Array.isArray(doc?.dataSources) ? doc.dataSources : [];
  if (sources.length) {
    const { data, meta: sourceMeta } = await runDataSources(sources, context);
    Object.assign(context, data);
    Object.assign(meta, sourceMeta);
  }

  return { context, meta };
}

/** Run one ad-hoc source — used by the builder's Live Data preview. */
export async function previewDataSource(source, ctx = {}) {
  return runDataSource(source, ctx);
}
