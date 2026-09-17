import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { uploadFile, extractPublicId } from "@/utils/upload";
import { webData } from "@/constants";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId } from "@/lib/validation";

async function generateUniqueCertificateNumber() {
  let isUnique = false;
  let certificateNumber = "";
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    certificateNumber = `${webData.documents.certificatePrefix}-V-${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;

    const existingCandidate = await Candidate.findOne({ certificateNumber });

    if (!existingCandidate) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error("Unable to generate unique certificate number after multiple attempts");
  }

  return certificateNumber;
}

export async function POST(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "write", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const contentType = request.headers.get("content-type") || "";
    let courseId, id, firstName, lastName, dateOfBirth, country, email;
    let assessmentMarks1, assessmentMarks2;
    let profileData = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      courseId = body.courseId;
      id = body.id || body.traineeId;
      firstName = body.firstName;
      lastName = body.lastName;
      dateOfBirth = body.dateOfBirth;
      country = body.country;
      email = body.email;
      assessmentMarks1 = parseFloat(body.assessmentMarks1);
      assessmentMarks2 = parseFloat(body.assessmentMarks2);

      if (body.profile && body.profile.url) {
        profileData = {
          url: body.profile.url,
          publicId: body.profile.publicId || extractPublicId(body.profile.url) || "",
        };
      } else if (body.profilePicture && typeof body.profilePicture === "object" && body.profilePicture.url) {
        profileData = {
          url: body.profilePicture.url,
          publicId: body.profilePicture.publicId || extractPublicId(body.profilePicture.url) || "",
        };
      } else if (typeof body.profilePicture === "string" && body.profilePicture) {
        profileData = {
          url: body.profilePicture,
          publicId: extractPublicId(body.profilePicture) || "",
        };
      }
    } else {
      const formData = await request.formData();
      courseId = formData.get("courseId");
      id = formData.get("id");
      firstName = formData.get("firstName");
      lastName = formData.get("lastName");
      dateOfBirth = formData.get("dateOfBirth");
      country = formData.get("country");
      email = formData.get("email");
      assessmentMarks1 = parseFloat(formData.get("assessmentMarks1"));
      assessmentMarks2 = parseFloat(formData.get("assessmentMarks2"));

      const profileFile = formData.get("profilePicture");
      if (profileFile && typeof profileFile === "object" && profileFile.size > 0) {
        try {
          const bytes = await profileFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadResult = await uploadFile(buffer, "candidates/profile");
          profileData = {
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

    if (!courseId || !isValidObjectId(courseId)) {
      return NextResponse.json(
        { success: false, error: "Valid courseId is required" },
        { status: 400 },
      );
    }

    if (!firstName || !lastName || !dateOfBirth || !country || !email ||
        isNaN(assessmentMarks1) || isNaN(assessmentMarks2)) {
      return NextResponse.json(
        { success: false, error: "All required fields must be filled" },
        { status: 400 },
      );
    }

    if (assessmentMarks1 > 50 || assessmentMarks2 > 50) {
      return NextResponse.json(
        { success: false, error: "Assessment marks cannot exceed 50" },
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

    const userId = authUser._id.toString();

    const existingCandidateId = await Candidate.findOne({
      traineeId: id,
      courseId,
    });
    if (existingCandidateId) {
      return NextResponse.json(
        { success: false, error: "Candidate with this ID already exists." },
        { status: 409 },
      );
    }

    const existingCandidate = await Candidate.findOne({
      email: email.toLowerCase(),
      courseId,
    });

    if (existingCandidate) {
      return NextResponse.json(
        { success: false, error: "Candidate with this email already exists in this course" },
        { status: 409 },
      );
    }

    const marks = assessmentMarks1 + assessmentMarks2;
    const certificateNumber = await generateUniqueCertificateNumber();

    const candidate = await Candidate.create({
      userId,
      courseId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      country,
      email: email.toLowerCase(),
      assessmentMarks1,
      assessmentMarks2,
      marks,
      traineeId: id,
      certificateNumber,
      ...(profileData && { profile: profileData }),
    });

    course.candidates.push(candidate._id);
    course.candidatesCount = course.candidates.length;
    await course.save();

    let allCandidates = [];
    if (course.candidates && course.candidates.length > 0) {
      allCandidates = await Candidate.find({
        _id: { $in: course.candidates },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    const unpaidCandidates = allCandidates.filter(
      (c) => c.paymentStatus === "unpaid",
    );

    return NextResponse.json({
      success: true,
      message: "Candidate added successfully",
      candidate,
      candidates: allCandidates,
      total: allCandidates.length,
    });
  } catch (error) {
    console.error("Error adding candidate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add candidate" },
      { status: 500 },
    );
  }
}
