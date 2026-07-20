import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token missing" },
        { status: 400 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 201 }
      );
    }

    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.authToken !== token || user.authTokenExpires < Date.now()) {
      return NextResponse.json(
        { success: false, message: "Token expired or invalid" },
        { status: 401 }
      );
    }

    user.authenticatedEmail = true;
    user.authToken = undefined;
    user.authTokenExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("verify-email error:", err);
    return NextResponse.json(
      { success: false, message: "Server error verifying email" },
      { status: 500 }
    );
  }
}