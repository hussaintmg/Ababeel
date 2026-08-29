import connectDB from "@/utils/db";
import Registration from "@/models/Registration";
import TrainingCourse from "@/models/TrainingCourse";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import { getFormFields, toPublicField, validateSubmission, promoteContact } from "@/lib/training/registrationForm";
import { uniqueReference } from "@/lib/training/reference";
import { isCoursePublic, registrationCta } from "@/lib/training/status";
import { getRegistrationPanel, getTrainingSettings } from "@/lib/training/settings";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { csrfProtection } from "@/lib/csrf";
import { successResponse, badRequestResponse, safeErrorResponse } from "@/lib/errors";
import { NextResponse } from "next/server";

/**
 * Public registration.
 *
 * GET returns what the form needs to render: the CMS field definitions, the
 * help panel copy, and the selected course/session summary.
 *
 * POST records a registration. It takes no payment: there is no amount, no
 * provider and no payment status anywhere in this handler, by design — see
 * `lib/payments/provider.js`.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get("course") || "";
    const sessionId = url.searchParams.get("reference") || "";

    const [fields, panel, training] = await Promise.all([
      getFormFields().catch(() => []),
      getRegistrationPanel(),
      getTrainingSettings(),
    ]);

    const context = await resolveContext(courseId, sessionId);

    return successResponse({
      data: {
        fields: fields.map(toPublicField),
        panel,
        copy: training.registration,
        // The public contract is explicit rather than implied: the form knows
        // there is no payment step, so it never renders one.
        payment: { enabled: false },
        ...context,
      },
    });
  } catch (error) {
    console.error("registration form load error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function POST(request) {
  try {
    const csrf = csrfProtection(request);
    if (csrf.blocked) return csrf.response;

    const rl = await checkRateLimit(request, "registrationSubmit");
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const courseId = String(body?.course || "");
    const sessionId = String(body?.reference || "");

    await connectDB();

    // Both ids are re-checked here rather than trusted from the query string:
    // a registration against a draft course, or a session whose registration
    // has closed, must be refused however the request was constructed.
    const course = await TrainingCourse.findById(courseId).lean().catch(() => null);
    if (!course || !isCoursePublic(course)) {
      return badRequestResponse("That course is not available for registration");
    }

    let session = null;
    if (sessionId) {
      session = await CourseReferenceSession.findById(sessionId).lean().catch(() => null);
      if (!session || String(session.course) !== String(course._id)) {
        return badRequestResponse("That course reference does not belong to this course");
      }
      const cta = registrationCta(session);
      if (!cta.available) {
        return badRequestResponse(
          cta.label === "Session Cancelled"
            ? "That session has been cancelled"
            : "Registration for that session is closed",
        );
      }
    }

    const fields = await getFormFields();
    const { ok, errors, values, bound } = validateSubmission(fields, body?.values || {});
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Please correct the highlighted fields", fieldErrors: errors },
        { status: 400 },
      );
    }

    const contact = promoteContact(bound);
    const reference = await uniqueReference(Registration);

    const registration = await Registration.create({
      reference,
      course: course._id,
      session: session?._id || null,
      courseNameSnapshot: course.name || "",
      sessionNameSnapshot: session?.referenceName || session?.referenceCode || "",
      ...contact,
      fields: values,
      status: "pending",
      sourcePage: String(body?.sourcePage || "").slice(0, 300),
    });

    // Best effort: the count is a convenience for the owner's list, and a
    // failure to bump it must not lose the registration that was just saved.
    if (session?._id) {
      CourseReferenceSession.updateOne(
        { _id: session._id },
        { $inc: { registrationsCount: 1 } },
      ).catch(() => {});
    }

    return successResponse(
      {
        data: {
          reference: registration.reference,
          courseName: course.name,
          sessionName: registration.sessionNameSnapshot,
        },
      },
      201,
    );
  } catch (error) {
    if (error?.name === "ValidationError") {
      return badRequestResponse("Please check the details you entered");
    }
    console.error("registration submit error:", error);
    return safeErrorResponse(error, 500);
  }
}

/** The course/session summary shown above the form, or nulls when unresolved. */
async function resolveContext(courseId, sessionId) {
  const { getPublicCourseById, getPublicSessionById } = await import("@/lib/training/queries");
  const course = courseId ? await getPublicCourseById(courseId) : null;
  const session = sessionId ? await getPublicSessionById(sessionId) : null;

  // A session that belongs to a different course is a stale or hand-edited
  // link; drop it rather than showing a summary that contradicts itself.
  if (session && course && String(session.course?._id || session.course) !== String(course._id)) {
    return { course, session: null, cta: null };
  }
  return {
    course,
    session,
    cta: session ? registrationCta(session) : null,
  };
}
