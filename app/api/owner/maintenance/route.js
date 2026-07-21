import connectDB from "@/utils/db";
import SiteContent from "@/models/SiteContent";
import { requireOwner } from "@/lib/auth";
import { successResponse, badRequestResponse, safeErrorResponse } from "@/lib/errors";

// PUT /api/owner/maintenance  { enabled?, title?, message? }
// Surgically updates only settings.maintenance.* on the global doc — so the
// quick toggle in the header never disturbs the owner's other saved settings.
export async function PUT(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const set = {};
    if (typeof body.enabled === "boolean") set["settings.maintenance.enabled"] = body.enabled;
    if (typeof body.title === "string") set["settings.maintenance.title"] = body.title.slice(0, 200);
    if (typeof body.message === "string") set["settings.maintenance.message"] = body.message.slice(0, 2000);
    if (Object.keys(set).length === 0) return badRequestResponse("Nothing to update");

    await connectDB();
    await SiteContent.updateOne({ key: "global" }, { $set: set }, { upsert: true });

    return successResponse({ maintenance: body });
  } catch (err) {
    console.error("Maintenance toggle error:", err);
    return safeErrorResponse(err, 500);
  }
}
