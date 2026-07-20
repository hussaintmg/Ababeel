import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import { createPaymentIntent, createCustomer } from "@/utils/stripe";

export async function POST(request) {
  try {
    await connectDB();

    const cookie = request.cookies.get("token");

    if (!cookie) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 },
      );
    }

    const token = cookie.value;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const { amount } = await request.json();

    // Validate amount
    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, message: "Amount must be at least $1" },
        { status: 400 },
      );
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customerResult = await createCustomer(user.email, user.username);
      if (customerResult.success) {
        customerId = customerResult.customerId;
        // Save customer ID to user
        user.stripeCustomerId = customerId;
        await user.save();
      }
    }

    // Create payment intent
    const paymentIntentResult = await createPaymentIntent(
      amount,
      "gbp",
      customerId,
    );

    if (!paymentIntentResult.success) {
      return NextResponse.json(
        { success: false, message: paymentIntentResult.error },
        { status: 500 },
      );
    }

    const deposit = await Deposit.create({
      userId: user._id,
      amount,
      stripePaymentId: paymentIntentResult.paymentIntentId,
      stripeCustomerId: customerId,
      status: "pending",
      currency: "gbp",
    });
    if (!deposit) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to save Request",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntentResult.clientSecret,
      paymentIntentId: paymentIntentResult.paymentIntentId,
      depositID: deposit._id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
