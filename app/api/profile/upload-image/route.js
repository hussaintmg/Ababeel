import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { uploadFile, deleteFile, extractPublicId } from "@/utils/upload";
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

    const contentType = request.headers.get("content-type") || "";
    let profileImageData = null;

    // Direct frontend Supabase upload (preferred - ZERO server buffer)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { url, publicId } = body || {};

      if (!url) {
        return NextResponse.json(
          { success: false, error: "No profile image URL provided" },
          { status: 400 }
        );
      }

      profileImageData = {
        url,
        publicId: publicId || extractPublicId(url) || "",
        uploadedAt: new Date(),
      };
    } else {
      // Legacy multipart/form-data fallback
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
      const uploadResult = await uploadFile(buffer, `profile_images`);

      profileImageData = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
      };
    }

    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete old profile image from Supabase Storage if different
    if (user.profileImage && user.profileImage.publicId && user.profileImage.publicId !== profileImageData.publicId) {
      try {
        await deleteFile(user.profileImage.publicId);
      } catch (deleteError) {
        console.error("Error deleting old profile image:", deleteError);
      }
    }

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
      return NextResponse.json(
        { success: false, error: "Failed to update user profile image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: profileImageData,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile image update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile image" },
      { status: 500 }
    );
  }
}
