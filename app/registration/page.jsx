import { Section, Container, Breadcrumb } from "@/Components/ui";
import CmsSlot from "@/Components/cms/CmsSlot";
import { getPublicCourseById, getPublicSessionById, listPublicCourses } from "@/lib/training/queries";
import { getFormFields, toPublicField } from "@/lib/training/registrationForm";
import { getRegistrationPanel, getTrainingSettings, getPaymentInfo } from "@/lib/training/settings";
import { registrationCta } from "@/lib/training/status";
import { trainingMetadata } from "@/lib/training/metadata";
import RegistrationForm from "@/app/registration/RegistrationForm";

/**
 * Registration.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Register For Training", null, {
    title: "Register For Training",
    description:
      "Register for an upcoming Ababeel training session. Our team will confirm your place.",
  }).then((meta) => ({ ...meta, robots: { index: false, follow: true } }));
}

export default async function RegistrationPage({ searchParams }) {
  const params = await searchParams;
  const courseId = typeof params?.course === "string" ? params.course : "";
  const sessionId = typeof params?.reference === "string" ? params.reference : "";

  const [course, sessionRaw, coursesList, fields, panel, training, payment] = await Promise.all([
    courseId ? getPublicCourseById(courseId) : Promise.resolve(null),
    sessionId ? getPublicSessionById(sessionId) : Promise.resolve(null),
    listPublicCourses({ limit: 100 }),
    getFormFields().catch(() => []),
    getRegistrationPanel(),
    getTrainingSettings(),
    getPaymentInfo(),
  ]);

  const session =
    sessionRaw && course && String(sessionRaw.course?._id || sessionRaw.course) === String(course._id)
      ? sessionRaw
      : sessionRaw || null;

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
          courses: coursesList?.items || [],
          cta: session ? registrationCta(session) : null,
          panel,
          payment,
          copy,
        }}
      />
    </>
  );
}
