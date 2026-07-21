import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import SiteContent from "@/models/SiteContent";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, notFoundResponse, badRequestResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getCmsDoc, getGlobalSettings, deepMerge } from "@/lib/cms";
import { MANAGED_PAGES, DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";

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
