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

    const updateFields = {
      name: body.name.trim(),
      updatedAt: Date.now(),
    };

    if (body.code !== undefined) updateFields.code = body.code?.trim() || "";
    if (body.slug !== undefined) updateFields.slug = body.slug?.trim() || "";
    if (body.shortDescription !== undefined) updateFields.shortDescription = body.shortDescription?.trim() || "";
    if (body.description !== undefined) updateFields.description = body.description || "";
    if (body.price !== undefined) updateFields.price = parseFloat(body.price) || 0;
    if (body.currency !== undefined) updateFields.currency = body.currency?.trim() || "GBP";
    if (body.currencySymbol !== undefined) updateFields.currencySymbol = body.currencySymbol?.trim() || "£";
    if (body.currencyCode !== undefined) updateFields.currencyCode = body.currencyCode?.trim() || "GBP";
    if (body.country !== undefined) updateFields.country = body.country?.trim() || "United Kingdom";
    if (body.level !== undefined) updateFields.level = body.level || null;
    if (body.awardingBody !== undefined) updateFields.awardingBody = body.awardingBody || null;
    if (body.category !== undefined) updateFields.category = body.category?.trim() || "";
    if (body.duration !== undefined) updateFields.duration = body.duration?.trim() || "";
    if (body.durationDays !== undefined) updateFields.durationDays = Number(body.durationDays) || 0;
    if (body.featuredImage !== undefined) updateFields.featuredImage = body.featuredImage?.trim() || "";
    if (body.gallery !== undefined) updateFields.gallery = Array.isArray(body.gallery) ? body.gallery : [];
    if (body.certificateImage !== undefined) updateFields.certificateImage = body.certificateImage?.trim() || "";
    if (body.certificationInfo !== undefined) updateFields.certificationInfo = body.certificationInfo?.trim() || "";
    if (body.courseContent !== undefined) updateFields.courseContent = body.courseContent || "";
    if (body.learningOutcomes !== undefined) updateFields.learningOutcomes = body.learningOutcomes || "";
    if (body.requirements !== undefined) updateFields.requirements = body.requirements || "";
    if (body.whoShouldAttend !== undefined) updateFields.whoShouldAttend = body.whoShouldAttend || "";
    if (body.faqs !== undefined) updateFields.faqs = Array.isArray(body.faqs) ? body.faqs : [];
    if (body.featured !== undefined) updateFields.featured = !!body.featured;
    if (body.displayOrder !== undefined) updateFields.displayOrder = Number(body.displayOrder) || 0;
    if (body.status !== undefined) updateFields.status = body.status || "active";

    const course = await DefaultCourse.findByIdAndUpdate(
      id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("level", "name slug color icon")
      .populate("awardingBody", "name slug logo");

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
      message: "Course updated successfully",
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
