import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import DefaultCourse from "@/models/DefaultCourse";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function DELETE(request) {
  try {
    const { user: authUser, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "destructiveAdmin", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    await DefaultCourse.deleteMany({});

    return NextResponse.json({
      success: true,
      data: { message: "All Courses deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete courses" },
      { status: 500 }
    );
  }
}
