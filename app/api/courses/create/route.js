import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import Course from "@/models/Course";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
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

    // Parse request body
    const data = await request.json();

    const { name, price, currency, currencySymbol, currencyCode, country, description } = data;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Course name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Course name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid price is required" },
        { status: 400 }
      );
    }

    if (!currency || !currencySymbol) {
      return NextResponse.json(
        { success: false, error: "Currency selection is required" },
        { status: 400 }
      );
    }

    // Check if course with same name exists for this user
    const existingCourse = await Course.findOne({
      userId: user._id,
      name: name.trim(),
    });

    if (existingCourse) {
      return NextResponse.json(
        {
          success: false,
          error: "A course with this name already exists.",
        },
        { status: 409 }
      );
    }

    // Create new course
    const courseData = {
      userId: user._id,
      name: name.trim(),
      price: parseFloat(price),
      currency: currency.trim(),
      currencySymbol: currencySymbol.trim(),
      currencyCode: currencyCode?.trim() || "",
      country: country?.trim() || "",
      description: description?.trim() || "",
      isActive: true,
    };


    const newCourse = await Course.create(courseData);

    // Format response
    const responseCourse = {
      id: newCourse._id.toString(),
      name: newCourse.name,
      price: newCourse.price,
      currency: newCourse.currency,
      currencySymbol: newCourse.currencySymbol,
      currencyCode: newCourse.currencyCode,
      country: newCourse.country,
      description: newCourse.description,
      isActive: newCourse.isActive,
      createdAt: newCourse.createdAt,
      updatedAt: newCourse.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully!",
        course: responseCourse,
      },
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Course creation error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        {
          success: false,
          error: errors.join(", "),
        },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "A course with this name already exists.",
        },
        { status: 409 }
      );
    }

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
        error: error.message || "Failed to create course",
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}