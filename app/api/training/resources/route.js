import { listPublicResources, getResourceTypes } from "@/lib/training/queries";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { successResponse, safeErrorResponse } from "@/lib/errors";

/**
 * Public resource search.
 *
 * Like /api/training/courses: the first page is server-rendered and this
 * serves the filtering that happens after. Published-only, enforced inside
 * `listPublicResources` rather than here.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const rl = await checkRateLimit(request, "publicSearch");
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const p = new URL(request.url).searchParams;
    const [result, types] = await Promise.all([
      listPublicResources({
        search: p.get("search") || "",
        type: p.get("type") || "",
        page: p.get("page") || 1,
        limit: p.get("limit") || 12,
      }),
      p.get("withTypes") === "1" ? getResourceTypes() : Promise.resolve(null),
    ]);

    return successResponse({ data: types ? { ...result, types } : result });
  } catch (error) {
    console.error("public resources error:", error);
    return safeErrorResponse(error, 500);
  }
}
