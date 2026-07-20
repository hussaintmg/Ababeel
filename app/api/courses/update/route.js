import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import Course from "@/models/Course";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    console.log("✏️ Course update API called");

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
    const data = await request.json();
    console.log("📦 Update request data:", data);

    const {
      id,
      name,
      price,
      currency,
      currencySymbol,
      currencyCode,
      country,
      description,
      isActive,
    } = data;

    // Validation
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

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
        {
          success: false,
          error: "You are not authorized to update this course",
        },
        { status: 403 }
      );
    }

    // Check if course with same name exists (excluding current course)
    const existingCourse = await Course.findOne({
      userId: user._id,
      name: name.trim(),
      _id: { $ne: id },
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

    // Update course
    const updateData = {
      name: name.trim(),
      price: parseFloat(price),
      currency: currency.trim(),
      currencySymbol: currencySymbol.trim(),
      currencyCode: currencyCode?.trim() || "",
      country: country?.trim() || "",
      description: description?.trim() || "",
      updatedAt: new Date(),
      isActive,
    };

    console.log("💾 Updating course with data:", updateData);

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCourse) {
      return NextResponse.json(
        { success: false, error: "Failed to update course" },
        { status: 500 }
      );
    }

    console.log("✅ Course updated successfully");

    // Format response
    const responseCourse = {
      id: updatedCourse._id.toString(),
      name: updatedCourse.name,
      price: updatedCourse.price,
      currency: updatedCourse.currency,
      currencySymbol: updatedCourse.currencySymbol,
      currencyCode: updatedCourse.currencyCode,
      country: updatedCourse.country,
      description: updatedCourse.description,
      isActive: updatedCourse.isActive,
      createdAt: updatedCourse.createdAt,
      updatedAt: updatedCourse.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Course updated successfully!",
        course: responseCourse,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Course update error:", error);

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
        error: error.message || "Failed to update course",
      },
      { status: 500 }
    );
  }
}
