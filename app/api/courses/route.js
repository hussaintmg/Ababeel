import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import Course from "@/models/Course";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {

    // Connect to database
    await connectDB();

    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

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

    // Fetch courses for this user
    const courses = await Course.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Format response
    const formattedCourses = courses.map(course => ({
      id: course._id.toString(),
      name: course.name,
      price: course.price,
      currency: course.currency,
      currencySymbol: course.currencySymbol,
      currencyCode: course.currencyCode,
      country: course.country,
      description: course.description,
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      formattedPrice: `${course.currencySymbol} ${course.price.toFixed(2)}`
    }));

    return NextResponse.json(
      {
        success: true,
        courses: formattedCourses,
        count: formattedCourses.length,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Courses fetch error:", error);

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
        error: error.message || "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}