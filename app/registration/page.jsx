import { Section, Container, Breadcrumb } from "@/Components/ui";
import CmsSlot from "@/Components/cms/CmsSlot";
import { getPublicCourseById, getPublicSessionById } from "@/lib/training/queries";
import { getFormFields, toPublicField } from "@/lib/training/registrationForm";
import { getRegistrationPanel, getTrainingSettings } from "@/lib/training/settings";
import { registrationCta } from "@/lib/training/status";
import { trainingMetadata } from "@/lib/training/metadata";
import RegistrationForm from "@/app/registration/RegistrationForm";

/**
 * Registration.
 *
 * The course and session come from the query string —
 * /registration?course=<id>&reference=<id> — and are resolved here so the page
 * shows what the visitor is signing up for without asking them to choose it
 * again. Both are re-validated on submit; this resolution is for display.
 *
 * No payment: see lib/payments/provider.js.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Register For Training", null, {
    title: "Register For Training",
    description:
      "Register for an upcoming Ababeel training session. Our team will confirm your place.",
    // A form has nothing to offer a search index, and an indexed one collects
    // stray submissions with no course attached.
  }).then((meta) => ({ ...meta, robots: { index: false, follow: true } }));
}

export default async function RegistrationPage({ searchParams }) {
  const params = await searchParams;
  const courseId = typeof params?.course === "string" ? params.course : "";
  const sessionId = typeof params?.reference === "string" ? params.reference : "";

  const [course, sessionRaw, fields, panel, training] = await Promise.all([
    courseId ? getPublicCourseById(courseId) : Promise.resolve(null),
    sessionId ? getPublicSessionById(sessionId) : Promise.resolve(null),
    getFormFields().catch(() => []),
    getRegistrationPanel(),
    getTrainingSettings(),
  ]);

  // A session belonging to a different course means a stale or hand-edited
  // link. Dropping it is better than showing a summary that contradicts itself.
  const session =
    sessionRaw && course && String(sessionRaw.course?._id || sessionRaw.course) === String(course._id)
      ? sessionRaw
      : null;

  const copy = training?.registration || {};

  return (
    <>
      <CmsSlot pageKey="registration">
  <Section tone="dark" size="sm" className="pt-10">
          <Container>
            <Breadcrumb
              dark
              items={[
                { label: "Home", href: "/" },
                { label: "Courses", href: "/courses" },
                { label: "Register" },
              ]}
              className="mb-6"
            />
            <p className="t-eyebrow mb-3 text-brand-400">Enrolment</p>
            <h1 className="t-h1 max-w-3xl text-white">
              {copy.introTitle || "Register For Training"}
            </h1>
            <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
              {copy.introText ||
                "Complete the form below and a member of our training team will confirm your place."}
            </p>
          </Container>
        </Section>
      </CmsSlot>

      <RegistrationForm
        data={{
          fields: fields.map(toPublicField),
          course,
          session,
          cta: session ? registrationCta(session) : null,
          panel,
          copy,
        }}
      />
    </>
  );
}
