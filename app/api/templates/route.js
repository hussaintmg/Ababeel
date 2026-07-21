import connectDB from "@/utils/db";
import Template from "@/models/Template";
import { requireOwner } from "@/lib/auth";
import { successResponse, badRequestResponse, safeErrorResponse } from "@/lib/errors";

const VALID_TYPES = ["Course Certificate", "Course Id Card"];

// GET /api/templates → list all templates (newest first).
export async function GET(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    await connectDB();
    const templates = await Template.find({}).sort({ createdAt: -1 }).lean();
    return successResponse({ data: templates });
  } catch (err) {
    console.error("Templates list error:", err);
    return safeErrorResponse(err, 500);
  }
}

// POST /api/templates → create a template ({ type, name, isActive?, designData? }).
export async function POST(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const type = String(body?.type || "").trim();
    const name = String(body?.name || "").trim();
    if (!VALID_TYPES.includes(type)) return badRequestResponse("Invalid template type");
    if (!name) return badRequestResponse("Template name is required");

    await connectDB();

    // Only one active template per type — deactivate the rest if this is active.
    const makeActive = !!body.isActive;
    if (makeActive) {
      await Template.updateMany({ type }, { $set: { isActive: false } });
    }

    const doc = await Template.create({
      type,
      name: name.slice(0, 120),
      isActive: makeActive,
      designData:
        body.designData && typeof body.designData === "object"
          ? body.designData
          : { pages: [] },
    });

    return successResponse({ data: doc.toObject() }, 201);
  } catch (err) {
    console.error("Template create error:", err);
    return safeErrorResponse(err, 500);
  }
}
