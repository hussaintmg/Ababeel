import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId } from "@/lib/validation";

export async function POST(request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      const { user: adminUser, error: adminError } = await requireAdmin(request);
      if (adminError) return adminError;
    }

    const rl = await checkRateLimit(request, "destructiveAdmin");
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const { depositId, paymentIntentId, amount } = await request.json();

    if (!depositId || !isValidObjectId(depositId)) {
      return NextResponse.json({ success: false, message: "Invalid deposit ID" }, { status: 400 });
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid amount" }, { status: 400 });
    }

    // 1. Find the deposit
    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return NextResponse.json(
        { success: false, message: "Deposit not found" },
        { status: 404 },
      );
    }

    // 2. Update deposit status
    deposit.status = "completed";
    deposit.paymentMethod = "card";
    deposit.receiptUrl = "https://receipt.stripe.com/test_receipt";
    deposit.updatedAt = new Date();

    await deposit.save();

    // 3. Update user balance DIRECTLY (no separate API call needed)
    const user = await User.findById(deposit.userId);
    if (user) {
      const oldBalance = user.accountBalance || 0;
      user.accountBalance = oldBalance + parseFloat(amount);
      await user.save();

    } else {
      console.error("❌ User not found for deposit:", deposit.userId);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Webhook simulated successfully",
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        status: deposit.status,
      },
      user: {
        id: user._id,
        newBalance: user.accountBalance,
      },
    });
  } catch (error) {
    console.error("Simulate webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Webhook simulation failed",
      },
      { status: 500 },
    );
  }
}
