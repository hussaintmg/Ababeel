import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitize, schemas } from "@/lib/validation";

export async function POST(req) {
  try {
    const rateResult = await checkRateLimit(req, "login");
    if (!rateResult.allowed) {
      return rateLimitResponse(rateResult.retryAfter);
    }

    await connectDB();

    const body = await req.json();

    const validation = validateAndSanitize(schemas.login, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const { username, password, remember } = validation.data;

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password");

    if (!existingUser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userObject = existingUser.toObject();
    delete userObject.password;

    const token = jwt.sign(
      {
        id: existingUser._id,
        role: existingUser.role,
        username: existingUser.username,
        email: existingUser.email,
      },
      JWT_SECRET,
      { expiresIn: remember ? "7d" : "1d" },
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          ...userObject,
          loggedIn: true,
          role: existingUser.role || "user",
          authenticatedEmail: existingUser.authenticatedEmail || false,
          authenticatedByOwner: existingUser.authenticatedByOwner || false,
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 7 : 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
