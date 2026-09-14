// Extracted from app/awarding-bodies/[slug]/page.jsx; original layouts with typed CMS content.
"use client";

import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Section, Container, Breadcrumb, CourseCard, ImageWell, EmptyState, LinkButton, Reveal, RevealStagger } from "@/Components/ui";
import { stripHtml, truncate } from "@/lib/training/format";
import defaults from "./awarding-body-detail.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    body,
    courses,
    training
  } = {
    ...{
      "body": {
        "name": "Choose a published awarding body"
      },
      "courses": [],
      "training": {}
    },
    ...(cmsProps._data || {})
  };
  const cms = {
    ...defaults,
    ...cmsProps
  };
  return <>
    
      {(cmsProps.section == null || cmsProps.section === 0) && <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb dark items={[{
          label: cms.label_Home_1,
          href: cms.href___2
        }, {
          label: cms.label_Awarding_Bodies_3,
          href: cms.href__awarding_bodies_4
        }, {
          label: body.name
        }]} className="mb-7" />
          

          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              {body.logo ? <div className="mb-6 inline-flex items-center rounded-lg bg-white px-5 py-3">
                  {}
                  <img src={body.logo} alt={cms.alt__5} className="h-12 w-auto object-contain" />
                </div> : null}

              <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Awarding_body_6}</p>
              <h1 className="t-h1 text-white">{body.name}</h1>
              {body.shortName && body.shortName !== body.name ? <p className="t-body mt-2 text-ink-500">{body.shortName}</p> : null}
              {body.description ? <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
                  {truncate(stripHtml(body.description), 180)}
                </p> : null}
              {courses.length ? <p className="t-small mt-6 font-semibold text-brand-400">
                  {courses.length}{cms.Description_accredited_course_7}{courses.length === 1 ? "" : "s"}{cms.Description_available_through_Ababeel_8}</p> : null}

              {body.website ? <a href={body.website} target="_blank" rel="noopener noreferrer" className="aba-focus mt-6 inline-flex items-center gap-1.5 t-small font-semibold text-brand-400 hover:text-brand-300">{cms.Text_Visit_their_website_9}<ExternalLink size={14} aria-hidden="true" />
                </a> : null}
            </div>

            {body.coverImage ? <Reveal animation="fade-left">
                <ImageWell src={body.coverImage} alt={cms.alt__10} ratio="4/3" zoom={false} priority className="rounded-xl" />
              </Reveal> : null}
          </div>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 1) && (body.description || body.accreditationInfo) && <Section tone="light" size="md">
          <Container size="prose">
            {body.description ? <Reveal>
                <h2 className="t-h2 text-ink-900">{cms.Heading_About_11}{body.name}</h2>
                <div className="cms-prose t-body mt-4 text-ink-700" dangerouslySetInnerHTML={{
            __html: body.description
          }} />
            
              </Reveal> : null}

            {body.accreditationInfo ? <Reveal className="mt-12">
                <h2 className="t-h2 text-ink-900">{cms.Heading_Accreditation_12}</h2>
                <div className="cms-prose t-body mt-4 text-ink-700" dangerouslySetInnerHTML={{
            __html: body.accreditationInfo
          }} />
            
              </Reveal> : null}
          </Container>
        </Section>}

      {(cmsProps.section == null || cmsProps.section === 2) && <Section tone="muted" size="md">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow mb-2 text-brand-700">{cms.Description_Training_13}</p>
              <h2 className="t-h2 text-ink-900">{cms.Heading_Courses_awarded_by_14}{body.name}</h2>
            </div>
            <LinkButton href={cms.href__courses_15} variant="outline">{cms.Text_Browse_all_courses_16}</LinkButton>
          </div>
          {courses.length ? <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => <CourseCard key={course._id} course={course} template={training?.courseCardTemplate || "standard"} />)}
            </RevealStagger> : <EmptyState title={cms.title_No_courses_listed_yet_17} message={`We are not currently publishing any ${body.name} courses. Browse the full catalogue, or contact us about what you need.`} action={<LinkButton href={cms.href__courses_18}>{cms.Text_Browse_all_courses_19}</LinkButton>} />}
        </Container>
      </Section>}
    </>;
}
