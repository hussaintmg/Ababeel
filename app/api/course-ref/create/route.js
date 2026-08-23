import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId } from "@/lib/validation";
import { resolveCurrency } from "@/constants/currencies";

export async function POST(request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "write", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const requestData = await request.json();

    const data = requestData.courseData || requestData;
    const userId = authUser._id.toString();

    const coursePrice = parseFloat(data.coursePrice);
    if (!Number.isFinite(coursePrice) || coursePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid course price is required" },
        { status: 400 },
      );
    }

    // Only the currencies in constants/currencies.js are supported; anything
    // else falls back to the default rather than being stored as-is.
    const currency = resolveCurrency(data.currencyCode || data.currency);

    const userCourseCount = await CourseReference.countDocuments({
      userId: userId,
    });

    const sequenceId = (userCourseCount + 1).toString();

    let referenceNumber;
    let isUnique = false;

    while (!isUnique) {
      referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();

      const existingCourse = await CourseReference.findOne({
        referenceNumber,
      });

      if (!existingCourse) {
        isUnique = true;
      }
    }
    const startDate = data.startDate;
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 2);
    endDate.setDate(endDate.getDate() - 1);

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + 2);

    const courseData = {
      userId: userId,
      name: data.courseName || "Unnamed Course",
      price: coursePrice,
      currency: currency.currency,
      currencySymbol: currency.symbol,
      currencyCode: currency.code,
      country: data.country || "",
      description: data.description || data.courseName || "Course description",
      isActive: true,
      courseId: data.courseId || `CRS-${referenceNumber}`,
      courseName: data.courseName,
      coursePrice,
      validity: data.validity,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate,
      expiryDate,
      // Trainer and ATC fields were removed from the creation flow; the model
      // defaults them to "" for legacy compatibility.
      referenceNumber,
      sequenceId,
      candidates: data.candidates || [],
      candidatesCount: data.candidatesCount || 0,
      status: "pending_payment",
      createdBy: userId,
    };

    const course = await CourseReference.create(courseData);

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);

    const items = [
      {
        description: data.courseName || "Course",
        quantity: 1,
        unitPrice: coursePrice,
        amount: coursePrice,
      },
    ];

    const invoiceData = {
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate,
      courseId: course._id,
      currency: currency.currency,
      currencyCode: currency.code,
      currencySymbol: currency.symbol,
      subtotal: coursePrice,
      totalAmount: coursePrice,
      balanceDue: coursePrice,
      clientId: userId,
      clientName: authUser.username || "Client",
      items,
      paymentStatus: "pending",
    };

    let invoice;
    try {
      invoice = await Invoice.create(invoiceData);
    } catch (invoiceError) {
      await CourseReference.findByIdAndDelete(course._id);
      throw new Error(`Invoice creation failed: ${invoiceError.message}`);
    }

    course.invoiceId = invoice._id;
    await course.save();

    // The ATC-details backfill was removed along with the ATC form fields.

    return NextResponse.json({
      success: true,
      message: "Course created successfully with invoice",
      data: {
        course,
        invoice,
      },
    });
  } catch (error) {
    console.error("Error creating course:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create course" },
      { status: 500 },
    );
  }
}
