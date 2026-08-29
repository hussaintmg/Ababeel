import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Award, Layers, FileBadge, ArrowRight } from "lucide-react";
import {
  Section,
  Container,
  Breadcrumb,
  Badge,
  LevelBadge,
  Card,
  ImageWell,
  LinkButton,
  Button,
  Accordion,
  CourseCard,
  SessionCard,
  EmptyState,
  Reveal,
  RevealStagger,
} from "@/Components/ui";
import {
  getPublicCourseBySlug,
  getCourseSessions,
  getRelatedCourses,
} from "@/lib/training/queries";
import { getTrainingSettings } from "@/lib/training/settings";
import { resolveCertificate } from "@/lib/training/certificate";
import { trainingMetadata } from "@/lib/training/metadata";
import { stripHtml, truncate } from "@/lib/training/format";

/**
 * One course.
 *
 * Every section below is omitted entirely when its field is empty. A course
 * filled in over several sittings is the normal case, and a page of empty
 * headings looks worse than a short page.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  if (!course) return trainingMetadata("Course not found");

  return trainingMetadata(course.name, course, {
    title: course.name,
    description: course.shortDescription || truncate(stripHtml(course.description), 200),
    image: course.featuredImage,
  });
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);
  // A draft, archived or missing course is a 404 rather than an error page:
  // as far as the public site is concerned it does not exist.
  if (!course) notFound();

  const [sessions, related, training] = await Promise.all([
    getCourseSessions(course._id, { limit: 8 }),
    getRelatedCourses(course, 3),
    getTrainingSettings(),
  ]);

  const certificate = resolveCertificate(course, training);
  const body = course.awardingBody;
  const level = course.level;
  const firstOpen = sessions.find((s) => s.status === "open");

  return (
    <>
      <CourseHero course={course} level={level} body={body} firstOpen={firstOpen} />

      <Section tone="light" size="md">
        <Container>
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-14">
            <div className="min-w-0 space-y-14">
              {course.description ? (
                <Prose title="Overview" html={course.description} />
              ) : null}
              {course.learningOutcomes ? (
                <Prose title="What you will learn" html={course.learningOutcomes} />
              ) : null}
              {course.courseContent ? (
                <Prose title="Course content" html={course.courseContent} />
              ) : null}
              {course.whoShouldAttend ? (
                <Prose title="Who should attend" html={course.whoShouldAttend} />
              ) : null}
              {course.requirements ? (
                <Prose title="Entry requirements" html={course.requirements} />
              ) : null}

              {certificate ? (
                <Reveal>
                  <h2 className="t-h2 text-ink-900">Certification</h2>
                  {course.certificationInfo ? (
                    <p className="t-body mt-3 text-ink-600">{course.certificationInfo}</p>
                  ) : certificate.note ? (
                    <p className="t-body mt-3 text-ink-600">{certificate.note}</p>
                  ) : null}
                  <div className="mt-6 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={certificate.src}
                      alt={
                        certificate.isDefault
                          ? "Example of the certificate awarded on completion"
                          : `Certificate awarded for ${course.name}`
                      }
                      loading="lazy"
                      className="mx-auto max-h-96 w-auto object-contain"
                    />
                  </div>
                  {certificate.isDefault ? (
                    <p className="t-caption mt-2 text-ink-500">
                      Example certificate. The exact design may vary by awarding body.
                    </p>
                  ) : null}
                </Reveal>
              ) : null}

              {course.gallery?.length ? (
                <Reveal>
                  <h2 className="t-h2 text-ink-900">Gallery</h2>
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {course.gallery
                      .filter((g) => g.url)
                      .map((image, i) => (
                        <figure key={`${image.url}-${i}`}>
                          <ImageWell
                            src={image.url}
                            alt={image.alt || ""}
                            ratio="4/3"
                            zoom={false}
                            className="rounded-lg"
                          />
                          {image.caption ? (
                            <figcaption className="t-caption mt-1.5 text-ink-500">
                              {image.caption}
                            </figcaption>
                          ) : null}
                        </figure>
                      ))}
                  </div>
                </Reveal>
              ) : null}

              {course.faqs?.length ? (
                <Reveal>
                  <h2 className="t-h2 mb-6 text-ink-900">Frequently asked questions</h2>
                  <Accordion
                    items={course.faqs.filter((f) => f.question)}
                  />
                </Reveal>
              ) : null}
            </div>

            <CourseAside course={course} body={body} level={level} firstOpen={firstOpen} />
          </div>
        </Container>
      </Section>

      <Section tone="muted" size="md" id="sessions">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow mb-2 text-brand-700">Dates</p>
              <h2 className="t-h2 text-ink-900">Upcoming sessions</h2>
            </div>
            <Link
              href="/schedule"
              className="aba-focus inline-flex items-center gap-1.5 t-small font-semibold text-brand-700"
            >
              See the full schedule
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {sessions.length ? (
            <RevealStagger className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  course={course}
                  showCourseName={false}
                />
              ))}
            </RevealStagger>
          ) : (
            <EmptyState
              title="No dates scheduled yet"
              message="We are not currently running this course on a published date. Contact our team and we will let you know as soon as a session opens."
              action={<LinkButton href="/contact-us">Contact the team</LinkButton>}
            />
          )}
        </Container>
      </Section>

      {related.length ? (
        <Section tone="light" size="md">
          <Container>
            <h2 className="t-h2 mb-8 text-ink-900">Related courses</h2>
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <CourseCard key={item._id} course={item} template="standard" />
              ))}
            </RevealStagger>
          </Container>
        </Section>
      ) : null}

      <Section tone="dark" size="md">
        <Container>
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="t-h2 text-white">Ready to enrol on {course.name}?</h2>
              <p className="t-body-lg mt-3 text-ink-200">
                Register your interest and our training team will confirm your place and answer
                any questions about the course.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {firstOpen ? (
                <LinkButton
                  href={`/registration?course=${course._id}&reference=${firstOpen._id}`}
                  size="lg"
                >
                  Register now
                </LinkButton>
              ) : null}
              <LinkButton href="/contact-us" variant="outlineLight" size="lg">
                Talk to us
              </LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function CourseHero({ course, level, body, firstOpen }) {
  return (
    <Section tone="dark" size="sm" className="pt-10">
      <Container>
        <Breadcrumb
          dark
          items={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: course.name },
          ]}
          className="mb-7"
        />

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {level ? <LevelBadge level={level} /> : null}
              {course.code ? <Badge tone="light">{course.code}</Badge> : null}
              {course.category ? <Badge tone="light">{course.category}</Badge> : null}
            </div>

            <h1 className="t-h1 text-white">{course.name}</h1>

            {course.shortDescription ? (
              <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{course.shortDescription}</p>
            ) : null}

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {course.duration ? (
                <HeroFact icon={Clock} label="Duration" value={course.duration} />
              ) : null}
              {level?.name ? <HeroFact icon={Layers} label="Level" value={level.name} /> : null}
              {body?.name ? (
                <HeroFact
                  icon={Award}
                  label="Awarding body"
                  value={
                    body.slug ? (
                      <Link href={`/awarding-bodies/${body.slug}`} className="hover:text-brand-400">
                        {body.name}
                      </Link>
                    ) : (
                      body.name
                    )
                  }
                />
              ) : null}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {firstOpen ? (
                <LinkButton
                  href={`/registration?course=${course._id}&reference=${firstOpen._id}`}
                  size="lg"
                >
                  Register now
                </LinkButton>
              ) : (
                <LinkButton href="#sessions" variant="primary" size="lg">
                  See available dates
                </LinkButton>
              )}
              <LinkButton href="/contact-us" variant="outlineLight" size="lg">
                Ask a question
              </LinkButton>
            </div>
          </div>

          <Reveal animation="fade-left">
            <ImageWell
              src={course.featuredImage}
              alt=""
              fallbackText={course.name}
              ratio="4/3"
              zoom={false}
              priority
              className="rounded-xl"
            />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function HeroFact({ icon: Icon, label, value }) {
  return (
    <div>
      <dt className="t-label mb-1 flex items-center gap-1.5 text-ink-500">
        <Icon size={13} aria-hidden="true" />
        {label}
      </dt>
      <dd className="t-h4 text-white">{value}</dd>
    </div>
  );
}

/**
 * Long-form CMS content.
 *
 * `cms-prose` is the same class the page builder's rich-text block uses, so a
 * course description and a CMS page paragraph are typeset identically.
 */
function Prose({ title, html }) {
  return (
    <Reveal>
      <h2 className="t-h2 text-ink-900">{title}</h2>
      <div
        className="cms-prose t-body mt-4 text-ink-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Reveal>
  );
}

/** The sticky summary column: the facts a visitor checks before enrolling. */
function CourseAside({ course, body, level, firstOpen }) {
  return (
    <aside className="mt-14 lg:mt-0">
      <div className="lg:sticky lg:top-24">
        <Card className="p-6">
          <h2 className="t-h4 text-ink-900">Course summary</h2>
          <dl className="mt-4 divide-y divide-ink-100">
            <AsideRow label="Course code" value={course.code} />
            <AsideRow label="Duration" value={course.duration} />
            <AsideRow label="Level" value={level?.name} />
            <AsideRow label="Awarding body" value={body?.name} />
            <AsideRow label="Category" value={course.category} />
          </dl>

          {body?.logo ? (
            <div className="mt-5 flex items-center gap-3 rounded-lg bg-ink-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={body.logo}
                alt=""
                loading="lazy"
                className="h-10 w-auto max-w-24 object-contain"
              />
              <div className="min-w-0">
                <p className="t-caption text-ink-500">Awarded by</p>
                <p className="t-small font-semibold text-ink-900">{body.name}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-2.5">
            {firstOpen ? (
              <LinkButton
                href={`/registration?course=${course._id}&reference=${firstOpen._id}`}
                fullWidth
              >
                Register now
              </LinkButton>
            ) : (
              <LinkButton href="#sessions" fullWidth>
                See available dates
              </LinkButton>
            )}
            <LinkButton href="/contact-us" variant="outline" fullWidth>
              Request a callback
            </LinkButton>
          </div>

          {course.certificateImage ? (
            <p className="t-caption mt-4 flex items-center gap-1.5 text-ink-500">
              <FileBadge size={13} aria-hidden="true" />
              Certificate issued on successful completion
            </p>
          ) : null}
        </Card>
      </div>
    </aside>
  );
}

function AsideRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="t-small text-ink-500">{label}</dt>
      <dd className="t-small text-right font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
