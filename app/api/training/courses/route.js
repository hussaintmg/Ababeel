import { listPublicCourses, getCourseFilterOptions } from "@/lib/training/queries";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { successResponse, safeErrorResponse } from "@/lib/errors";

/**
 * Public course search.
 *
 * The /courses page renders its first result set on the server; this endpoint
 * serves the filtering and pagination that happens after, so a visitor
 * narrowing by level does not reload the page.
 *
 * Read-only and published-only — `listPublicCourses` applies the publication
 * rules itself, so no query parameter can widen what is returned.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const rl = await checkRateLimit(request, "publicSearch");
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const p = new URL(request.url).searchParams;
    const [result, options] = await Promise.all([
      listPublicCourses({
        search: p.get("search") || "",
        level: p.get("level") || "",
        awardingBody: p.get("awardingBody") || "",
        category: p.get("category") || "",
        duration: p.get("duration") || "",
        sort: p.get("sort") || "recommended",
        page: p.get("page") || 1,
        limit: p.get("limit") || 12,
      }),
      p.get("withFilters") === "1" ? getCourseFilterOptions() : Promise.resolve(null),
    ]);

    return successResponse({ data: options ? { ...result, filters: options } : result });
  } catch (error) {
    console.error("public courses error:", error);
    return safeErrorResponse(error, 500);
  }
}
