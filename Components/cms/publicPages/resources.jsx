// Extracted from app/resources/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb, ResourceCard, Reveal } from "@/Components/ui";
import ResourcesBrowser from "@/app/resources/ResourcesBrowser";
import defaults from "./resources.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    initial,
    types,
    featured
  } = {
    ...{
      "initial": {
        "items": [],
        "total": 0
      },
      "types": [],
      "featured": null
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
          label: cms.label_Resources_3
        }]} className="mb-6" />
            
            <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Knowledge_4}</p>
            <h1 className="t-h1 max-w-3xl text-white">{cms.Heading_Resources_5}</h1>
            <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{cms.Description_Guides__articles_and_downloads_from_our_training_6}</p>
          </Container>
        </Section>}
      

      {(cmsProps.section == null || cmsProps.section === 1) && (featured ? <Section tone="muted" size="sm">
          <Container>
            <Reveal>
              <p className="t-eyebrow mb-4 text-brand-700">{cms.Description_Featured_7}</p>
              <div className="max-w-4xl">
                <ResourceCard resource={featured} featured />
              </div>
            </Reveal>
          </Container>
        </Section> : null)}

      {(cmsProps.section == null || cmsProps.section === 2) && <ResourcesBrowser initial={initial} types={types} />}
    </>;
}
