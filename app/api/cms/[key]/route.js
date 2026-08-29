import { NextResponse } from "next/server";
import { getCmsDoc, getGlobalBundle } from "@/lib/cms";
import { hasDynamicContent, hasTrainingBlocks, resolvePublicBlocks } from "@/lib/cms/publicData";

// Public read endpoint used by the site to hydrate CMS content (global chrome
// + per-page blocks). No auth: this returns published, public content only.
export async function GET(request, { params }) {
  try {
    const { key } = await params;

    if (key === "global") {
      const { settings, customCss, faviconVersion } = await getGlobalBundle();
      return NextResponse.json(
        { success: true, key: "global", settings, customCss, faviconVersion },
        // Global settings include the maintenance switch. Never serve a stale
        // copy here: the owner's quick toggle must take effect immediately.
        { headers: { "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate" } }
      );
    }

    const doc = await getCmsDoc(key);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Unknown page" }, { status: 404 });
    }

    // Only expose blocks/css when the owner has published this page.
    const base = {
      success: true,
      key: doc.key,
      enabled: doc.enabled,
      blocks: doc.enabled ? doc.blocks : [],
      customCss: doc.enabled ? doc.customCss : "",
    };

    // A page that binds to data gets its blocks back already resolved (one
    // round-trip, no flash of unresolved tokens, and nothing a condition hid).
    // Such a response is visitor-specific, so it is explicitly never
    // shared-cached — note that proxy.js already forces `no-store` on every
    // /api route, so the header below is belt-and-braces rather than the thing
    // that makes it safe.
    if (doc.enabled && hasDynamicContent(doc)) {
      const url = new URL(request.url);
      const routeParams = {};
      for (const [k, v] of url.searchParams.entries()) routeParams[k] = v;
      const { blocks } = await resolvePublicBlocks(doc, { request, params: routeParams });
      // Only the resolved, surviving blocks are sent — a block a condition hid
      // never reaches the browser, and neither does the raw data context.
      return NextResponse.json(
        { ...base, blocks, dynamic: true },
        { headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" } }
      );
    }

    // A page whose only data need is the training catalogue still has to be
    // resolved — otherwise a "Featured courses" section renders empty — but the
    // catalogue is identical for every visitor, so the response stays
    // shared-cacheable.
    if (doc.enabled && hasTrainingBlocks(doc)) {
      const { blocks } = await resolvePublicBlocks(doc, { request });
      return NextResponse.json(
        { ...base, blocks, dynamic: false },
        { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
      );
    }

    return NextResponse.json(
      { ...base, dynamic: false },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("CMS public read error:", error);
    return NextResponse.json({ success: false, error: "Failed to load content" }, { status: 500 });
  }
}
