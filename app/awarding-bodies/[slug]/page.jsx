import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  Section,
  Container,
  Breadcrumb,
  CourseCard,
  ImageWell,
  EmptyState,
  LinkButton,
  Reveal,
  RevealStagger,
} from "@/Components/ui";
import { getAwardingBodyBySlug, getCoursesForAwardingBody } from "@/lib/training/queries";
import { getTrainingSettings } from "@/lib/training/settings";
import { trainingMetadata } from "@/lib/training/metadata";
import { stripHtml, truncate } from "@/lib/training/format";

/** One awarding body, with the published courses it awards. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const body = await getAwardingBodyBySlug(slug);
  if (!body) return trainingMetadata("Awarding body not found");

  return trainingMetadata(body.name, body, {
    title: body.name,
    description: truncate(stripHtml(body.description), 200),
    image: body.coverImage || body.logo,
  });
}

export default async function AwardingBodyPage({ params }) {
  const { slug } = await params;
  const body = await getAwardingBodyBySlug(slug);
  if (!body) notFound();

  const [courses, training] = await Promise.all([
    getCoursesForAwardingBody(body._id),
    getTrainingSettings(),
  ]);

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[
              { label: "Home", href: "/" },
              { label: "Awarding Bodies", href: "/awarding-bodies" },
              { label: body.name },
            ]}
            className="mb-7"
          />

          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              {body.logo ? (
                <div className="mb-6 inline-flex items-center rounded-lg bg-white px-5 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={body.logo} alt="" className="h-12 w-auto object-contain" />
                </div>
              ) : null}

              <h1 className="t-h1 text-white">{body.name}</h1>
              {body.shortName && body.shortName !== body.name ? (
                <p className="t-body mt-2 text-ink-500">{body.shortName}</p>
              ) : null}

              {body.website ? (
                <a
                  href={body.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aba-focus mt-6 inline-flex items-center gap-1.5 t-small font-semibold text-brand-400 hover:text-brand-300"
                >
                  Visit their website
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>

            {body.coverImage ? (
              <Reveal animation="fade-left">
                <ImageWell src={body.coverImage} alt="" ratio="4/3" zoom={false} priority className="rounded-xl" />
              </Reveal>
            ) : null}
          </div>
        </Container>
      </Section>

      {(body.description || body.accreditationInfo) && (
        <Section tone="light" size="md">
          <Container size="prose">
            {body.description ? (
              <Reveal>
                <h2 className="t-h2 text-ink-900">About {body.name}</h2>
                <div
                  className="cms-prose t-body mt-4 text-ink-700"
                  dangerouslySetInnerHTML={{ __html: body.description }}
                />
              </Reveal>
            ) : null}

            {body.accreditationInfo ? (
              <Reveal className="mt-12">
                <h2 className="t-h2 text-ink-900">Accreditation</h2>
                <div
                  className="cms-prose t-body mt-4 text-ink-700"
                  dangerouslySetInnerHTML={{ __html: body.accreditationInfo }}
                />
              </Reveal>
            ) : null}
          </Container>
        </Section>
      )}

      <Section tone="muted" size="md">
        <Container>
          <h2 className="t-h2 mb-8 text-ink-900">Courses awarded by {body.name}</h2>
          {courses.length ? (
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  template={training?.courseCardTemplate || "standard"}
                />
              ))}
            </RevealStagger>
          ) : (
            <EmptyState
              title="No courses listed yet"
              message={`We are not currently publishing any ${body.name} courses. Browse the full catalogue, or contact us about what you need.`}
              action={<LinkButton href="/courses">Browse all courses</LinkButton>}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
