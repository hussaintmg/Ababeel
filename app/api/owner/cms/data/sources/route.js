import { normalizeSource } from "@/lib/cms/sourceDefinition";
import connectDB from "@/utils/db";
import CmsDataSource from "@/models/CmsDataSource";
import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse, badRequestResponse, notFoundResponse } from "@/lib/errors";
import { isAllowedModel } from "@/lib/cms/dataQuery";

export const dynamic = "force-dynamic";

function serialize(doc) {
  return {
    ...normalizeSource(doc),
    sourceId: String(doc._id),
    key: doc.key,
    label: doc.label || doc.key,
    model: doc.model,
    mode: doc.mode,
    filters: doc.filters || [],
    match: doc.match || "all",
    sortField: doc.sortField || "createdAt",
    sortDir: doc.sortDir || "desc",
    limit: doc.limit ?? 12,
    skip: doc.skip ?? 0,
    paginate: !!doc.paginate,
    populate: doc.populate || [],
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

// Reusable, named data sources shared across pages.
export async function GET(request) {
  try {
    const { error } = await requireCmsCapability(request, "useLiveData");
    if (error) return error;
    await connectDB();
    const docs = await CmsDataSource.find({}).sort({ key: 1 }).lean();
    return successResponse({ data: docs.map(serialize) });
  } catch (error) {
    console.error("CMS data source list error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "manageDataSources");
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const key = String(body?.key || "").trim();
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return badRequestResponse("Key must be a simple variable name, e.g. courses");
    }
    if (!isAllowedModel(body?.model)) return badRequestResponse("Unknown or blocked model");

    let definition;
    try { definition=normalizeSource(body); } catch(error) { return badRequestResponse(error.message); }
    await connectDB();
    const doc = await CmsDataSource.findOneAndUpdate(
      { key },
      {
        $set: {
          ...definition,
          updatedByEmail: user.email || "",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return successResponse({ data: serialize(doc), message: "Data source saved" });
  } catch (error) {
    console.error("CMS data source save error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(request) {
  try {
    const { error } = await requireCmsCapability(request, "manageDataSources");
    if (error) return error;
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return badRequestResponse("A key is required");
    await connectDB();
    const res = await CmsDataSource.deleteOne({ key });
    if (!res.deletedCount) return notFoundResponse("Data source not found");
    return successResponse({ message: "Data source deleted", key });
  } catch (error) {
    console.error("CMS data source delete error:", error);
    return safeErrorResponse(error, 500);
  }
}
