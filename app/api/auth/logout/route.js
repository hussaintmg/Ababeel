import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function GET(req) {
  try {
    const response = NextResponse.json(
      {
        message: "User Logout successfully",
      },
      { status: 200 },
    );

    clearAuthCookie(response);

    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
