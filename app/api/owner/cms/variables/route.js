import connectDB from "@/utils/db";
import CmsVariable from "@/models/CmsVariable";
import { requireCmsCapability } from "@/lib/cms/permissions";
import { safeErrorResponse, successResponse, badRequestResponse, notFoundResponse } from "@/lib/errors";
import { getVariables, categoriesFrom, schemaTree, getRegistryState } from "@/lib/cms/variableRegistry";
import { validateImportItem } from "@/lib/cms/importExport";
import { getSchemaRegistry } from "@/lib/cms/schemaRegistry";

export const dynamic = "force-dynamic";

// GET /api/owner/cms/variables
// The whole registry: flat variables, the model tree for the explorer,
// sidebar categories and the last-sync banner data.
export async function GET(request) {
  try {
    const { error } = await requireCmsCapability(request, "viewVariables");
    if (error) return error;

    const [variables, state] = await Promise.all([getVariables(), getRegistryState()]);
    return successResponse({
      data: {
        variables,
        tree: schemaTree(),
        categories: categoriesFrom(variables),
        state,
      },
    });
  } catch (error) {
    console.error("CMS variables list error:", error);
    return safeErrorResponse(error, 500);
  }
}

// POST — create a custom variable.
export async function POST(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "manageVariables");
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    await connectDB();
    const modelNames = new Set(getSchemaRegistry().map((m) => m.name));
    const existing = await CmsVariable.find({}).select("name").lean();
    const check = validateImportItem(
      { ...body, kind: "custom" },
      { existingNames: new Set(existing.map((d) => d.name)), modelNames }
    );
    if (!check.ok) return badRequestResponse(check.errors.join("; "));
    if (check.status === "duplicate") {
      return badRequestResponse(`A variable named "${check.variable.name}" already exists`);
    }

    const doc = await CmsVariable.create({
      ...check.variable,
      kind: "custom",
      updatedByEmail: user.email || "",
    });
    return successResponse({ data: { id: String(doc._id), name: doc.name }, message: "Variable created" }, 201);
  } catch (error) {
    console.error("CMS variable create error:", error);
    return safeErrorResponse(error, 500);
  }
}

// PUT — update a custom variable, or annotate a discovered one.
export async function PUT(request) {
  try {
    const { user, error } = await requireCmsCapability(request, "manageVariables");
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const name = String(body?.name || "").trim();
    if (!name) return badRequestResponse("A variable name is required");

    await connectDB();

    // Annotating a schema-discovered field: upsert a "schema" kind doc that
    // only carries the human description/label, never a value.
    if (body?.kind === "schema") {
      const doc = await CmsVariable.findOneAndUpdate(
        { name },
        {
          $set: {
            kind: "schema",
            description: String(body.description || "").slice(0, 500),
            label: String(body.label || "").slice(0, 120),
            source: String(body.source || ""),
            path: String(body.path || ""),
            type: String(body.type || "String"),
            ref: String(body.ref || ""),
            updatedByEmail: user.email || "",
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();
      return successResponse({ data: { id: String(doc._id), name: doc.name }, message: "Saved" });
    }

    const modelNames = new Set(getSchemaRegistry().map((m) => m.name));
    const check = validateImportItem({ ...body, kind: "custom" }, { modelNames });
    if (!check.ok) return badRequestResponse(check.errors.join("; "));

    const doc = await CmsVariable.findOneAndUpdate(
      { name, kind: "custom" },
      { $set: { ...check.variable, updatedByEmail: user.email || "" } },
      { new: true }
    ).lean();
    if (!doc) return notFoundResponse("Custom variable not found");
    return successResponse({ data: { id: String(doc._id), name: doc.name }, message: "Variable updated" });
  } catch (error) {
    console.error("CMS variable update error:", error);
    return safeErrorResponse(error, 500);
  }
}

// DELETE /api/owner/cms/variables?name=site.name
export async function DELETE(request) {
  try {
    const { error } = await requireCmsCapability(request, "manageVariables");
    if (error) return error;

    const name = new URL(request.url).searchParams.get("name");
    if (!name) return badRequestResponse("A variable name is required");

    await connectDB();
    const res = await CmsVariable.deleteOne({ name });
    if (!res.deletedCount) return notFoundResponse("Variable not found");
    return successResponse({ message: "Variable deleted", name });
  } catch (error) {
    console.error("CMS variable delete error:", error);
    return safeErrorResponse(error, 500);
  }
}
