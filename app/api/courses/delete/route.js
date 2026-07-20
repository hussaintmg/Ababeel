import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import Course from "@/models/Course";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    console.log("🗑️ Course delete API called");

    // Connect to database
    await connectDB();
    console.log("✅ Database connected");

    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("✅ Token found:", !!token);

    if (!token) {
      console.log("❌ No token found");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access. Please login first.",
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded for user ID:", decoded.id);
    } catch (jwtError) {
      console.error("❌ JWT verification error:", jwtError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token. Please login again.",
        },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.id) {
      console.log("❌ Invalid token data");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token data.",
        },
        { status: 401 }
      );
    }

    // Get user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const { id } = await request.json();
    console.log("📦 Delete request for course ID:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Find course
    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (course.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to delete this course" },
        { status: 403 }
      );
    }

    // Delete course
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return NextResponse.json(
        { success: false, error: "Failed to delete course" },
        { status: 500 }
      );
    }

    console.log("✅ Course deleted successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Course deleted successfully!",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Course delete error:", error);

    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token. Please login again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete course",
      },
      { status: 500 }
    );
  }
}