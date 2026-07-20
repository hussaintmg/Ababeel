import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import User from "@/models/User";
import nodemailer from "nodemailer";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Token missing" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const authToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    user.authToken = authToken;
    user.authTokenExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email/${authToken}`;
    console.log(user.email);

    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #0f8f44;">Hello ${user.username},</h2>
        <p>Thank you for registering! Please verify your email by clicking the button below:</p>
        <a href="${verificationUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            margin: 20px 0;
            background-color: #0f8f44;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          ">Verify Email</a>
          <p style="font-size: 0.9rem; color: #555;">
          This link will expire in 1 hour. If you did not request this, please ignore this email.
          </p>
          </div>
          `,
    });

    return NextResponse.json({
      success: true,
      message: "Verification link sent to email",
    });
  } catch (err) {
    console.error("send-auth-link error:", err);

    try {
      const token = req.cookies.get("token")?.value;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });
        if (user) {
          user.authToken = undefined;
          user.authTokenExpires = undefined;
          await user.save();
        }
      }
    } catch {}
    console.log(err);
    return NextResponse.json(
      { message: "Server error sending link" },
      { status: 500 },
    );
  }
}
