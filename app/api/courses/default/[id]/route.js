import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import DefaultCourse from "@/models/DefaultCourse";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await DefaultCourse.findById(id);

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: authUser, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await DefaultCourse.findByIdAndDelete(id);

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Course deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { user: authUser, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid course ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Course name is required" },
        { status: 400 }
      );
    }

    const course = await DefaultCourse.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          description: body.description || "",
          price: parseFloat(body.price) || 0,
          status: body.status || "draft",
          updatedAt: Date.now()
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
      message: "Course updated successfully"
    });
  } catch (error) {
    console.error("Error updating course:", error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update course" },
      { status: 500 }
    );
  }
}
