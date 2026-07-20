import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import DefaultCourse from "@/models/DefaultCourse";

// GET all course
export async function GET() {
  try {
    await connectDB();

    const courses = await DefaultCourse.find();

    if (!courses) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}