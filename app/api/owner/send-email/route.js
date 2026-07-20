import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import nodemailer from "nodemailer";
import { webData } from "@/constants";
import { requireOwner } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId, checkNoSQLInjection, sanitizeString } from "@/lib/validation";

export async function POST(request) {
  try {
    const { user: authUser, error } = await requireOwner(request);
    if (error) return error;

    const rateLimitResult = await checkRateLimit(request, "emailSending");
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }

    const { userId } = await request.json();

    if (!userId || !isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, error: "Valid User ID is required" },
        { status: 400 },
      );
    }

    const injectionCheck = checkNoSQLInjection({ userId });
    if (!injectionCheck.safe) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 },
      );
    }

    const sanitizedUserId = sanitizeString(userId);

    await connectDB();
    const targetUser = await User.findById(sanitizedUserId);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const user = targetUser;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = "";
    let html = "";

    subject = `Your ${webData.brand.name} Account`;
    html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome to ${webData.brand.name}</h2>
          <p>Hello ${user.username || user.firstName},</p>
          <p>Your account has been created. Here are your login credentials:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Username/Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${user.password ? "Provided during registration" : "Contact administrator"}</p>
          </div>
          <p>Please login at: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/login">${process.env.NEXT_PUBLIC_BASE_URL}/login</a></p>
          <p>If you forgot your password, please reset it at: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/forgot-password">${process.env.NEXT_PUBLIC_BASE_URL}/forgot-password</a></p>
          <p>Best regards,<br>The ${webData.email.teamName}</p>
        </div>
      `;

    const mailOptions = {
      from: `"${webData.email.fromName}" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error in email route:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
