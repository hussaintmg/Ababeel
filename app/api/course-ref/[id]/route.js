import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET single course reference
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();
    const reference = await CourseReference.findById(id)
      .populate("course", "name code slug price currency duration level awardingBody")
      .populate("candidates");

    if (!reference) {
      return NextResponse.json({ success: false, error: "Course reference not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reference });
  } catch (error) {
    console.error("Error fetching course reference:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH toggle showInSchedule / update status
export async function PATCH(request, { params }) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();
    const body = await request.json();

    const updateData = {};
    if (body.showInSchedule !== undefined) {
      updateData.showInSchedule = Boolean(body.showInSchedule);
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    updateData.updatedAt = new Date();

    const reference = await CourseReference.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!reference) {
      return NextResponse.json({ success: false, error: "Course reference not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Reference updated successfully",
      data: reference,
    });
  } catch (error) {
    console.error("Error updating course reference:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update full course reference
export async function PUT(request, { params }) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();
    const body = await request.json();

    const updateFields = {
      updatedAt: new Date(),
    };

    if (body.referenceName !== undefined) updateFields.referenceName = body.referenceName;
    if (body.referenceCode !== undefined) updateFields.referenceCode = body.referenceCode;
    if (body.startDate !== undefined) updateFields.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateFields.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.examDate !== undefined) updateFields.examDate = body.examDate ? new Date(body.examDate) : null;
    if (body.registrationDeadline !== undefined) updateFields.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : null;
    if (body.mode !== undefined) updateFields.mode = body.mode;
    if (body.modeLabel !== undefined) updateFields.modeLabel = body.modeLabel;
    if (body.location !== undefined) updateFields.location = body.location;
    if (body.duration !== undefined) updateFields.duration = body.duration;
    if (body.seats !== undefined) updateFields.seats = Number(body.seats);
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.showInSchedule !== undefined) updateFields.showInSchedule = Boolean(body.showInSchedule);
    if (body.status !== undefined) updateFields.status = body.status;

    const reference = await CourseReference.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!reference) {
      return NextResponse.json({ success: false, error: "Course reference not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Course reference updated successfully",
      data: reference,
    });
  } catch (error) {
    console.error("Error updating course reference:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE course reference
export async function DELETE(request, { params }) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    await connectDB();
    const deleted = await CourseReference.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Course reference not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Course reference deleted successfully" });
  } catch (error) {
    console.error("Error deleting course reference:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
