import { NextResponse } from "next/server";

export async function POST(req) {
  return NextResponse.json(
    { success: false, error: "This endpoint has been removed." },
    { status: 410 }
  );
}
