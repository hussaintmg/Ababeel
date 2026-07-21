import { NextResponse } from "next/server";
import { getCmsDoc, getGlobalBundle } from "@/lib/cms";

// Public read endpoint used by the site to hydrate CMS content (global chrome
// + per-page blocks). No auth: this returns published, public content only.
export async function GET(request, { params }) {
  try {
    const { key } = await params;

    if (key === "global") {
      const { settings, customCss } = await getGlobalBundle();
      return NextResponse.json(
        { success: true, key: "global", settings, customCss },
        { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
      );
    }

    const doc = await getCmsDoc(key);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Unknown page" }, { status: 404 });
    }

    // Only expose blocks/css when the owner has published this page.
    return NextResponse.json(
      {
        success: true,
        key: doc.key,
        enabled: doc.enabled,
        blocks: doc.enabled ? doc.blocks : [],
        customCss: doc.enabled ? doc.customCss : "",
      },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("CMS public read error:", error);
    return NextResponse.json({ success: false, error: "Failed to load content" }, { status: 500 });
  }
}
