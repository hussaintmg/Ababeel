import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { uploadFile, deleteFile, extractPublicId } from "@/utils/upload";

export async function POST(request) {
  try {
    await connectDB();

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

    const contentType = request.headers.get("content-type") || "";
    let signatureData = null;

    // Direct frontend Supabase upload (preferred - ZERO server buffer)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { url, publicId } = body || {};

      if (!url) {
        return NextResponse.json(
          { success: false, error: "No signature URL provided" },
          { status: 400 }
        );
      }

      signatureData = {
        url,
        publicId: publicId || extractPublicId(url) || "",
        uploadedAt: new Date(),
      };
    } else {
      // Legacy multipart/form-data fallback
      const formData = await request.formData();
      const file = formData.get("signature");

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No signature file provided" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadFile(buffer, `signatures`);

      signatureData = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
      };
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Delete old signature from Supabase Storage if different
    if (user.signature && user.signature.publicId && user.signature.publicId !== signatureData.publicId) {
      try {
        await deleteFile(user.signature.publicId);
      } catch (deleteError) {
        console.error("Error deleting old signature:", deleteError);
      }
    }

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
      return NextResponse.json(
        { success: false, error: "Failed to update user signature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Signature updated successfully",
      signature: signatureData,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Signature update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update signature" },
      { status: 500 }
    );
  }
}
