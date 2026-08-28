import { NextResponse } from "next/server";
import { getCmsDoc, getGlobalBundle } from "@/lib/cms";
import { hasDynamicContent, resolvePublicPageData } from "@/lib/cms/publicData";

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

    // A page that binds to data gets its resolved context in the same response
    // (one round-trip, no flash of unresolved tokens). Such a response can be
    // visitor-specific, so it is never shared-cached; purely static pages keep
    // the original cacheable path untouched.
    if (doc.enabled && hasDynamicContent(doc)) {
      const url = new URL(request.url);
      const routeParams = {};
      for (const [k, v] of url.searchParams.entries()) routeParams[k] = v;
      const resolved = await resolvePublicPageData(doc, { request, params: routeParams });
      return NextResponse.json(
        { ...base, dynamic: true, context: resolved?.context || {}, meta: resolved?.meta || {} },
        { headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" } }
      );
    }

    return NextResponse.json(
      { ...base, dynamic: false, context: {}, meta: {} },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("CMS public read error:", error);
    return NextResponse.json({ success: false, error: "Failed to load content" }, { status: 500 });
  }
}
