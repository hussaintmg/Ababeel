import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import { isValidObjectId } from "@/lib/validation";
import { isRegistrationOpen } from "@/lib/training/status";
import { REGISTERABLE_SESSION_STATUSES } from "@/lib/training/constants";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    await connectDB();

    let targetCourseId = id;
    if (!isValidObjectId(id)) {
      const Course = (await import("@/models/Course")).default;
      const courseDoc = await Course.findOne({ slug: String(id).toLowerCase() }).select("_id").lean();
      if (!courseDoc) {
        return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
      }
      targetCourseId = courseDoc._id.toString();
    }

    const crRefs = await CourseReference.find({
      $or: [{ course: targetCourseId }, { courseId: targetCourseId }, { courseId: id }],
      showInSchedule: { $ne: false },
      status: { $in: REGISTERABLE_SESSION_STATUSES },
    })
      .sort({ startDate: 1 })
      .lean();

    const now = new Date();
    const activeRefs = crRefs.filter((r) => isRegistrationOpen(r, now));

    const formattedRefs = activeRefs.map((r) => ({
      _id: r._id.toString(),
      referenceName: r.referenceName || r.courseName || "Intake Session",
      referenceCode: r.referenceCode || r.referenceNumber,
      startDate: r.startDate,
      endDate: r.endDate,
      examDate: r.examDate,
      registrationDeadline: r.registrationDeadline,
      mode: r.mode || "online",
      modeLabel: r.modeLabel || "",
      location: r.location || "Online",
      duration: r.duration || "",
      seats: r.seats || 20,
      candidatesCount: r.candidatesCount || 0,
      seatsLeft: r.seats ? Math.max(0, r.seats - (r.candidatesCount || 0)) : null,
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
