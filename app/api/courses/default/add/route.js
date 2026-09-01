import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import DefaultCourse from "@/models/DefaultCourse";
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
    if (user.role!=="admin"&&user.role!=="owner") {
      console.log("❌ User not authorized");
      return NextResponse.json(
        {
          success: false,
          error: "User not authorized.",
        },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await request.json();

    const {
      name,
      code,
      slug,
      shortDescription,
      description,
      price,
      currency,
      currencySymbol,
      currencyCode,
      country,
      level,
      awardingBody,
      category,
      duration,
      durationDays,
      featuredImage,
      gallery,
      certificateImage,
      certificationInfo,
      courseContent,
      learningOutcomes,
      requirements,
      whoShouldAttend,
      faqs,
      featured,
      displayOrder,
      status,
    } = data;

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

    // Check if course with same name exists
    const existingCourse = await DefaultCourse.findOne({
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
      name: name.trim(),
      code: code?.trim() || "",
      slug: slug?.trim() || "",
      shortDescription: shortDescription?.trim() || "",
      description: description?.trim() || "",
      price: price ? parseFloat(price) : 0,
      currency: currency?.trim() || "GBP",
      currencySymbol: currencySymbol?.trim() || "£",
      currencyCode: currencyCode?.trim() || "GBP",
      country: country?.trim() || "United Kingdom",
      level: level || null,
      awardingBody: awardingBody || null,
      category: category?.trim() || "",
      duration: duration?.trim() || "",
      durationDays: durationDays ? Number(durationDays) : 0,
      featuredImage: featuredImage?.trim() || "",
      gallery: Array.isArray(gallery) ? gallery : [],
      certificateImage: certificateImage?.trim() || "",
      certificationInfo: certificationInfo?.trim() || "",
      courseContent: courseContent?.trim() || "",
      learningOutcomes: learningOutcomes?.trim() || "",
      requirements: requirements?.trim() || "",
      whoShouldAttend: whoShouldAttend?.trim() || "",
      faqs: Array.isArray(faqs) ? faqs : [],
      featured: !!featured,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      status: status || "active",
      isDefaultCourse: true,
      createdBy: user._id,
      updatedBy: user._id,
    };

    const newCourse = await DefaultCourse.create(courseData);

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully!",
        course: newCourse,
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