import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Contact from "@/models/Contact";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitize, schemas } from "@/lib/validation";

export async function POST(request) {
  try {
    const rateResult = await checkRateLimit(request, "contactForm");
    if (!rateResult.allowed) {
      return rateLimitResponse(rateResult.retryAfter);
    }

    await connectDB();
    const data = await request.json();

    const validation = validateAndSanitize(schemas.contactForm, data);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    const newContact = new Contact({
      full_name: validation.data.contact_fullname,
      company: validation.data.contact_company || "",
      phone: validation.data.contact_no,
      email: validation.data.contact_email,
      inquiry_type: validation.data.contact_inquiryreg,
      country: validation.data.contact_country,
      message: validation.data.contact_message,
      status: "pending",
    });
    await newContact.save();

    return NextResponse.json(
      { message: "Contact form submitted successfully." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form." },
      { status: 500 },
    );
  }
}
