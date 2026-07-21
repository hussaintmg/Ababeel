import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import SiteContent from "@/models/SiteContent";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { listCmsDocs } from "@/lib/cms";
import { MANAGED_PAGES, getDefaultDoc, validateSlug, getCustomDefaultDoc } from "@/lib/cmsDefaults";

// List all manageable pages with their published state.
export async function GET(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const pages = await listCmsDocs();
    return successResponse({ data: pages });
  } catch (error) {
    console.error("CMS list error:", error);
    return safeErrorResponse(error, 500);
  }
}

// POST with { action: "create", title, slug } → create a new custom page.
// POST with no action → seed any missing default docs (idempotent first-run).
export async function POST(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    let body = {};
    try {
      body = await request.json();
    } catch {
      /* no body → treat as seed */
    }

    await connectDB();

    if (body?.action === "create") {
      const { ok, slug, error: slugErr } = validateSlug(body.slug || body.title);
      if (!ok) return badRequestResponse(slugErr);

      const clash = await SiteContent.findOne({ key: slug }).select("_id").lean();
      if (clash) return badRequestResponse(`A page with the address "/${slug}" already exists.`);

      const title = (typeof body.title === "string" && body.title.trim()) || slug;
      const def = getCustomDefaultDoc(slug, title.slice(0, 200));
      await SiteContent.create({ ...def, updatedByEmail: user.email || "" });
      const pages = await listCmsDocs();
      return successResponse({ data: pages, created: 1, page: { key: slug, route: `/${slug}` } });
    }

    // Default: seed missing managed defaults.
    const existing = await SiteContent.find({}).select("key").lean();
    const existingKeys = new Set(existing.map((d) => d.key));
    const toCreate = MANAGED_PAGES.filter((p) => !existingKeys.has(p.key)).map((p) =>
      getDefaultDoc(p.key)
    );
    if (toCreate.length) {
      await SiteContent.insertMany(toCreate, { ordered: false });
    }
    const pages = await listCmsDocs();
    return successResponse({ data: pages, created: toCreate.length });
  } catch (error) {
    console.error("CMS seed/create error:", error);
    return safeErrorResponse(error, 500);
  }
}
