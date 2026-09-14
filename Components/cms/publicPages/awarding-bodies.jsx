// Extracted from app/awarding-bodies/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb, AwardingBodyCard, EmptyState, LinkButton, RevealStagger } from "@/Components/ui";
import defaults from "./awarding-bodies.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    bodies
  } = {
    ...{
      "bodies": []
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
          label: cms.label_Awarding_Bodies_3
        }]} className="mb-6" />
          <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Accreditation_4}</p>
          <h1 className="t-h1 max-w-3xl text-white">{cms.Heading_Our_awarding_bodies_5}</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{cms.Description_Every_qualification_we_deliver_is_awarded_by_a_r_6}</p>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 1) && <Section tone="light" size="md">
        <Container>
          {bodies.length ? <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bodies.map(body => <AwardingBodyCard key={body._id} body={body} />)}
            </RevealStagger> : <EmptyState title={cms.title_No_awarding_bodies_published_yet_7} message={cms.message_Our_accreditation_details_will_appear__8} action={<LinkButton href={cms.href__courses_9}>{cms.Text_Browse_courses_10}</LinkButton>} />}
        </Container>
      </Section>}
    </>;
}
