import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { uploadFile, deleteFile, extractPublicId } from "@/utils/upload";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export async function PUT(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    await connectDB();

    const contentType = request.headers.get("content-type") || "";
    let candidateId, courseId, traineeId, firstName, lastName, dateOfBirth, country, email;
    let assessmentMarks1, assessmentMarks2;
    let newProfileData = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      candidateId = body.candidateId;
      courseId = body.courseId;
      traineeId = body.id !== undefined ? body.id : body.traineeId;
      firstName = body.firstName;
      lastName = body.lastName;
      dateOfBirth = body.dateOfBirth;
      country = body.country;
      email = body.email;
      assessmentMarks1 = body.assessmentMarks1;
      assessmentMarks2 = body.assessmentMarks2;

      if (body.profile && body.profile.url) {
        newProfileData = {
          url: body.profile.url,
          publicId: body.profile.publicId || extractPublicId(body.profile.url) || "",
        };
      } else if (body.profilePicture && typeof body.profilePicture === "object" && body.profilePicture.url) {
        newProfileData = {
          url: body.profilePicture.url,
          publicId: body.profilePicture.publicId || extractPublicId(body.profilePicture.url) || "",
        };
      } else if (typeof body.profilePicture === "string" && body.profilePicture && body.profilePicture.startsWith("http")) {
        newProfileData = {
          url: body.profilePicture,
          publicId: extractPublicId(body.profilePicture) || "",
        };
      }
    } else {
      const formData = await request.formData();
      candidateId = formData.get("candidateId");
      courseId = formData.get("courseId");
      traineeId = formData.get("id");
      firstName = formData.get("firstName");
      lastName = formData.get("lastName");
      dateOfBirth = formData.get("dateOfBirth");
      country = formData.get("country");
      email = formData.get("email");
      assessmentMarks1 = formData.get("assessmentMarks1");
      assessmentMarks2 = formData.get("assessmentMarks2");

      const profileFile = formData.get("profilePicture");
      if (profileFile && typeof profileFile === "object" && profileFile.size > 0) {
        try {
          const bytes = await profileFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadResult = await uploadFile(buffer, "candidates/profiles");
          newProfileData = {
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
    }

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

    // Handle new profile picture update & old file deletion
    if (newProfileData) {
      if (candidate.profile?.publicId && candidate.profile.publicId !== newProfileData.publicId) {
        try {
          await deleteFile(candidate.profile.publicId, "image");
        } catch (err) {
          console.error("Error deleting old candidate picture:", err);
        }
      }
      candidate.profile = newProfileData;
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

    candidate.marks = (candidate.assessmentMarks1 || 0) + (candidate.assessmentMarks2 || 0);
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
