import { NextResponse } from "next/server";
import User from "@/models/User";
import connectDB from "@/utils/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const rateResult = await checkRateLimit(req, "resetPassword");
    if (!rateResult.allowed) {
      return rateLimitResponse(rateResult.retryAfter);
    }

    await connectDB();

    const body = await req.json();

    const validation = validateAndSanitize(schemas.resetPassword, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const { token, newPassword } = validation.data;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.RESET_SECRET);
    } catch {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 401 }
      );
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with uppercase, lowercase, and number" },
        { status: 400 },
      );
    }

    const user = await User.findOne({
      _id: decoded.userId,
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 401 }
      );

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    const res = NextResponse.json({ message: "Password reset successfully" });
    clearAuthCookie(res);

    return res;
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json(
      { message: "Server error resetting password" },
      { status: 500 }
    );
  }
}
