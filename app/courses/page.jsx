import { Section, Container, Breadcrumb } from "@/Components/ui";
import { listPublicCourses, getCourseFilterOptions } from "@/lib/training/queries";
import { getTrainingSettings } from "@/lib/training/settings";
import { trainingMetadata } from "@/lib/training/metadata";
import CoursesBrowser from "@/app/courses/CoursesBrowser";

/**
 * The public course catalogue.
 *
 * Server-rendered: the first page of results is in the HTML, so the catalogue
 * is indexable and a visitor on a slow connection sees courses rather than a
 * spinner. `CoursesBrowser` takes over only once someone filters.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Courses", null, {
    title: "Training Courses",
    description:
      "Accredited health, safety and environmental training courses, with upcoming session dates and online enrolment.",
  });
}

export default async function CoursesPage() {
  // One round trip each, in parallel — the filter options and the first page
  // do not depend on each other.
  const [training, initial, filters] = await Promise.all([
    getTrainingSettings(),
    listPublicCourses({ limit: 12 }),
    getCourseFilterOptions(),
  ]);

  const perPage = Number(training?.coursesPerPage) || 12;

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[{ label: "Home", href: "/" }, { label: "Courses" }]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">Training catalogue</p>
          <h1 className="t-h1 max-w-3xl text-white">
            Accredited safety training, built around competence
          </h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            Browse our full catalogue by level, awarding body or duration, and register for an
            upcoming session.
          </p>
        </Container>
      </Section>

      <CoursesBrowser
        initial={initial}
        filters={filters}
        cardTemplate={training?.courseCardTemplate || "standard"}
        perPage={perPage}
      />
    </>
  );
}
