import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectDB from "@/utils/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitize, schemas } from "@/lib/validation";

export async function POST(req) {
  try {
    const rateResult = await checkRateLimit(req, "otpVerification");
    if (!rateResult.allowed) {
      return rateLimitResponse(rateResult.retryAfter);
    }

    await connectDB();

    const body = await req.json();

    const validation = validateAndSanitize(schemas.checkCode, body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input" },
        { status: 400 }
      );
    }

    const { code, token } = validation.data;

    if (!token)
      return NextResponse.json(
        { message: "Token missing or expired" },
        { status: 401 }
      );

    const decoded = jwt.verify(token, process.env.FP_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user)
      return NextResponse.json({ message: "Invalid or expired code" }, { status: 400 });

    if (
      !user.resetCode ||
      user.resetCode !== code ||
      user.resetCodeExpires < Date.now()
    ) {
      return NextResponse.json(
        { message: "Invalid or expired code" },
        { status: 400 }
      );
    }

    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.RESET_SECRET,
      { expiresIn: "15m" }
    );

    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    const res = NextResponse.json({
      message: "Code verified successfully",
      username: user.username,
      email: user.email,
      url:`/reset-password/${resetToken}`
    });

    return res;
  } catch (err) {
    console.error("check-code error:", err);
    return NextResponse.json(
      { message: "Server error verifying code" },
      { status: 500 }
    );
  }
}