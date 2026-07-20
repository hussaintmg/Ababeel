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

    const { courseId, paymentMethod, invoiceId: providedInvoiceId } =
      await request.json();

    const userId = authUser._id.toString();

    if (!courseId || !isValidObjectId(courseId)) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid courseId" },
        { status: 400 },
      );
    }

    if (!paymentMethod || !["account_balance", "stripe"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 },
      );
    }

    // 1. Fetch course from CourseReference model
    const course = await CourseReference.findById(courseId).populate('candidates');

    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 },
      );
    }

    // 2. Check if clientId equals userId
    if (course.userId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: User does not own this course",
        },
        { status: 403 },
      );
    }

    // 3. Fetch invoice using invoiceId from course or provided invoiceId
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

    if (invoice.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invoice does not belong to this user" },
        { status: 403 },
      );
    }

    // 4. Fetch user from authenticated session
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // 5. Server-side amount calculation
    const allCandidates = await Candidate.find({ courseId: course._id }).sort({ createdAt: 1 });
    const pricePerCandidate = course.coursePrice || 0;
    const unpaidCandidates = allCandidates.filter(c => c.paymentStatus === "unpaid");
    const amount = unpaidCandidates.length * pricePerCandidate;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "No unpaid candidates remaining" },
        { status: 400 },
      );
    }

    // 6. Check if user has sufficient balance (if using account balance)
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

    try {
      // 6. Handle payment based on method
      if (paymentMethod === "account_balance") {
        // Deduct amount from user's account balance
        user.accountBalance -= amount;

        // Add transaction record to user
        user.transactions.push({
          date: new Date(),
          type: "payment",
          amount: -amount, // Negative amount for deduction
          description: `Payment for course: ${course.courseName}`,
          referenceId: course.referenceNumber,
          invoiceId: invoice._id,
        });
      } else if (paymentMethod === "stripe") {
        // No balance deduction for direct Stripe payment
        // Just add a record of the transaction
        user.transactions.push({
          date: new Date(),
          type: "payment",
          amount: -amount,
          description: `Direct card payment for course: ${course.courseName}`,
          referenceId: course.referenceNumber,
          invoiceId: invoice._id,
          status: "completed",
        });
      }

      await user.save();

      // 7. Update invoice with payment
      invoice.amountPaid += amount;
      invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
      invoice.paymentMethod = paymentMethod || "account_balance";

      // Add transaction to invoice
      invoice.transactions.push({
        date: new Date(),
        amount: amount,
        paymentMethod: paymentMethod || "account_balance",
        transactionId: `PAY-${Date.now()}`,
        notes: `Payment via ${paymentMethod || "account_balance"} for course: ${
          course.courseName
        }`,
      });

      // Update payment status
      if (invoice.balanceDue <= 0) {
        invoice.paymentStatus = "paid";
      } else if (invoice.amountPaid > 0) {
        invoice.paymentStatus = "partially_paid";
      }

      await invoice.save();

      // 8. Get all candidates for this course
      const pricePerCandidateInner = course.coursePrice || 0;
      
      // Find unpaid candidates
      const unpaidCandidatesInner = allCandidates.filter(c => c.paymentStatus === "unpaid");
      
      // Calculate how many candidates can be marked as paid with this payment
      const numberOfCandidatesToMarkPaid = Math.floor(amount / pricePerCandidateInner);
      
      let markedPaidCount = 0;
      let updatedCandidates = [];

      // Mark candidates as paid based on payment amount
      if (numberOfCandidatesToMarkPaid > 0 && unpaidCandidatesInner.length > 0) {
        // Get the candidates to mark as paid (oldest first)
        const candidatesToMarkPaid = unpaidCandidatesInner.slice(0, numberOfCandidatesToMarkPaid);
        
        // Update their payment status
        for (const candidate of candidatesToMarkPaid) {
          candidate.paymentStatus = "paid";
          candidate.updatedAt = new Date();
          await candidate.save();
          updatedCandidates.push(candidate);
          markedPaidCount++;
        }
      }

      // Handle remaining amount as overpayment/credit if needed
      const remainingAmount = amount - (markedPaidCount * pricePerCandidateInner);
      
      if (remainingAmount > 0 && unpaidCandidatesInner.length <= markedPaidCount) {
        // Option 1: Add remaining amount as credit to user's account balance
        // user.accountBalance += remainingAmount;
        // await user.save();
        
        // Option 2: Add note about overpayment to invoice
        invoice.notes = invoice.notes || [];
        invoice.notes.push(`Overpayment of ${remainingAmount} will be used as credit for future payments.`);
      }

      // 9. Update course status
      // Check if all candidates are paid
      const allCandidatesAfterUpdate = await Candidate.find({ courseId: course._id });
      const allPaid = allCandidatesAfterUpdate.every(c => c.paymentStatus === "paid");
      
      course.status = allPaid ? "active" : course.status;
      course.candidatesCount = allCandidatesAfterUpdate.length;
      course.updatedAt = new Date();

      await course.save();

      // 10. Create notification for user
      const notification = new Notification({
        userId: userId,
        message: `Payment of ${amount} processed successfully via ${
          paymentMethod || "account_balance"
        } for course "${course.courseName}". ${markedPaidCount} candidate(s) marked as paid.`,
      });

      await notification.save();

      // Calculate updated counts
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
        message: "Payment processed successfully",
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
            total: allCandidates.length,
            paid: updatedPaidCandidates.length,
            unpaid: updatedUnpaidCandidates.length,
            newlyMarkedPaid: markedPaidCount,
            remainingAmount: remainingAmount
          }
        },
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Payment processing error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment processing failed",
      },
      { status: 500 },
    );
  }
}