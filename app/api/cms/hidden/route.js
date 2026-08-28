/**
 * The routes the owner has taken off the public site.
 *
 * Read by the middleware, which cannot open a database connection of its own.
 * Public on purpose: it lists only paths that answer 404, which is exactly what
 * an anonymous visitor learns by asking for one.
 */
import { getHiddenRoutes } from "@/lib/cms";
import { successResponse, safeErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const routes = await getHiddenRoutes();
    return successResponse({ routes });
  } catch (error) {
    // A failure here must not take the site down: the middleware treats an
    // error as "nothing is hidden" and every page keeps serving.
    console.error("Hidden route lookup failed:", error?.message);
    return safeErrorResponse(error, 500);
  }
}
