import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import Candidate from "@/models/Candidate";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export async function DELETE(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No course reference IDs provided for deletion" },
        { status: 400 }
      );
    }

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid course reference IDs" },
        { status: 400 }
      );
    }

    await connectDB();

    // Query filter: owners/admins can delete any valid ID, organization users can only delete their own
    const queryFilter = { _id: { $in: validIds } };
    if (!["admin", "owner"].includes(authUser.role)) {
      queryFilter.userId = authUser._id;
    }

    // Find the references to delete
    const referencesToDelete = await CourseReference.find(queryFilter).select("_id candidates");
    if (referencesToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching course references found or access denied" },
        { status: 404 }
      );
    }

    const refIdsToDelete = referencesToDelete.map((r) => r._id);

    // Delete associated candidates
    await Candidate.deleteMany({ courseId: { $in: refIdsToDelete } });

    // Delete course references
    const result = await CourseReference.deleteMany({ _id: { $in: refIdsToDelete } });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} course reference(s) deleted successfully`,
      },
    });
  } catch (error) {
    console.error("Error deleting course references in bulk:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete course references in bulk" },
      { status: 500 }
    );
  }
}
