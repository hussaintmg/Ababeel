import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { uploadFile, deleteFile } from "@/utils/upload";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "write", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get("profileImage");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No profile image file provided" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Profile image file size must be less than 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.profileImage && user.profileImage.publicId) {
      try {
        await deleteFile(user.profileImage.publicId);
      } catch (deleteError) {
        console.error("Error deleting old profile image:", deleteError);
      }
    }

    const uploadResult = await uploadFile(buffer, `profile_images`);

    const profileImageData = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      authUser._id,
      {
        $set: {
          profileImage: profileImageData,
          updatedAt: new Date(),
        },
      },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      try {
        await deleteFile(uploadResult.publicId);
      } catch (rollbackError) {
        console.error("Error rolling back upload:", rollbackError);
      }

      return NextResponse.json(
        { success: false, error: "Failed to update user profile image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile image uploaded successfully",
      profileImage: profileImageData,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}
