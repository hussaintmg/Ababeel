import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(req);
    if (authError) return authError;

    await connectDB();
    const { courseId } = await req.json();

    if (!courseId || !isValidObjectId(courseId)) {
      return NextResponse.json(
        { success: false, error: "Valid courseId is required" },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await CourseReference.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.userId.toString() !== authUser._id.toString() && !["admin", "owner"].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied: not the course owner" },
        { status: 403 }
      );
    }

    let candidates = [];

    // Get all candidates for this course using their IDs
    if (course?.candidates && course.candidates.length > 0) {
      // Use Promise.all to fetch all candidates in parallel
      const candidatePromises = course.candidates.map(async (candidateId) => {
        try {
          const candidate = await Candidate.findById(candidateId)
            .select("-__v")
            .lean();
          return candidate;
        } catch (error) {
          console.error(`Error fetching candidate ${candidateId}:`, error);
          return null;
        }
      });

      // Wait for all promises to resolve
      const candidatesArray = await Promise.all(candidatePromises);

      // Filter out null values (failed fetches)
      candidates = candidatesArray.filter((candidate) => candidate !== null);
    }

    return NextResponse.json({
      success: true,
      candidates,
    });
  } catch (error) {
    console.error("Error getting candidates:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get candidates",
      },
      { status: 500 }
    );
  }
}