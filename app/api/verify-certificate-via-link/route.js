import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { webData } from "@/constants";
export async function POST(request) {
  try {
    await connectDB();

    const { traineeId, cnd_fname, cnd_lname, candidateId } =
      await request.json();

    if (!traineeId || !cnd_fname || !cnd_lname || !candidateId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return NextResponse.json(
        {
          success: false,
          message: "No record found with the provided Trainee ID.",
        },
        { status: 404 },
      );
    }
    // Verify traineeId
    const traineeIdMatch =
      candidate.traineeId.toLowerCase() === traineeId.trim().toLowerCase();
    if (!traineeIdMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "The Trainee ID provided does not match our records.",
        },
        { status: 400 },
      );
    }
    // Verify name (case-insensitive)
    const firstNameMatch =
      candidate.firstName.toLowerCase().replaceAll("-", " ") ===
      cnd_fname.trim().toLowerCase().replaceAll("-", " ");
    const lastNameMatch =
      candidate.lastName.toLowerCase().replaceAll("-", " ") ===
      cnd_lname.trim().toLowerCase().replaceAll("-", " ");

    if (!firstNameMatch || !lastNameMatch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The name provided does not match our records for this Trainee ID.",
        },
        { status: 400 },
      );
    }

    const course = candidate.courseId;
    const courseReference = await CourseReference.findById(course);

    return NextResponse.json({
      success: true,
      certificate: {
        traineeId: candidate.traineeId,
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        course: courseReference ? courseReference.courseName : "N/A",
        issueDate: candidate.updatedAt
          ? new Date(candidate.updatedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "N/A",
        status:
          new Date() < courseReference.endDate
            ? "Active / In Progress"
            : "Expired / Inactive",
        certificateType: `${webData.brand.name} Certified`,
        verificationId: candidate.certificateNumber,
      },
      courseReference,
      message: "Certificate verified successfully!",
    });
  } catch (error) {
    console.error("Verification API Error:", error);
    return NextResponse.json(
      { success: false, message: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
