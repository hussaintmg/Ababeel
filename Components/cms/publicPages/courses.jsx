// Extracted from app/courses/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb } from "@/Components/ui";
import CoursesBrowser from "@/app/courses/CoursesBrowser";
import defaults from "./courses.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    training,
    initial,
    filters,
    perPage
  } = {
    ...{
      "training": {},
      "initial": {
        "items": [],
        "total": 0
      },
      "filters": {
        "levels": [],
        "awardingBodies": [],
        "categories": [],
        "durations": []
      },
      "perPage": 12
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
          label: cms.label_Courses_3
        }]} className="mb-6" />
            
            <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Training_catalogue_4}</p>
            <h1 className="t-h1 max-w-3xl text-white">{cms.Heading_Accredited_safety_training__built_around_compete_5}</h1>
            <p className="t-body-lg mt-4 max-w-2xl text-ink-200">{cms.Description_Browse_our_full_catalogue_by_level__awarding_bod_6}</p>
          </Container>
        </Section>}
      

      {(cmsProps.section == null || cmsProps.section === 1) && <CoursesBrowser initial={initial} filters={filters} cardTemplate={training?.courseCardTemplate || "standard"} perPage={perPage} />}
      
    </>;
}
