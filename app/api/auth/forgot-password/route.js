import connectDB from "@/utils/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "@/models/User";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitize, schemas } from "@/lib/validation";

const FP_SECRET = process.env.FP_SECRET;

export async function POST(req) {
  try {
    const rateResult = await checkRateLimit(req, "forgotPassword");
    if (!rateResult.allowed) {
      return rateLimitResponse(rateResult.retryAfter);
    }

    await connectDB();

    const body = await req.json();

    const validation = validateAndSanitize(schemas.forgotPassword, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    // stateAsU is accepted for backwards compatibility but not used: the
    // lookup below matches the value against both email and username.
    const { username } = validation.data;

    const user = await User.findOne({
      $or: [{ email: username }, { username: username }],
    });
    if (!user)
      return NextResponse.json(
        { message: "If an account exists, a reset code has been sent." },
        { status: 200 },
      );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, FP_SECRET, {
      expiresIn: "10m",
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${code}\n\nThis code will expire in 10 minutes.`,
      });
    } catch (err) {
      console.error("Failed to send reset email");
      user.resetCode = undefined;
      user.resetCodeExpires = undefined;
      await user.save();
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "If an account exists, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
