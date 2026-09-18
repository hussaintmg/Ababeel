import { NextResponse } from "next/server";
import { getPaymentInfo } from "@/lib/training/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payment = await getPaymentInfo();
    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error("Error fetching public payment info:", error);
    return NextResponse.json(
      { success: false, error: "Could not load payment info" },
      { status: 500 }
    );
  }
}
