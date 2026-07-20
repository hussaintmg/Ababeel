import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import { webData } from "@/constants";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validation";

// Function to generate unique certificate number
async function generateUniqueCertificateNumber() {
  let isUnique = false;
  let certificateNumber = "";
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    certificateNumber = `${webData.documents.certificatePrefix}-V-${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;
    
    const existingCandidate = await Candidate.findOne({ certificateNumber });
    
    if (!existingCandidate) {
      isUnique = true;
    }
    
    attempts++;
  }

  if (!isUnique) {
    throw new Error("Unable to generate unique certificate number after multiple attempts");
  }

  return certificateNumber;
}

// Helper function to normalize candidate data (handle both camelCase and lowercase)
function normalizeCandidateData(candidateData) {
  return {
    id: candidateData.id || candidateData.id,
    firstName: candidateData.firstName || candidateData.firstname,
    lastName: candidateData.lastName || candidateData.lastname,
    dateOfBirth: candidateData.dateOfBirth || candidateData.dateofbirth,
    country: candidateData.country,
    email: candidateData.email,
    assessmentMarks1: candidateData.assessmentMarks1 || candidateData.assessmentmarks1,
    assessmentMarks2: candidateData.assessmentMarks2 || candidateData.assessmentmarks2,
  };
}

export async function POST(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    await connectDB();

    // Parse the request body
    const body = await request.json();
    const { courseId, candidates } = body;

    // Validate required fields
    if (!courseId || !isValidObjectId(courseId) || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json(
        { success: false, error: "Valid Course ID and candidates array are required" },
        { status: 400 },
      );
    }

    // Check if course exists
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

    const userId = authUser._id.toString();

    const results = {
      success: [],
      failed: [],
      totalProcessed: candidates.length,
      successCount: 0,
      failedCount: 0
    };

    // Process each candidate
    for (const candidateData of candidates) {
      try {
        // Normalize field names (handle both camelCase and lowercase)
        const normalizedData = normalizeCandidateData(candidateData);
        
        const {
          id,
          firstName,
          lastName,
          dateOfBirth,
          country,
          email,
          assessmentMarks1,
          assessmentMarks2
        } = normalizedData;

        // Validate individual candidate data
        if (!id || !firstName || !lastName || !dateOfBirth || !country || !email) {
          const missingFields = [];
          if (!id) missingFields.push('id');
          if (!firstName) missingFields.push('firstName');
          if (!lastName) missingFields.push('lastName');
          if (!dateOfBirth) missingFields.push('dateOfBirth');
          if (!country) missingFields.push('country');
          if (!email) missingFields.push('email');
          
          results.failed.push({
            data: candidateData,
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          results.failedCount++;
          continue;
        }

        const marks1 = parseFloat(assessmentMarks1) || 0;
        const marks2 = parseFloat(assessmentMarks2) || 0;

        // Validate assessment marks
        if (marks1 > 50 || marks2 > 50) {
          results.failed.push({
            data: candidateData,
            error: "Assessment marks cannot exceed 50"
          });
          results.failedCount++;
          continue;
        }

        if (marks1 < 0 || marks2 < 0) {
          results.failed.push({
            data: candidateData,
            error: "Assessment marks cannot be negative"
          });
          results.failedCount++;
          continue;
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            data: candidateData,
            error: "Invalid email format"
          });
          results.failedCount++;
          continue;
        }

        // Validate date format
        const dateObj = new Date(dateOfBirth);
        if (isNaN(dateObj.getTime())) {
          results.failed.push({
            data: candidateData,
            error: "Invalid date format. Use YYYY-MM-DD"
          });
          results.failedCount++;
          continue;
        }

        // Check for existing candidate with same ID in this course
        const existingCandidateId = await Candidate.findOne({
          traineeId: id,
          courseId,
        });

        if (existingCandidateId) {
          results.failed.push({
            data: candidateData,
            error: "Candidate with this ID already exists in this course"
          });
          results.failedCount++;
          continue;
        }

        // Check for existing candidate with same email in this course
        const existingCandidateEmail = await Candidate.findOne({
          email: email.toLowerCase(),
          courseId,
        });

        if (existingCandidateEmail) {
          results.failed.push({
            data: candidateData,
            error: "Candidate with this email already exists in this course"
          });
          results.failedCount++;
          continue;
        }

        // Calculate total marks
        const marks = marks1 + marks2;

        // Generate unique certificate number
        const certificateNumber = await generateUniqueCertificateNumber();

        // Create candidate in database
        const candidate = await Candidate.create({
          userId,
          courseId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dateObj,
          country: country.trim(),
          email: email.toLowerCase().trim(),
          assessmentMarks1: marks1,
          assessmentMarks2: marks2,
          marks,
          traineeId: id.toString().trim(),
          certificateNumber,
          paymentStatus: "unpaid"
        });

        // Add candidate to course
        course.candidates.push(candidate._id);
        
        results.success.push({
          id: candidate._id,
          traineeId: candidate.traineeId,
          name: `${firstName} ${lastName}`,
          email: candidate.email
        });
        results.successCount++;

      } catch (error) {
        results.failed.push({
          data: candidateData,
          error: error.message || "Failed to process candidate"
        });
        results.failedCount++;
      }
    }

    // Update course candidates count
    course.candidatesCount = course.candidates.length;
    await course.save();

    // Fetch all candidates for this course
    let allCandidates = [];
    if (course.candidates && course.candidates.length > 0) {
      allCandidates = await Candidate.find({
        _id: { $in: course.candidates },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    // Calculate unpaid candidates
    const unpaidCandidates = allCandidates.filter(
      (c) => c.paymentStatus === "unpaid"
    );

    // Update invoice if it exists
    if (course.invoiceId) {
      const pricePerCandidate = course.coursePrice || 0;

      // Calculate new totals
      const newSubtotal = pricePerCandidate * allCandidates.length;
      const newBalanceDue = pricePerCandidate * unpaidCandidates.length;

      // Get current invoice to check payment status
      const existingInvoice = await Invoice.findById(course.invoiceId);

      if (existingInvoice) {
        // Update invoice fields
        existingInvoice.subtotal = newSubtotal;
        existingInvoice.totalAmount = newSubtotal;

        // Calculate amount paid based on paid candidates
        const paidCandidates = allCandidates.filter(
          (c) => c.paymentStatus === "paid"
        );
        const amountPaid = pricePerCandidate * paidCandidates.length;
        existingInvoice.amountPaid = amountPaid;

        // Update balance due
        existingInvoice.balanceDue = newBalanceDue;

        // Update payment status
        if (newBalanceDue <= 0) {
          existingInvoice.paymentStatus = "paid";
        } else if (amountPaid > 0) {
          existingInvoice.paymentStatus = "partially_paid";
        } else {
          existingInvoice.paymentStatus = "pending";
        }

        existingInvoice.updatedAt = new Date();
        await existingInvoice.save();
      }
    }

    return NextResponse.json({
      success: results.failedCount ? false : true,
      message: `Processed ${results.totalProcessed} candidates. ${results.successCount} added successfully, ${results.failedCount} failed.`,
      results,
      candidates: allCandidates,
      total: allCandidates.length,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process bulk upload",
      },
      { status: 500 },
    );
  }
}