import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { uploadFile, deleteFile } from "@/utils/upload";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export async function PUT(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    await connectDB();
    const formData = await request.formData();

    const candidateId = formData.get("candidateId");
    const courseId = formData.get("courseId");
    const traineeId = formData.get("id");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const dateOfBirth = formData.get("dateOfBirth");
    const country = formData.get("country");
    const email = formData.get("email");
    const assessmentMarks1 = formData.get("assessmentMarks1");
    const assessmentMarks2 = formData.get("assessmentMarks2");

    if (!candidateId || !isValidObjectId(candidateId) || !courseId || !isValidObjectId(courseId)) {
      return NextResponse.json(
        { success: false, error: "Valid candidateId and courseId are required" },
        { status: 400 },
      );
    }

    const course = await CourseReference.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 },
      );
    }

    if (course.userId.toString() !== authUser._id.toString() && !["admin", "owner"].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied: not the course owner" },
        { status: 403 },
      );
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 },
      );
    }

    if (candidate.courseId.toString() !== courseId) {
      return NextResponse.json(
        { success: false, error: "Candidate does not belong to this course" },
        { status: 400 },
      );
    }

    if (traineeId !== null && traineeId !== undefined && traineeId !== "") {
      const existingCandidateId = await Candidate.findOne({
        traineeId,
        courseId,
      });
      if (
        existingCandidateId &&
        existingCandidateId._id.toString() !== candidateId
      ) {
        return NextResponse.json(
          { success: false, error: "Candidate with this ID already exists." },
          { status: 409 },
        );
      }
    }

    if (email !== null && email !== undefined && email !== "") {
      const existingCandidate = await Candidate.findOne({
        email: email.toLowerCase(),
        courseId,
      });

      if (
        existingCandidate &&
        existingCandidate._id.toString() !== candidateId
      ) {
        return NextResponse.json(
          { success: false, error: "Candidate with this email already exists in this course" },
          { status: 409 },
        );
      }
    }

    const profileFile = formData.get("profilePicture");

    if (profileFile && profileFile.size > 0) {
      try {
        const bytes = await profileFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (candidate.profile?.publicId) {
          try {
            await deleteFile(candidate.profile?.publicId, "image");
          } catch (err) {
            console.log(err);
          }
        }

        const uploadResult = await uploadFile(
          buffer,
          "candidates/profiles",
        );

        candidate.profile = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      } catch (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
        return NextResponse.json(
          { success: false, error: "Failed to upload profile picture" },
          { status: 500 },
        );
      }
    }

    if (traineeId !== null && traineeId !== undefined && traineeId !== "")
      candidate.traineeId = traineeId;
    if (firstName !== null && firstName !== undefined)
      candidate.firstName = firstName;
    if (lastName !== null && lastName !== undefined)
      candidate.lastName = lastName;
    if (dateOfBirth !== null && dateOfBirth !== undefined)
      candidate.dateOfBirth = new Date(dateOfBirth);
    if (country !== null && country !== undefined) candidate.country = country;
    if (email !== null && email !== undefined)
      candidate.email = email.toLowerCase();

    if (assessmentMarks1 !== null && assessmentMarks1 !== undefined) {
      const marks1 = parseFloat(assessmentMarks1);
      if (!isNaN(marks1)) {
        candidate.assessmentMarks1 = marks1;
      }
    }

    if (assessmentMarks2 !== null && assessmentMarks2 !== undefined) {
      const marks2 = parseFloat(assessmentMarks2);
      if (!isNaN(marks2)) {
        candidate.assessmentMarks2 = marks2;
      }
    }

    candidate.marks = candidate.assessmentMarks1 + candidate.assessmentMarks2;
    candidate.updatedAt = new Date();

    await candidate.save();

    return NextResponse.json({
      success: true,
      message: "Candidate updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("Error updating candidate:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Candidate with this email already exists in this course" },
        { status: 400 },
      );
    }

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update candidate" },
      { status: 500 },
    );
  }
}
