import { NextResponse } from "next/server";

export async function GET(req) {
  return NextResponse.json(
    { success: false, error: "This endpoint has been removed." },
    { status: 410 }
  );
}
