import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import { deleteFile } from "@/utils/upload";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

export async function DELETE(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    await connectDB();

    const { courseId, candidateIds } = await request.json();

    if (!courseId || !isValidObjectId(courseId) || !candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Valid courseId and candidateIds array are required" },
        { status: 400 },
      );
    }

    for (const cid of candidateIds) {
      if (!isValidObjectId(cid)) {
        return NextResponse.json(
          { success: false, error: "Invalid candidate ID format" },
          { status: 400 },
        );
      }
    }

    const course = await CourseReference.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 },
      );
    }

    if (course.userId.toString() !== authUser._id.toString() && !["admin", "owner"].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Access denied: not the course owner" },
        { status: 403 },
      );
    }

    const candidatesToDelete = await Candidate.find({
      _id: { $in: candidateIds },
      courseId: courseId,
    });

    if (candidatesToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No candidates found to delete" },
        { status: 404 },
      );
    }

    const pricePerCandidate = course.coursePrice || 0;
    const paidCandidatesDeleted = [];
    const unpaidCandidatesDeleted = [];
    const failedDeletions = [];

    for (const candidate of candidatesToDelete) {
      try {
        if (candidate.paymentStatus === "paid") {
          paidCandidatesDeleted.push({
            id: candidate._id,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
          });
        } else {
          unpaidCandidatesDeleted.push({
            id: candidate._id,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
          });
        }

        if (candidate.profile?.publicId) {
          try {
            await deleteFile(candidate.profile.publicId);
          } catch (deleteErr) {
            console.error(`Error deleting image for candidate ${candidate._id}:`, deleteErr);
          }
        }
      } catch (error) {
        console.error(`Error processing candidate ${candidate._id}:`, error);
        failedDeletions.push({
          id: candidate._id,
          name: `${candidate.firstName} ${candidate.lastName}`,
          error: error.message,
        });
      }
    }

    const updatedCourse = await CourseReference.findByIdAndUpdate(
      courseId,
      {
        $pull: { candidates: { $in: candidateIds } },
        $inc: { candidatesCount: -candidatesToDelete.length },
        $set: { updatedAt: new Date() }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedCourse) {
      throw new Error("Failed to update course");
    }

    let remainingCandidates = [];
    if (updatedCourse.candidates && updatedCourse.candidates.length > 0) {
      remainingCandidates = await Candidate.find({
        _id: { $in: updatedCourse.candidates },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    const remainingPaidCandidates = remainingCandidates.filter(
      (c) => c.paymentStatus === "paid",
    );
    const remainingUnpaidCandidates = remainingCandidates.filter(
      (c) => c.paymentStatus === "unpaid",
    );

    const invoice = await Invoice.findById(updatedCourse.invoiceId);

    if (invoice) {
      const newTotalCandidates = remainingCandidates.length;
      const newSubtotal = pricePerCandidate * newTotalCandidates;
      const newBalanceDue = pricePerCandidate * remainingUnpaidCandidates.length;
      const newAmountPaid = pricePerCandidate * remainingPaidCandidates.length;

      let paymentStatus = "pending";
      if (newBalanceDue <= 0) {
        paymentStatus = "paid";
      } else if (newAmountPaid > 0) {
        paymentStatus = "partially_paid";
      }

      await Invoice.findByIdAndUpdate(
        updatedCourse.invoiceId,
        {
          $set: {
            subtotal: newSubtotal,
            totalAmount: newSubtotal,
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            paymentStatus: paymentStatus,
            updatedAt: new Date()
          }
        }
      );
    }

    await Candidate.deleteMany({
      _id: { $in: candidateIds },
    });

    let message = "";
    if (paidCandidatesDeleted.length > 0 && unpaidCandidatesDeleted.length > 0) {
      message = `Deleted ${paidCandidatesDeleted.length} paid and ${unpaidCandidatesDeleted.length} unpaid candidates.`;
    } else if (paidCandidatesDeleted.length > 0) {
      message = `Deleted ${paidCandidatesDeleted.length} paid candidates.`;
    } else if (unpaidCandidatesDeleted.length > 0) {
      message = `Deleted ${unpaidCandidatesDeleted.length} unpaid candidates.`;
    }

    if (failedDeletions.length > 0) {
      message += ` ${failedDeletions.length} deletions failed.`;
    }

    return NextResponse.json({
      success: true,
      message,
      deletedCount: candidatesToDelete.length,
      paidCount: paidCandidatesDeleted.length,
      unpaidCount: unpaidCandidatesDeleted.length,
      failedDeletions: failedDeletions.length > 0 ? failedDeletions : undefined,
      remainingCandidates: {
        count: remainingCandidates.length,
        paid: remainingPaidCandidates.length,
        unpaid: remainingUnpaidCandidates.length,
      },
      financialSummary: {
        newSubtotal: invoice ? pricePerCandidate * remainingCandidates.length : 0,
        newAmountPaid: invoice ? pricePerCandidate * remainingPaidCandidates.length : 0,
        newBalanceDue: invoice ? pricePerCandidate * remainingUnpaidCandidates.length : 0,
      }
    });

  } catch (error) {
    console.error("Error in bulk delete:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete candidates" },
      { status: 500 },
    );
  }
}
