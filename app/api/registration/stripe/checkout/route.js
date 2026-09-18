import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/utils/db";
import Registration from "@/models/Registration";
import Course from "@/models/Course";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe payments are not configured on this server. Please select bank transfer.",
          configured: false,
        },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { registrationId } = body || {};

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration record not found" },
        { status: 404 }
      );
    }

    const course = await Course.findById(registration.course);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course record not found" },
        { status: 404 }
      );
    }

    const price = Number(course.price);
    if (!price || price <= 0) {
      return NextResponse.json(
        { success: false, error: "This course does not require online card payment" },
        { status: 400 }
      );
    }

    const currency = (course.currency || course.currencyCode || "GBP").toLowerCase();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Compute base URL for callbacks
    const reqOrigin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    let baseUrl = reqOrigin;
    if (!baseUrl && referer) {
      try {
        const u = new URL(referer);
        baseUrl = `${u.protocol}//${u.host}`;
      } catch {}
    }
    if (!baseUrl) {
      baseUrl = process.env.NEXTAUTH_URL || "https://www.ababeelsafety.com";
    }
    baseUrl = baseUrl.replace(/\/$/, "");

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      client_reference_id: registration._id.toString(),
      customer_email: registration.email || undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: course.name,
              description: `Enrollment registration for ${course.name}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        registrationId: registration._id.toString(),
        courseId: course._id.toString(),
        type: "course_registration",
      },
      success_url: `${baseUrl}/registration/success?session_id={CHECKOUT_SESSION_ID}&registrationId=${registration._id.toString()}`,
      cancel_url: `${baseUrl}/registration?course=${encodeURIComponent(course.slug || course._id.toString())}&cancelled=1`,
    });

    registration.stripeSessionId = checkoutSession.id;
    registration.paymentMethod = "stripe";
    registration.paymentAmount = price;
    registration.paymentCurrency = currency.toUpperCase();
    await registration.save();

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (err) {
    console.error("Stripe checkout creation error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to initialize Stripe checkout session",
      },
      { status: 500 }
    );
  }
}
