import connectDB from "@/utils/db";
import User from "@/models/User";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PUT(request) {
  try {
    // Connect to database
    await connectDB();

    // Get token from cookies - cookies() returns a Promise
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

    // Get form data
    const { atcName, atcNumber, atcAddress } = await request.json();
    // Validate required fields
    if (!atcName?.trim() || !atcNumber?.trim() || !atcAddress?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "All ATC fields are required",
        }),
        { status: 400 }
      );
    }

    // Update user with ATC details
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        $set: {
          atcDetails: {
            atcName: atcName.trim(),
            atcNumber: atcNumber.trim(),
            atcAddress: atcAddress.trim(),
            updatedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not found",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "ATC details updated successfully",
        user: updatedUser,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating ATC details:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Internal server error",
      }),
      { status: 500 }
    );
  }
}
