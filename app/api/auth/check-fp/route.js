import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.FP_SECRET;

export async function GET(req) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ valid: false });

    jwt.verify(token, SECRET);
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
