import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { webData } from "@/constants";

export async function POST(request) {
  try {
    await connectDB();

    const { certificateNumber, cnd_fname, cnd_lname, cnd_dob, searchOption } =
      await request.json();

    if (!certificateNumber || !cnd_fname || !cnd_lname) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const candidate = await Candidate.findOne({
      certificateNumber: certificateNumber,
    }).populate("courseId");

    if (!candidate) {
      return NextResponse.json(
        {
          success: false,
          message: "No record found with the provided Certificate Number.",
        },
        { status: 404 },
      );
    }
    // Verify name (case-insensitive)
    const firstNameMatch =
      candidate.firstName.toLowerCase() === cnd_fname.trim().toLowerCase();
    const lastNameMatch =
      candidate.lastName.toLowerCase() === cnd_lname.trim().toLowerCase();

    if (!firstNameMatch || !lastNameMatch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The name provided does not match our records for this Certificate Number.",
        },
        { status: 400 },
      );
    }

    // If search option is with DOB, verify DOB
    if (searchOption === "2" && cnd_dob) {
      const dbDob = new Date(candidate.dateOfBirth).toISOString().split("T")[0];
      const providedDob = new Date(cnd_dob).toISOString().split("T")[0];

      if (dbDob !== providedDob) {
        return NextResponse.json(
          {
            success: false,
            message: "The Date of Birth provided does not match our records.",
          },
          { status: 400 },
        );
      }
    }

    const course = candidate.courseId;
    const courseReference = await CourseReference.findById(course);

    return NextResponse.json({
      success: true,
      certificate: {
        traineeId: candidate.traineeId,
        fullName: `${candidate.firstName} ${candidate.lastName}`,
        course: course ? course.courseName : "N/A",
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
