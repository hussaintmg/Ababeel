import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitize } from "@/lib/validation";
import { z } from "zod";

const updateUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(100),
});

export async function POST(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "write", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const body = await request.json();

    const validation = validateAndSanitize(updateUsernameSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const { username } = validation.data;

    const existingUser = await User.findOne({
      username: username.trim(),
      _id: { $ne: authUser._id },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      authUser._id,
      {
        $set: {
          username: username.trim(),
          updatedAt: new Date(),
        },
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Username updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update username error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
