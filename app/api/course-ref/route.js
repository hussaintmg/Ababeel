// app/api/course-ref/route.js
import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import User from "@/models/User";
import jwt from "jsonwebtoken"

export async function GET(request) {
  try {
    const cookie = request.cookies.get("token");

    if (!cookie) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }

    const token = cookie.value;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.id).select("-password");

    // Fetch courses with pagination
    const courses = await CourseReference.find({ userId: user?._id });

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}
