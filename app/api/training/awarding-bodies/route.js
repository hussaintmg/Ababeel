import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import AwardingBody from "@/models/AwardingBody";
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
        { shortName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const bodies = await AwardingBody.find(query)
      .select("name slug shortName logo coverImage description website accreditations status displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: bodies || [],
      count: bodies ? bodies.length : 0,
    });
  } catch (error) {
    console.error("Error fetching awarding bodies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch awarding bodies" },
      { status: 500 }
    );
  }
}
