import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { runDataSource, allowedModels, populatableFields, FILTER_OPS } from "@/lib/cms/dataQuery";
import { getModelDescriptor } from "@/lib/cms/schemaRegistry";

export const dynamic = "force-dynamic";

// GET — what the data-source configurator needs to build a query visually.
export async function GET(request) {
  try {
    const { error } = await requireCmsCapability(request, "useLiveData");
    if (error) return error;

    const model = new URL(request.url).searchParams.get("model");
    if (model) {
      const desc = getModelDescriptor(model);
      if (!desc) return badRequestResponse("Unknown model");
      return successResponse({
        data: { model: desc, populatable: populatableFields(model), operators: FILTER_OPS },
      });
    }
    return successResponse({ data: { models: allowedModels(), operators: FILTER_OPS } });
  } catch (error) {
    console.error("CMS data meta error:", error);
    return safeErrorResponse(error, 500);
  }
}

// POST { source, context } — run one data-source definition against MongoDB.
// Every part of `source` is validated by lib/cms/dataQuery before it is used.
export async function POST(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "useLiveData");
    if (error) return error;

    const rl = await checkRateLimit(request, "cmsDataQuery", {
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
    if (!body?.source?.model) return badRequestResponse("A data source with a model is required");

    const result = await runDataSource(body.source, body.context || {});
    return successResponse({ data: result });
  } catch (error) {
    console.error("CMS data query error:", error);
    return safeErrorResponse(error, 500);
  }
}
