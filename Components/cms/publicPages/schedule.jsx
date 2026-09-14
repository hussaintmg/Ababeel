// Extracted from app/schedule/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb } from "@/Components/ui";
import ScheduleBrowser from "@/app/schedule/ScheduleBrowser";
import defaults from "./schedule.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    copy,
    year,
    month,
    sessions,
    months,
    bodies
  } = {
    ...{
      "copy": {},
      "year": 2026,
      "month": 1,
      "sessions": [],
      "months": [],
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
          label: cms.label_Schedule_3
        }]} className="mb-6" />
            
            <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Upcoming_dates_4}</p>
            <h1 className="t-h1 max-w-3xl text-white">{cms.Title_5}</h1>
            <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
              {cms.Intro_6}
            </p>
          </Container>
        </Section>}
      

      {(cmsProps.section == null || cmsProps.section === 1) && <ScheduleBrowser initial={{
      year,
      month,
      sessions,
      months
    }} awardingBodies={bodies} emptyMessage={copy.emptyMessage} />}
      
    </>;
}
