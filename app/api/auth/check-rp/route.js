import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectDB from "@/utils/db";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.nextUrl.searchParams.get("token");

    if (!token)
      return NextResponse.json({ message: "Token missing" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.RESET_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 201 }
      );
    }

    const user = await User.findOne({ _id: decoded.userId });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (
      !user.resetToken ||
      user.resetToken !== token ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < Date.now()
    ) {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("verify-rp-token error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
