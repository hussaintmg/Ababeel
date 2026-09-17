import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import { isValidObjectId } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid course ID" }, { status: 400 });
    }

    await connectDB();

    const crRefs = await CourseReference.find({
      $or: [{ course: id }, { courseId: id }],
      showInSchedule: { $ne: false },
      status: { $in: ["active", "open", "published", "scheduled"] },
    })
      .sort({ startDate: 1 })
      .lean();

    const formattedRefs = crRefs.map((r) => ({
      _id: r._id.toString(),
      referenceName: r.referenceName || r.courseName || "Intake Session",
      referenceCode: r.referenceCode || r.referenceNumber,
      startDate: r.startDate,
      endDate: r.endDate,
      examDate: r.examDate,
      mode: r.mode || "online",
      modeLabel: r.modeLabel || "",
      location: r.location || "Online",
      duration: r.duration || "",
      seats: r.seats || 20,
      candidatesCount: r.candidatesCount || 0,
      status: r.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRefs,
    });
  } catch (error) {
    console.error("Error fetching course sessions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
