import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { deleteFile } from "@/utils/upload";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export async function DELETE(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    await connectDB();

    const { courseId, candidateId } = await request.json();

    if (!courseId || !isValidObjectId(courseId) || !candidateId || !isValidObjectId(candidateId)) {
      return NextResponse.json(
        { success: false, error: "Valid courseId and candidateId are required" },
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

    const candidate = await Candidate.findOne({
      _id: candidateId,
      courseId: courseId,
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found in this course" },
        { status: 404 },
      );
    }

    const candidatePaymentStatus = candidate.paymentStatus;

    if (candidate.profile?.publicId) {
      try {
        await deleteFile(candidate.profile.publicId);
      } catch (deleteError) {
        console.error("Error deleting image:", deleteError);
      }
    }

    const pricePerCandidate = course.coursePrice || 0;

    course.candidates = course.candidates.filter(
      (candId) => candId.toString() !== candidateId,
    );
    course.candidatesCount = course.candidates.length;
    course.updatedAt = new Date();
    await course.save();

    let allCandidates = [];
    if (course.candidates && course.candidates.length > 0) {
      allCandidates = await Candidate.find({
        _id: { $in: course.candidates },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    await Candidate.findByIdAndDelete(candidateId);

    return NextResponse.json({
      success: true,
      message: "Candidate deleted successfully",
      deletedCandidate: {
        id: candidateId,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        paymentStatus: candidatePaymentStatus,
      },
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete candidate" },
      { status: 500 },
    );
  }
}
