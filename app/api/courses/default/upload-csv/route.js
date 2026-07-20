// app/api/courses/upload-csv/route.js
import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import DefaultCourse from "@/models/DefaultCourse";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    await connectDB();

    // Get user from token
    const cookie = request.cookies.get("token");
    if (!cookie?.value) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please login.",
        },
        { status: 401 }
      );
    }

    const token = cookie.value;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 401 }
      );
    }

    // Check if user has permission to create courses
    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Only admin or owner can upload courses.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { courses } = body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No courses data provided",
        },
        { status: 400 }
      );
    }

    // Validate each course
    const validatedCourses = [];
    const errors = [];

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];

      // Basic validation
      if (!course.name || !course.price || !course.description) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      // Validate price
      const price = parseFloat(course.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${i + 1}: Invalid price`);
        continue;
      }

      // Prepare course data with default values
      validatedCourses.push({
        ...course,
        createdBy: user._id,
        updatedBy: user._id,
        isDefaultCourse: true,
        status: "active",
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation errors found",
          errors: errors.slice(0, 10), // Limit errors to prevent large response
        },
        { status: 400 }
      );
    }

    // Insert courses in bulk
    const insertedCourses = await DefaultCourse.insertMany(validatedCourses);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCourses.length} courses`,
      data: {
        count: insertedCourses.length,
        courses: insertedCourses.map((course) => ({
          id: course._id,
          name: course.name,
          price: course.price,
          currency: course.currency,
        })),
      },
    });
  } catch (error) {
    console.error("CSV upload error:", error);

    // Handle duplicate key errors (unique slug)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Duplicate course found. Please check for duplicate course names.",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload courses",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET: Download sample CSV template
export async function GET(request) {
  try {
    const sampleData = [
      {
        name: "Award in Boom Lift Safe Operator Training",
        price: "3300",
        currency: "PKR",
        currencySymbol: "₨",
        currencyCode: "PKR",
        country: "Pakistan",
        description: "Award in Boom Lift Safe Operator Training",
        categories: "Safety,Operator Training",
        duration: "24",
        level: "intermediate",
      },
      {
        name: "Level 2 Award In Emergency First Aid at Work",
        price: "1925",
        currency: "PKR",
        currencySymbol: "₨",
        currencyCode: "PKR",
        country: "Pakistan",
        description: "Level 2 Award In Emergency First Aid at Work",
        categories: "First Aid,Emergency",
        duration: "8",
        level: "beginner",
      },
    ];

    const csv = Papa.unparse(sampleData);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="course_template.csv"',
      },
    });
  } catch (error) {
    console.error("Sample CSV download error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate sample CSV",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
