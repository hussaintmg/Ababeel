import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
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
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token. Please login again.",
        },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token data.",
        },
        { status: 401 }
      );
    }

    const { country, contactNo, address } = await request.json();

    // Validate input
    if (!country || !contactNo || !address) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (contactNo.length < 10) {
      return NextResponse.json(
        { success: false, error: "Valid contact number is required" },
        { status: 400 }
      );
    }

    if (address.length < 5) {
      return NextResponse.json(
        { success: false, error: "Address must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        $set: {
          country,
          contact: contactNo,
          address,
          updatedAt: new Date(),
        },
      },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Personal details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Personal details update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
