import connectDB from "@/utils/db";
import Template from "@/models/Template";
import { requireOwner } from "@/lib/auth";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  safeErrorResponse,
} from "@/lib/errors";

// GET /api/templates/[id] → a single template.
export async function GET(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const { id } = await params;
    await connectDB();
    const doc = await Template.findById(id).lean();
    if (!doc) return notFoundResponse("Template not found");
    return successResponse({ data: doc });
  } catch (err) {
    console.error("Template read error:", err);
    return safeErrorResponse(err, 500);
  }
}

// PUT /api/templates/[id]            → update name / isActive / designData
// PUT /api/templates/[id]?action=setActive → make this the active template for its type
export async function PUT(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const { id } = await params;
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    await connectDB();
    const existing = await Template.findById(id);
    if (!existing) return notFoundResponse("Template not found");

    // Activate this template (and deactivate the rest of its type).
    if (action === "setActive") {
      await Template.updateMany(
        { type: existing.type, _id: { $ne: existing._id } },
        { $set: { isActive: false } }
      );
      existing.isActive = true;
      await existing.save();
      return successResponse({ data: existing.toObject() });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    if (typeof body.name === "string") existing.name = body.name.trim().slice(0, 120);
    if (body.designData && typeof body.designData === "object") existing.designData = body.designData;
    if (typeof body.isActive === "boolean") {
      if (body.isActive) {
        await Template.updateMany(
          { type: existing.type, _id: { $ne: existing._id } },
          { $set: { isActive: false } }
        );
      }
      existing.isActive = body.isActive;
    }

    await existing.save();
    return successResponse({ data: existing.toObject() });
  } catch (err) {
    console.error("Template update error:", err);
    return safeErrorResponse(err, 500);
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const { id } = await params;
    await connectDB();
    const res = await Template.findByIdAndDelete(id);
    if (!res) return notFoundResponse("Template not found");
    return successResponse({ message: "Template deleted", id });
  } catch (err) {
    console.error("Template delete error:", err);
    return safeErrorResponse(err, 500);
  }
}
