import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseLevel from "@/models/CourseLevel";
import { PUBLISHED } from "@/lib/training/status";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query = status ? { status } : { ...PUBLISHED };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const levels = await CourseLevel.find(query)
      .select("name slug description icon image color status displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: levels || [],
      count: levels ? levels.length : 0,
    });
  } catch (error) {
    console.error("Error fetching course levels:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch course levels" },
      { status: 500 }
    );
  }
}
