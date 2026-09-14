// Extracted from app/about/consultants/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb, ConsultantProfile, EmptyState, LinkButton } from "@/Components/ui";
import defaults from "./our-consultants.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    consultants
  } = {
    ...{
      "consultants": []
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
          label: cms.label_Our_Consultants_5
        }]} className="mb-6" />
          <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Expertise_6}</p>
          <h1 className="t-h1 max-w-3xl text-white">{cms.Heading_Our_consultants_7}</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{cms.Description_Subject_matter_specialists_who_advise__audit_and_8}</p>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 1) && <Section tone="light" size="md">
        <Container>
          {consultants.length ? <div className="space-y-20 lg:space-y-28">
              {consultants.map((consultant, index) => <ConsultantProfile key={consultant._id} consultant={consultant} index={index} />)}
            </div> : <EmptyState title={cms.title_Consultant_profiles_coming_soon_9} message={cms.message_We_are_preparing_profiles_for_our_cons_10} action={<LinkButton href={cms.href__contact_us_11}>{cms.Text_Contact_us_12}</LinkButton>} />}
        </Container>
      </Section>}
    </>;
}
