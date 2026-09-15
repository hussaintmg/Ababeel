// app/api/auth/verify-user/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectDB from "@/utils/db";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({
        user: null,
        loggedIn: false,
      });
    }

    await connectDB();

    const JWT_SECRET = process.env.JWT_SECRET;

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({
        user: null,
        loggedIn: false,
      });
    }
    const user = await User.findById(decoded.id).select("-password");

    return NextResponse.json({
      user,
      loggedIn: !!user,
    });
  } catch (error) {
    return NextResponse.json({
      user: null,
      loggedIn: false,
    });
  }
}
