import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Invoice from "@/models/Invoice";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId } from "@/lib/validation";

export async function POST(req) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(req);
    if (authError) return authError;

    const rl = await checkRateLimit(req, "read", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();
    const body = await req.json();
    const { invoiceId } = body;
    if (!invoiceId || !isValidObjectId(invoiceId)) {
      return NextResponse.json(
        { success: false, error: "Valid invoice ID is required" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.clientId.toString() !== authUser._id.toString() && !["admin", "owner"].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error getting Invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get Invoice" },
      { status: 500 }
    );
  }
}
