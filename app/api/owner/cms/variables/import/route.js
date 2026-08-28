import connectDB from "@/utils/db";
import CmsVariable from "@/models/CmsVariable";
import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse, badRequestResponse } from "@/lib/errors";
import { planImport, uniqueName } from "@/lib/cms/importExport";
import { getSchemaRegistry } from "@/lib/cms/schemaRegistry";

export const dynamic = "force-dynamic";

// POST { payload, mode: "skip"|"replace"|"createNew", apply: boolean }
// `apply: false` (the default) returns the preview only — nothing is written.
export async function POST(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "importVariables");
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    await connectDB();
    const existing = await CmsVariable.find({}).select("name").lean();
    const existingNames = new Set(existing.map((d) => d.name));
    const modelNames = new Set(getSchemaRegistry().map((m) => m.name));
    const mode = ["skip", "replace", "createNew"].includes(body?.mode) ? body.mode : "skip";

    const plan = planImport(body?.payload, { existingNames, modelNames, mode });
    if (!plan.ok) return badRequestResponse(plan.error);

    if (!body?.apply) {
      return successResponse({ data: { preview: true, items: plan.items, summary: plan.summary } });
    }

    const taken = new Set(existingNames);
    const results = { created: 0, replaced: 0, skipped: 0, failed: 0 };

    for (const item of plan.items) {
      if (!item.ok || item.action === "skip") {
        results.skipped += 1;
        continue;
      }
      try {
        if (item.action === "replace") {
          await CmsVariable.findOneAndUpdate(
            { name: item.variable.name },
            { $set: { ...item.variable, updatedByEmail: user.email || "" } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
          results.replaced += 1;
          continue;
        }
        const name = item.action === "createNew" ? uniqueName(item.variable.name, taken) : item.variable.name;
        taken.add(name);
        await CmsVariable.create({ ...item.variable, name, updatedByEmail: user.email || "" });
        results.created += 1;
      } catch (err) {
        console.error("CMS variable import item failed:", err?.message);
        results.failed += 1;
      }
    }

    return successResponse({ data: { preview: false, results, summary: plan.summary }, message: "Import complete" });
  } catch (error) {
    console.error("CMS variable import error:", error);
    return safeErrorResponse(error, 500);
  }
}
