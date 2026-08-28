import { NextResponse } from "next/server";
import { getCmsDoc } from "@/lib/cms";
import { resolvePublicPageData } from "@/lib/cms/publicData";

export const dynamic = "force-dynamic";

/**
 * Resolved data context for a published page.
 *
 * Public, but it only ever runs the data sources the owner configured on that
 * page, and every query goes through the validated data-query engine with the
 * field exposure policy applied — so this can never be used to read arbitrary
 * collections or private fields.
 */
export async function GET(request, { params }) {
  try {
    const { key } = await params;
    const doc = await getCmsDoc(key);
    if (!doc || !doc.enabled) {
      return NextResponse.json({ success: false, error: "Unknown page" }, { status: 404 });
    }

    const url = new URL(request.url);
    const routeParams = {};
    for (const [k, v] of url.searchParams.entries()) routeParams[k] = v;

    const resolved = await resolvePublicPageData(doc, { request, params: routeParams });
    return NextResponse.json(
      {
        success: true,
        key: doc.key,
        context: resolved?.context || {},
        meta: resolved?.meta || {},
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" } }
    );
  } catch (error) {
    console.error("CMS public data error:", error);
    return NextResponse.json({ success: false, error: "Failed to load data" }, { status: 500 });
  }
}
