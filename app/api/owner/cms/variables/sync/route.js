import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse } from "@/lib/errors";
import { syncVariables } from "@/lib/cms/variableRegistry";

export const dynamic = "force-dynamic";

// Rescan the live Mongoose schemas. Nothing is deleted — fields that vanished
// are flagged deprecated so pages warn instead of breaking.
export async function POST(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "manageVariables");
    if (error) return error;

    const result = await syncVariables({ email: user.email || "" });
    return successResponse({ data: result, message: "Variables synced" });
  } catch (error) {
    console.error("CMS variable sync error:", error);
    return safeErrorResponse(error, 500);
  }
}
