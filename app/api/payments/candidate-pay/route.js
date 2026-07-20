import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import User from "@/models/User";
import Candidate from "@/models/Candidate";
import Notification from "@/models/Notification";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId } from "@/lib/validation";

export async function POST(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "paymentInitiation", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const { courseId, paymentMethod, invoiceId: providedInvoiceId, candidateIds } =
      await request.json();

    const userId = authUser._id.toString();

    if (!courseId || !isValidObjectId(courseId)) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid courseId" },
        { status: 400 },
      );
    }

    if (!candidateIds || !Array.isArray(candidateIds) || !candidateIds.length) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid candidateIds" },
        { status: 400 },
      );
    }

    for (const cid of candidateIds) {
      if (!isValidObjectId(cid)) {
        return NextResponse.json(
          { success: false, message: "Invalid candidate ID format" },
          { status: 400 },
        );
      }
    }

    if (!paymentMethod || !["account_balance", "stripe"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 },
      );
    }

    const course = await CourseReference.findById(courseId).populate('candidates');

    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 },
      );
    }

    if (course.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: User does not own this course" },
        { status: 403 },
      );
    }

    const invoiceId = providedInvoiceId || course.invoiceId;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "Invoice not found for this course" },
        { status: 404 },
      );
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const pricePerCandidate = course.coursePrice || 0;
    const amount = candidateIds.length * pricePerCandidate;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "No candidates to pay for" },
        { status: 400 },
      );
    }

    if (paymentMethod === "account_balance" && user.accountBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient account balance",
          currentBalance: user.accountBalance,
          requiredAmount: amount,
        },
        { status: 400 },
      );
    }

    if (paymentMethod === "account_balance") {
      user.accountBalance -= amount;

      user.transactions.push({
        date: new Date(),
        type: "payment",
        amount: -amount,
        description: `Payment for ${candidateIds.length} candidate(s) in course: ${course.courseName}`,
        referenceId: course.referenceNumber,
        invoiceId: invoice._id,
      });
    } else if (paymentMethod === "stripe") {
      user.transactions.push({
        date: new Date(),
        type: "payment",
        amount: -amount,
        description: `Direct card payment for ${candidateIds.length} candidate(s) in course: ${course.courseName}`,
        referenceId: course.referenceNumber,
        invoiceId: invoice._id,
        status: "completed",
      });
    }

    await user.save();

    invoice.amountPaid += amount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    invoice.paymentMethod = paymentMethod;

    invoice.transactions.push({
      date: new Date(),
      amount: amount,
      paymentMethod: paymentMethod,
      transactionId: `PAY-${Date.now()}`,
      notes: `Payment for ${candidateIds.length} candidate(s) via ${paymentMethod} for course: ${course.courseName}`,
    });

    if (invoice.balanceDue <= 0) {
      invoice.paymentStatus = "paid";
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = "partially_paid";
    }

    await invoice.save();

    const updatedCandidates = [];

    for (const candidateId of candidateIds) {
      const candidate = await Candidate.findById(candidateId);

      if (!candidate || candidate.courseId.toString() !== courseId.toString()) {
        continue;
      }

      if (candidate.paymentStatus === "paid") {
        continue;
      }

      candidate.paymentStatus = "paid";
      candidate.updatedAt = new Date();
      await candidate.save();
      updatedCandidates.push(candidate);
    }

    const markedPaidCount = updatedCandidates.length;

    const allCandidatesAfterUpdate = await Candidate.find({ courseId: course._id });
    const allPaid = allCandidatesAfterUpdate.every(c => c.paymentStatus === "paid");

    course.status = allPaid ? "active" : course.status;
    course.candidatesCount = allCandidatesAfterUpdate.length;
    course.updatedAt = new Date();

    await course.save();

    const notification = new Notification({
      userId: userId,
      message: `Payment of ${amount} processed successfully via ${paymentMethod} for ${markedPaidCount} candidate(s) in course "${course.courseName}".`,
    });

    await notification.save();

    const updatedUnpaidCandidates = await Candidate.find({
      courseId: course._id,
      paymentStatus: "unpaid"
    });

    const updatedPaidCandidates = await Candidate.find({
      courseId: course._id,
      paymentStatus: "paid"
    });

    return NextResponse.json({
      success: true,
      message: `Payment processed successfully for ${markedPaidCount} candidate(s)`,
      data: {
        paymentId: `PAY-${Date.now()}`,
        courseId: course._id,
        courseName: course.courseName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceID: invoice._id,
        amountPaid: amount,
        remainingBalance: user.accountBalance,
        paymentStatus: invoice.paymentStatus,
        candidatesUpdated: {
          total: allCandidatesAfterUpdate.length,
          paid: updatedPaidCandidates.length,
          unpaid: updatedUnpaidCandidates.length,
          newlyMarkedPaid: markedPaidCount,
          paidCandidateIds: candidateIds
        }
      },
    });

  } catch (error) {
    console.error("Payment processing error:", error);

    return NextResponse.json(
      { success: false, message: "Payment processing failed" },
      { status: 500 },
    );
  }
}