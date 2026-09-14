// Extracted from app/about/team/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb, PersonCard, EmptyState, LinkButton, SectionHeading, RevealStagger } from "@/Components/ui";
import defaults from "./our-team.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    members,
    leadership,
    rest
  } = {
    ...{
      "members": [],
      "leadership": [],
      "rest": []
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
          label: cms.label_About_3,
          href: cms.href__about_us_4
        }, {
          label: cms.label_Our_Team_5
        }]} className="mb-6" />
          <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_People_6}</p>
          <h1 className="t-h1 max-w-3xl text-white">{cms.Heading_Our_team_7}</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{cms.Description_Practitioners__trainers_and_assessors_who_have_d_8}</p>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 1) && <Section tone="light" size="md">
        <Container>
          {!members.length ? <EmptyState title={cms.title_Our_team_page_is_on_its_way_9} message={cms.message_We_are_putting_together_profiles_for_t_10} action={<LinkButton href={cms.href__contact_us_11}>{cms.Text_Contact_us_12}</LinkButton>} /> : <>
              {leadership.length ? <>
                  <SectionHeading eyebrow={cms.eyebrow_Leadership_13} title={cms.title_Who_leads_the_work_14} />
                  <RevealStagger className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {leadership.map(person => <PersonCard key={person._id} person={person} />)}
                  </RevealStagger>
                </> : null}

              {rest.length ? <>
                  {leadership.length ? <SectionHeading title={cms.title_The_wider_team_15} className="mt-20" /> : null}
                  <RevealStagger className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {rest.map(person => <PersonCard key={person._id} person={person} showBio={false} />)}
                  </RevealStagger>
                </> : null}
            </>}
        </Container>
      </Section>}
    </>;
}
