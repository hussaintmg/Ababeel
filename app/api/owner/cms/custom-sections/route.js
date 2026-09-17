import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CmsCustomSection from "@/models/CmsCustomSection";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse, successResponse, badRequestResponse, notFoundResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/owner/cms/custom-sections
 * Retrieve all custom sections developed in the Section Code Studio (SDK).
 */
export async function GET(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    await connectDB();
    const sections = await CmsCustomSection.find().sort({ createdAt: -1 }).lean();

    return successResponse({ sections: sections || [] });
  } catch (err) {
    console.error("Failed to fetch custom sections:", err);
    return safeErrorResponse(err);
  }
}

/**
 * POST /api/owner/cms/custom-sections
 * Create or update a custom section from the Section Code Studio.
 */
export async function POST(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const body = await request.json();
    const {
      sectionId,
      name,
      category = "Custom Sections",
      description = "",
      code = "",
      css = "",
      fields = [],
      options = {},
      defaultProps = {},
      previewHtml = "",
      kind = "sdk",
      template = null,
    } = body;

    if (!name || typeof name !== "string") {
      return badRequestResponse("Section name is required");
    }

    if (!["sdk", "template"].includes(kind)) return badRequestResponse("Invalid template kind");
    if (kind === "template" && (!template || template.version !== 2 || !Array.isArray(template.blocks))) return badRequestResponse("Version 2 template blocks are required");
    const id = sectionId || `sdk_sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    await connectDB();

    const updated = await CmsCustomSection.findOneAndUpdate(
      { sectionId: id },
      {
        sectionId: id,
        kind,
        template: kind === "template" ? template : null,
        name: name.trim(),
        category: (category || "Custom Sections").trim(),
        description: (description || "").trim(),
        code: code || "",
        css: css || "",
        fields: Array.isArray(fields) ? fields : [],
        options: options || {},
        defaultProps: defaultProps || {},
        previewHtml: previewHtml || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return successResponse({
      message: "Custom section saved successfully",
      section: updated,
    });
  } catch (err) {
    console.error("Failed to save custom section:", err);
    return safeErrorResponse(err);
  }
}

export const PUT = POST;

/**
 * DELETE /api/owner/cms/custom-sections
 * Delete a custom section by sectionId.
 */
export async function DELETE(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    let sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      try {
        const body = await request.json();
        sectionId = body.sectionId;
      } catch {
        // Ignored if query param already present or empty body
      }
    }

    if (!sectionId) {
      return badRequestResponse("sectionId is required");
    }

    await connectDB();
    const result = await CmsCustomSection.findOneAndDelete({ sectionId });
    if (!result) {
      return notFoundResponse("Custom section not found");
    }

    return successResponse({
      message: "Custom section deleted successfully",
      sectionId,
    });
  } catch (err) {
    console.error("Failed to delete custom section:", err);
    return safeErrorResponse(err);
  }
}
