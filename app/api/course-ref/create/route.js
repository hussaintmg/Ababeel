import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import CourseReference from "@/models/CourseReference";
import Invoice from "@/models/Invoice";
import { getAuthenticatedUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isValidObjectId } from "@/lib/validation";

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
      course: data.course || (isValidObjectId(data.courseId) ? data.courseId : null),
      name: data.courseName || data.name || "Unnamed Course",
      price: data.coursePrice || data.price || 0,
      currency: data.currency || "GBP",
      currencySymbol: data.currencySymbol || "£",
      currencyCode: data.currencyCode || "GBP",
      country: data.country || "United Kingdom",
      description: data.description || data.courseName || "Course description",
      isActive: true,
      courseId: data.courseId || `CRS-${referenceNumber}`,
      courseName: data.courseName || data.name || "",
      coursePrice: data.coursePrice || data.price || 0,
      referenceName: data.referenceName || `${data.courseName || "Course"} - Reference`,
      referenceCode: data.referenceCode || `REF-${referenceNumber}`,
      validity: data.validity || "",
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : endDate,
      examDate: data.examDate ? new Date(data.examDate) : null,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      expiryDate,
      mode: data.mode || "online",
      modeLabel: data.modeLabel || "",
      location: data.location || (data.mode === "online" ? "Online" : "London, UK"),
      duration: data.duration || "",
      seats: data.seats ? Number(data.seats) : 20,
      notes: data.notes || "",
      showInSchedule: data.showInSchedule !== undefined ? !!data.showInSchedule : true,
      referenceNumber,
      sequenceId,
      candidates: data.candidates || [],
      candidatesCount: data.candidatesCount || 0,
      status: data.status || "active",
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
        unitPrice: data.coursePrice || 0,
        amount: data.coursePrice || 0,
      },
    ];

    const invoiceData = {
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate,
      courseId: course._id,
      subtotal: data.coursePrice || 0,
      totalAmount: data.coursePrice || 0,
      balanceDue: data.coursePrice || 0,
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
