import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import SiteContent from "@/models/SiteContent";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, notFoundResponse, badRequestResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getCmsDoc, getGlobalSettings, deepMerge } from "@/lib/cms";
import { MANAGED_PAGES, DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";
import { isAllowedModel } from "@/lib/cms/dataQuery";
import { isQueryableField } from "@/lib/cms/schemaRegistry";

// Keep only the fields the query engine understands, with hard caps applied.
function sanitizeDataSource(src, key) {
  return {
    key,
    label: String(src?.label || key).slice(0, 120),
    model: src.model,
    mode: src?.mode === "single" || src?.mode === "count" ? src.mode : "list",
    match: src?.match === "any" ? "any" : "all",
    filters: (Array.isArray(src?.filters) ? src.filters : []).slice(0, 20).map((f) => ({
      field: String(f?.field || "").slice(0, 120),
      op: String(f?.op || "equals").slice(0, 20),
      value: typeof f?.value === "object" ? "" : f?.value ?? "",
      dynamic: !!f?.dynamic,
    })),
    sortField: String(src?.sortField || "createdAt").slice(0, 120),
    sortDir: src?.sortDir === "asc" ? "asc" : "desc",
    limit: Math.min(Math.max(parseInt(src?.limit, 10) || 12, 1), 200),
    skip: Math.max(parseInt(src?.skip, 10) || 0, 0),
    paginate: !!src?.paginate,
    populate: (Array.isArray(src?.populate) ? src.populate : []).slice(0, 10).map((p) => String(p).slice(0, 120)),
  };
}

// Full editable doc for the owner editor (global settings are merged over
// defaults so every field is present in the form).
export async function GET(request, { params }) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const { key } = await params;
    const page = MANAGED_PAGES.find((p) => p.key === key);

    const doc = await getCmsDoc(key);
    // Not a managed page — only allow it if a custom page with this key exists.
    if (!page) {
      if (!doc || !doc.isCustom) return notFoundResponse("Unknown page");
      const meta = {
        key,
        title: doc.title || key,
        route: doc.route || `/${key}`,
        group: "Custom Pages",
        kind: "page",
        icon: "file",
        isCustom: true,
      };
      return successResponse({ data: { ...doc, meta } });
    }

    if (key === "global") {
      doc.settings = await getGlobalSettings();
    }
    return successResponse({ data: { ...doc, meta: page } });
  } catch (error) {
    console.error("CMS owner read error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsSave", {
      userId: user._id.toString(),
      windowMs: 60 * 60 * 1000,
      maxAttempts: 300,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const { key } = await params;
    const page = MANAGED_PAGES.find((p) => p.key === key);
    // For non-managed keys, only allow saving an existing custom page.
    let existingCustom = null;
    if (!page) {
      await connectDB();
      existingCustom = await SiteContent.findOne({ key, isCustom: true }).select("_id").lean();
      if (!existingCustom) return notFoundResponse("Unknown page");
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      return badRequestResponse("Payload too large (max 1MB)");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const update = { updatedByEmail: user.email || "" };
    if (typeof body.title === "string") update.title = body.title.slice(0, 200);
    if (typeof body.customCss === "string") update.customCss = body.customCss.slice(0, 200000);
    if (typeof body.enabled === "boolean") update.enabled = body.enabled;

    // Custom-page menu settings (ignored for managed/global pages).
    if (!page) {
      if (typeof body.showInNav === "boolean") update.showInNav = body.showInNav;
      if (typeof body.navLabel === "string") update.navLabel = body.navLabel.slice(0, 60);
    }

    if (Array.isArray(body.blocks)) {
      if (body.blocks.length > 200) return badRequestResponse("Too many blocks (max 200)");
      update.blocks = body.blocks;
    }

    // ----- dynamic CMS: data sources + dynamic route -----
    // Both are sanitised here and validated again at query time, so a page can
    // never persist a query that reaches a blocked model or field.
    if (Array.isArray(body.dataSources)) {
      if (body.dataSources.length > 20) return badRequestResponse("Too many data sources (max 20)");
      const cleaned = [];
      for (const src of body.dataSources) {
        const key = String(src?.key || "").trim();
        if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
          return badRequestResponse(`"${key || "(empty)"}" is not a valid data source name`);
        }
        if (!isAllowedModel(src?.model)) {
          return badRequestResponse(`Data source "${key}" uses an unavailable model`);
        }
        cleaned.push(sanitizeDataSource(src, key));
      }
      update.dataSources = cleaned;
    }

    if (body.dynamicRoute !== undefined) {
      const dr = body.dynamicRoute;
      if (!dr || !dr.enabled) {
        update.dynamicRoute = dr ? { ...dr, enabled: false } : null;
      } else {
        if (!isAllowedModel(dr.model)) return badRequestResponse("Dynamic route uses an unavailable model");
        const lookupField = String(dr.lookupField || "slug");
        if (!isQueryableField(dr.model, lookupField)) {
          return badRequestResponse(`"${lookupField}" is not a field of ${dr.model}`);
        }
        const paramName = String(dr.paramName || "slug");
        const itemKey = String(dr.itemKey || "item");
        if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(paramName) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(itemKey)) {
          return badRequestResponse("Route parameter and item names must be simple variable names");
        }
        update.dynamicRoute = { enabled: true, model: dr.model, lookupField, paramName, itemKey };
      }
    }

    if (body.settings && typeof body.settings === "object") {
      // For global, store settings merged over defaults so nothing is lost.
      update.settings =
        key === "global"
          ? deepMerge(DEFAULT_GLOBAL_SETTINGS, body.settings)
          : body.settings;
    }

    await connectDB();
    // Managed pages may be upserted (seeded on first save); custom pages must
    // already exist (guarded above) so we never create stray keys here.
    const doc = await SiteContent.findOneAndUpdate(
      { key },
      { $set: update, $setOnInsert: { key } },
      { new: true, upsert: !!page, setDefaultsOnInsert: true }
    ).lean();

    return successResponse({
      data: {
        key: doc.key,
        title: doc.title || "",
        blocks: doc.blocks || [],
        settings: doc.settings || {},
        customCss: doc.customCss || "",
        enabled: !!doc.enabled,
        isCustom: !!doc.isCustom,
        showInNav: !!doc.showInNav,
        navLabel: doc.navLabel || "",
        dataSources: Array.isArray(doc.dataSources) ? doc.dataSources : [],
        dynamicRoute: doc.dynamicRoute || null,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
      },
      message: "Saved",
    });
  } catch (error) {
    console.error("CMS owner write error:", error);
    return safeErrorResponse(error, 500);
  }
}

// Delete a custom page. Built-in managed pages can never be deleted.
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const { key } = await params;
    if (MANAGED_PAGES.find((p) => p.key === key)) {
      return badRequestResponse("Built-in pages cannot be deleted.");
    }

    await connectDB();
    const res = await SiteContent.deleteOne({ key, isCustom: true });
    if (!res.deletedCount) return notFoundResponse("Custom page not found");
    return successResponse({ message: "Page deleted", key });
  } catch (error) {
    console.error("CMS owner delete error:", error);
    return safeErrorResponse(error, 500);
  }
}
