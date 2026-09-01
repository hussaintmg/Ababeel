import connectDB from "@/utils/db";
import Registration from "@/models/Registration";
import TrainingCourse from "@/models/TrainingCourse";
import DefaultCourse from "@/models/DefaultCourse";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import CourseReference from "@/models/CourseReference";
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
    const selectedMonth = String(body?.selectedMonth || "");
    const receiptUrl = String(body?.receiptUrl || "");
    const receiptName = String(body?.receiptName || "");

    await connectDB();

    // Look for course in TrainingCourse or DefaultCourse
    let course = await TrainingCourse.findById(courseId).lean().catch(() => null);
    let courseModel = "TrainingCourse";
    if (!course) {
      course = await DefaultCourse.findById(courseId).lean().catch(() => null);
      courseModel = "DefaultCourse";
    }

    if (!course || !isCoursePublic(course)) {
      return badRequestResponse("That course is not available for registration");
    }

    let session = null;
    let sessionModel = "CourseReference";
    if (sessionId) {
      session = await CourseReference.findById(sessionId).lean().catch(() => null);
      if (!session) {
        session = await CourseReferenceSession.findById(sessionId).lean().catch(() => null);
        sessionModel = "CourseReferenceSession";
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

    const sessionTitle =
      session?.referenceName ||
      session?.referenceCode ||
      session?.courseName ||
      selectedMonth ||
      "";

    const registration = await Registration.create({
      reference,
      course: course._id,
      courseModel,
      session: session?._id || null,
      sessionModel: session ? sessionModel : "CourseReference",
      courseNameSnapshot: course.name || "",
      sessionNameSnapshot: sessionTitle,
      selectedMonth: selectedMonth || sessionTitle,
      receiptUrl,
      receiptName,
      ...contact,
      fields: values,
      status: "pending",
      sourcePage: String(body?.sourcePage || "").slice(0, 300),
    });

    if (session?._id) {
      if (sessionModel === "CourseReference") {
        CourseReference.updateOne(
          { _id: session._id },
          { $inc: { registrationsCount: 1 } },
        ).catch(() => {});
      } else {
        CourseReferenceSession.updateOne(
          { _id: session._id },
          { $inc: { registrationsCount: 1 } },
        ).catch(() => {});
      }
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
