import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { uploadFile, deleteFile } from "@/utils/upload";

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

    const formData = await request.formData();
    const file = formData.get("signature");

    const buffer = Buffer.from(await file.arrayBuffer());

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete old signature if exists
    if (user.signature && user.signature.publicId) {
      try {
        await deleteFile(user.signature.publicId);
      } catch (deleteError) {
        console.error("Error deleting old signature:", deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Upload file
    const uploadResult = await uploadFile(buffer, `signatures`);

    // Create signature object
    const signatureData = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date(),
    };

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        $set: {
          signature: signatureData,
          updatedAt: new Date(),
        },
      },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      // Try to delete uploaded image if DB update fails
      try {
        await deleteFile(uploadResult.publicId);
      } catch (rollbackError) {
        console.error("Error rolling back upload:", rollbackError);
      }

      return NextResponse.json(
        { success: false, error: "Failed to update user signature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Signature uploaded successfully",
      signature: signatureData,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Signature upload error:", error);

    let errorMessage = "Failed to upload signature";
    let statusCode = 500;

    if (error.message.includes("Only PNG images")) {
      errorMessage = "Only PNG images are allowed for signature";
      statusCode = 400;
    } else if (error.message.includes("file size must be less")) {
      errorMessage = "Signature file size must be less than 5MB";
      statusCode = 400;
    } else if (error.message.includes("No signature file")) {
      errorMessage = "No signature file provided";
      statusCode = 400;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
