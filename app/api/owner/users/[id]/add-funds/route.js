import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { requireOwner } from "@/lib/auth";
import { validateAndSanitize, schemas } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { safeErrorResponse, successResponse, notFoundResponse, badRequestResponse } from "@/lib/errors";
import { getClientIp } from "@/lib/audit";

export async function POST(request, { params }) {
  try {
    const { user: owner, error: authError } = await requireOwner(request);
    if (authError) return authError;

    const { id } = await params;

    const idValidation = validateAndSanitize(schemas.mongoIdParam, { id });
    if (!idValidation.success) {
      return badRequestResponse("Invalid user ID format");
    }

    const rateLimitResult = await checkRateLimit(request, "destructiveAdmin", {
      userId: owner._id.toString(),
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid request body");
    }

    if (!body.amount || isNaN(body.amount) || Number(body.amount) <= 0) {
      return badRequestResponse("Invalid amount. Must be a positive number.");
    }

    await connectDB();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return notFoundResponse("User not found");
    }

    const numericAmount = Number(body.amount);

    targetUser.accountBalance = (targetUser.accountBalance || 0) + numericAmount;
    targetUser.transactions.push({
      date: new Date(),
      type: "deposit",
      amount: numericAmount,
      description:
        body.description?.trim() ||
        `Funds added by owner — £${numericAmount.toFixed(2)}`,
      referenceId: `OWN-${Date.now()}`,
    });

    await targetUser.save();

    return successResponse({
      message: `£${numericAmount.toFixed(2)} successfully added to account`,
      newBalance: targetUser.accountBalance,
    });
  } catch (error) {
    console.error("Add funds error:", error);
    return safeErrorResponse(error, 500);
  }
}
