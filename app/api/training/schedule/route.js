import { getScheduleForMonth, getScheduleMonths } from "@/lib/training/queries";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { successResponse, safeErrorResponse } from "@/lib/errors";

/**
 * Public schedule for one month.
 *
 * Only sessions with `showInSchedule` on, whose status is publicly valid and
 * whose course is published, are ever returned — the filter lives in
 * `getScheduleForMonth`, not here.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const rl = await checkRateLimit(request, "publicSearch");
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const p = new URL(request.url).searchParams;
    const now = new Date();
    const year = Number(p.get("year")) || now.getUTCFullYear();
    const month = Number(p.get("month")) || now.getUTCMonth() + 1;

    const [sessions, months] = await Promise.all([
      getScheduleForMonth({
        year,
        month,
        mode: p.get("mode") || "",
        awardingBody: p.get("awardingBody") || "",
      }),
      p.get("withMonths") === "1" ? getScheduleMonths() : Promise.resolve(null),
    ]);

    return successResponse({
      data: { year, month, sessions, ...(months ? { months } : {}) },
    });
  } catch (error) {
    console.error("public schedule error:", error);
    return safeErrorResponse(error, 500);
  }
}
