// Extracted from app/courses/[slug]/page.jsx; original layouts with typed CMS content.
"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Award, Layers, FileBadge, ArrowRight } from "lucide-react";
import { Section, Container, Breadcrumb, Badge, LevelBadge, Card, ImageWell, LinkButton, Button, Accordion, CourseCard, SessionCard, EmptyState, Reveal, RevealStagger } from "@/Components/ui";
import { resolveCertificate } from "@/lib/training/certificate";
import { stripHtml, truncate } from "@/lib/training/format";
import defaults from "./course-detail.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    course,
    sessions,
    related,
    training,
    certificate,
    body,
    level,
    firstOpen
  } = {
    ...{
      "course": {
        "name": "Choose a published course",
        "slug": "",
        "faqs": []
      },
      "sessions": [],
      "related": [],
      "training": {},
      "certificate": null,
      "body": null,
      "level": null,
      "firstOpen": null
    },
    ...(cmsProps._data || {})
  };
  const cms = {
    ...defaults,
    ...cmsProps
  };
  return <>
    
      {(cmsProps.section == null || cmsProps.section === 0) && <CourseHero course={course} level={level} body={body} firstOpen={firstOpen} cms={cms} />}

      {(cmsProps.section == null || cmsProps.section === 1) && <Section tone="light" size="md">
        <Container>
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-14">
            <div className="min-w-0 space-y-14">
              {course.description ? <Prose title={cms.title_Overview_1} html={course.description} cms={cms} /> : null}
              {course.learningOutcomes ? <Prose title={cms.title_What_you_will_learn_2} html={course.learningOutcomes} cms={cms} /> : null}
              {course.courseContent ? <Prose title={cms.title_Course_content_3} html={course.courseContent} cms={cms} /> : null}
              {course.whoShouldAttend ? <Prose title={cms.title_Who_should_attend_4} html={course.whoShouldAttend} cms={cms} /> : null}
              {course.requirements ? <Prose title={cms.title_Entry_requirements_5} html={course.requirements} cms={cms} /> : null}

              {certificate ? <Reveal>
                  <h2 className="t-h2 text-ink-900">{cms.Heading_Certification_6}</h2>
                  {course.certificationInfo ? <p className="t-body mt-3 text-ink-600">{course.certificationInfo}</p> : certificate.note ? <p className="t-body mt-3 text-ink-600">{certificate.note}</p> : null}
                  <div className="mt-6 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 p-4">
                    {}
                    <img src={certificate.src} alt={certificate.isDefault ? "Example of the certificate awarded on completion" : `Certificate awarded for ${course.name}`} loading="lazy" className="mx-auto max-h-96 w-auto object-contain" />
                  
                  </div>
                  {certificate.isDefault ? <p className="t-caption mt-2 text-ink-500">{cms.Description_Example_certificate__The_exact_design_may_vary_b_7}</p> : null}
                </Reveal> : null}

              {course.gallery?.length ? <Reveal>
                  <h2 className="t-h2 text-ink-900">{cms.Heading_Gallery_8}</h2>
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {course.gallery.filter(g => g.url).map((image, i) => <figure key={`${image.url}-${i}`}>
                          <ImageWell src={image.url} alt={image.alt || ""} ratio="4/3" zoom={false} className="rounded-lg" />
                    
                          {image.caption ? <figcaption className="t-caption mt-1.5 text-ink-500">
                              {image.caption}
                            </figcaption> : null}
                        </figure>)}
                  </div>
                </Reveal> : null}

              {course.faqs?.length ? <Reveal>
                  <h2 className="t-h2 mb-6 text-ink-900">{cms.Heading_Frequently_asked_questions_9}</h2>
                  <Accordion items={course.faqs.filter(f => f.question)} />
                
                </Reveal> : null}
            </div>

            <CourseAside course={course} body={body} level={level} firstOpen={firstOpen} cms={cms} />
          </div>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 2) && <Section tone="muted" size="md" id="sessions">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow mb-2 text-brand-700">{cms.Description_Dates_10}</p>
              <h2 className="t-h2 text-ink-900">{cms.Heading_Upcoming_sessions_11}</h2>
            </div>
            <Link href={cms.href__schedule_12} className="aba-focus inline-flex items-center gap-1.5 t-small font-semibold text-brand-700">{cms.Text_See_the_full_schedule_13}<ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {sessions.length ? <RevealStagger className="space-y-4">
              {sessions.map(session => <SessionCard key={session._id} session={session} course={course} showCourseName={false} />)}
            </RevealStagger> : <EmptyState title={cms.title_No_dates_scheduled_yet_14} message={cms.message_We_are_not_currently_running_this_cour_15} action={<LinkButton href={cms.href__contact_us_16}>{cms.Text_Contact_the_team_17}</LinkButton>} />}
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 3) && (related.length ? <Section tone="light" size="md">
          <Container>
            <h2 className="t-h2 mb-8 text-ink-900">{cms.Heading_Related_courses_18}</h2>
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(item => <CourseCard key={item._id} course={item} template="standard" />)}
            </RevealStagger>
          </Container>
        </Section> : null)}

      {(cmsProps.section == null || cmsProps.section === 4) && <Section tone="dark" size="md">
        <Container>
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="t-h2 text-white">{cms.Heading_Ready_to_enrol_on_19}{course.name}{cms.Heading___20}</h2>
              <p className="t-body-lg mt-3 text-ink-200">{cms.Description_Register_your_interest_and_our_training_team_wil_21}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {firstOpen ? <LinkButton href={`/registration?course=${course._id}&reference=${firstOpen._id}`} size="lg">{cms.Text_Register_now_22}</LinkButton> : null}
              <LinkButton href={cms.href__contact_us_23} variant="outlineLight" size="lg">{cms.Text_Talk_to_us_24}</LinkButton>
            </div>
          </div>
        </Container>
      </Section>}
    </>;
}
function CourseHero({
  course,
  level,
  body,
  firstOpen,
  cms
}) {
  return <Section tone="dark" size="sm" className="pt-10">
      <Container>
        <Breadcrumb dark items={[{
        label: cms.label_Home_25,
        href: cms.href___26
      }, {
        label: cms.label_Courses_27,
        href: cms.href__courses_28
      }, {
        label: course.name
      }]} className="mb-7" />
        

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {level ? <LevelBadge level={level} /> : null}
              {course.code ? <Badge tone="light">{course.code}</Badge> : null}
              {course.category ? <Badge tone="light">{course.category}</Badge> : null}
            </div>

            <h1 className="t-h1 text-white">{course.name}</h1>

            {course.shortDescription ? <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{course.shortDescription}</p> : null}

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {course.duration ? <HeroFact icon={Clock} label="Duration" value={course.duration} cms={cms} /> : null}
              {level?.name ? <HeroFact icon={Layers} label="Level" value={level.name} cms={cms} /> : null}
              {body?.name ? <HeroFact icon={Award} label="Awarding body" value={body.slug ? <Link href={`/awarding-bodies/${body.slug}`} className="hover:text-brand-400">
                        {body.name}
                      </Link> : body.name} cms={cms} /> : null}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {firstOpen ? <LinkButton href={`/registration?course=${course._id}&reference=${firstOpen._id}`} size="lg">{cms.Text_Register_now_29}</LinkButton> : <LinkButton href={cms.href__sessions_30} variant="primary" size="lg">{cms.Text_See_available_dates_31}</LinkButton>}
              <LinkButton href={cms.href__contact_us_32} variant="outlineLight" size="lg">{cms.Text_Ask_a_question_33}</LinkButton>
            </div>
          </div>

          <Reveal animation="fade-left">
            <ImageWell src={course.featuredImage} alt={cms.alt__34} fallbackText={course.name} ratio="4/3" zoom={false} priority className="rounded-xl" />
            
          </Reveal>
        </div>
      </Container>
    </Section>;
}
function HeroFact({
  icon: Icon,
  label,
  value,
  cms
}) {
  return <div>
      <dt className="t-label mb-1 flex items-center gap-1.5 text-ink-500">
        <Icon size={13} aria-hidden="true" />
        {label}
      </dt>
      <dd className="t-h4 text-white">{value}</dd>
    </div>;
}
function Prose({
  title,
  html,
  cms
}) {
  return <Reveal>
      <h2 className="t-h2 text-ink-900">{title}</h2>
      <div className="cms-prose t-body mt-4 text-ink-700" dangerouslySetInnerHTML={{
      __html: html
    }} />
      
    </Reveal>;
}
function CourseAside({
  course,
  body,
  level,
  firstOpen,
  cms
}) {
  return <aside className="mt-14 lg:mt-0">
      <div className="lg:sticky lg:top-24">
        <Card className="p-6">
          <h2 className="t-h4 text-ink-900">{cms.Heading_Course_summary_35}</h2>
          <dl className="mt-4 divide-y divide-ink-100">
            <AsideRow label="Course code" value={course.code} cms={cms} />
            <AsideRow label="Duration" value={course.duration} cms={cms} />
            <AsideRow label="Level" value={level?.name} cms={cms} />
            <AsideRow label="Awarding body" value={body?.name} cms={cms} />
            <AsideRow label="Category" value={course.category} cms={cms} />
          </dl>

          {body?.logo ? <div className="mt-5 flex items-center gap-3 rounded-lg bg-ink-50 p-3">
              {}
              <img src={body.logo} alt={cms.alt__36} loading="lazy" className="h-10 w-auto max-w-24 object-contain" />
            
              <div className="min-w-0">
                <p className="t-caption text-ink-500">{cms.Description_Awarded_by_37}</p>
                <p className="t-small font-semibold text-ink-900">{body.name}</p>
              </div>
            </div> : null}

          <div className="mt-6 space-y-2.5">
            {firstOpen ? <LinkButton href={`/registration?course=${course._id}&reference=${firstOpen._id}`} fullWidth>{cms.Text_Register_now_38}</LinkButton> : <LinkButton href={cms.href__sessions_39} fullWidth>{cms.Text_See_available_dates_40}</LinkButton>}
            <LinkButton href={cms.href__contact_us_41} variant="outline" fullWidth>{cms.Text_Request_a_callback_42}</LinkButton>
          </div>

          {course.certificateImage ? <p className="t-caption mt-4 flex items-center gap-1.5 text-ink-500">
              <FileBadge size={13} aria-hidden="true" />{cms.Description_Certificate_issued_on_successful_completion_43}</p> : null}
        </Card>
      </div>
    </aside>;
}
function AsideRow({
  label,
  value,
  cms
}) {
  if (!value) return null;
  return <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="t-small text-ink-500">{label}</dt>
      <dd className="t-small text-right font-semibold text-ink-900">{value}</dd>
    </div>;
}
