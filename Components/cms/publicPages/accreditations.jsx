// Extracted from app/about/accreditations/page.jsx; original layouts with typed CMS content.
"use client";

import { ExternalLink } from "lucide-react";
import { Section, Container, Breadcrumb, Card, LogoTile, ImageWell, EmptyState, LinkButton, SectionHeading, Reveal, RevealStagger } from "@/Components/ui";
import defaults from "./accreditations.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    accreditations,
    bodies
  } = {
    ...{
      "accreditations": [],
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
          label: cms.label_About_3,
          href: cms.href__about_us_4
        }, {
          label: cms.label_Accreditations_5
        }]} className="mb-6" />
          <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Credentials_6}</p>
          <h1 className="t-h1 max-w-3xl text-white">{cms.Heading_Accreditations___certifications_7}</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{cms.Description_The_approvals_and_memberships_that_stand_behind__8}</p>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 1) && <Section tone="light" size="md">
        <Container>
          {accreditations.length ? <div className="space-y-8">
              {accreditations.map(item => <Reveal key={item._id}>
                  <Card className="p-6 sm:p-8">
                    <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
                      <div className="space-y-4">
                        <LogoTile src={item.logo} alt={cms.alt__9} name={item.name} />
                        {item.image ? <ImageWell src={item.image} alt={`${item.name} certificate`} ratio="4/3" zoom={false} className="rounded-lg" /> : null}
                      </div>

                      <div className="min-w-0">
                        <h2 className="t-h3 text-ink-900">{item.name}</h2>
                        {item.referenceNumber ? <p className="t-caption mt-1 font-mono text-ink-500">
                            {item.referenceNumber}
                          </p> : null}
                        {item.description ? <p className="t-body mt-3 text-ink-700">{item.description}</p> : null}
                        {item.details ? <div className="cms-prose t-small mt-4 text-ink-600" dangerouslySetInnerHTML={{
                    __html: item.details
                  }} /> : null}
                        {item.website ? <a href={item.website} target="_blank" rel="noopener noreferrer" className="aba-focus mt-5 inline-flex items-center gap-1.5 t-small font-semibold text-brand-700 hover:text-brand-800">{cms.Text_Verify_with_the_issuing_body_10}<ExternalLink size={14} aria-hidden="true" />
                          </a> : null}
                      </div>
                    </div>
                  </Card>
                </Reveal>)}
            </div> : <EmptyState title={cms.title_Accreditation_details_coming_soon_11} message={cms.message_We_are_preparing_this_page__Contact_us_12} action={<LinkButton href={cms.href__contact_us_13}>{cms.Text_Contact_us_14}</LinkButton>} />}
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 2) && (bodies.length ? <Section tone="muted" size="md">
          <Container>
            <SectionHeading eyebrow={cms.eyebrow_Qualifications_15} title={cms.title_Who_awards_our_qualifications_16} lead={cms.lead_Accreditation_of_the_organisation_is_o_17} />
            <RevealStagger className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {bodies.map(body => <a key={body._id} href={`/awarding-bodies/${body.slug}`} className="aba-focus block" aria-label={body.name}>
                  <LogoTile src={body.logo} alt={cms.alt__18} name={body.name} className="hover:border-ink-200" />
                </a>)}
            </RevealStagger>
          </Container>
        </Section> : null)}
    </>;
}
