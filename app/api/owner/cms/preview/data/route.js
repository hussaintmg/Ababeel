import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolvePageContext } from "@/lib/cms/pageData";
import { getGlobalSettings } from "@/lib/cms";
import { schemaTree } from "@/lib/cms/variableRegistry";
import { buildSampleContext, fillMissing } from "@/lib/cms/sampleData";

export const dynamic = "force-dynamic";

// POST { dataSources, dynamicRoute, params, mode }
// Resolves the full data context a page would see, for the builder preview.
//   mode "live"   → real database records
//   mode "sample" → schema-generated placeholder records
//   mode "mixed"  → live where available, sample for anything empty
export async function POST(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "useLiveData");
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsPreviewData", {
      userId: user._id.toString(),
      windowMs: 60 * 1000,
      maxAttempts: 120,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const mode = ["live", "sample", "mixed"].includes(body?.mode) ? body.mode : "live";

    if (mode === "sample") {
      return successResponse({
        data: { mode, context: buildSampleContext(schemaTree()), meta: {} },
      });
    }

    const settings = await getGlobalSettings();
    const { context, meta } = await resolvePageContext(
      { dataSources: body?.dataSources, dynamicRoute: body?.dynamicRoute },
      { params: body?.params || {}, user, globalSettings: settings }
    );

    const finalContext =
      mode === "mixed" ? fillMissing(context, buildSampleContext(schemaTree())) : context;

    return successResponse({ data: { mode, context: finalContext, meta } });
  } catch (error) {
    console.error("CMS preview data error:", error);
    return safeErrorResponse(error, 500);
  }
}
