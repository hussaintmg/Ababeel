import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import DefaultCourse from "@/models/DefaultCourse";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import mongoose from "mongoose";

export async function DELETE(request) {
  try {
    const { user: authUser, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "destructiveAdmin", {
      userId: authUser._id.toString(),
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No course IDs provided for deletion" },
        { status: 400 }
      );
    }

    const validIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid course IDs" },
        { status: 400 }
      );
    }

    await connectDB();
    const result = await DefaultCourse.deleteMany({ _id: { $in: validIds } });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} course(s) deleted successfully`,
      },
    });
  } catch (error) {
    console.error("Error deleting courses in bulk:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete courses in bulk" },
      { status: 500 }
    );
  }
}
