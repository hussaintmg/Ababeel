// Extracted from app/registration/page.jsx; original layouts with typed CMS content.
"use client";

import { Section, Container, Breadcrumb } from "@/Components/ui";
import { registrationCta } from "@/lib/training/status";
import RegistrationForm from "@/app/registration/RegistrationForm";
import defaults from "./registration.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    fields,
    course,
    session,
    coursesList,
    panel,
    payment,
    copy
  } = {
    ...{
      "fields": [],
      "course": null,
      "session": null,
      "coursesList": {
        "items": []
      },
      "panel": {},
      "payment": {},
      "copy": {}
    },
    ...(cmsProps._data || {})
  };
  const toPublicField = field => field;
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
          label: cms.label_Courses_3,
          href: cms.href__courses_4
        }, {
          label: cms.label_Register_5
        }]} className="mb-6" />
            
            <p className="t-eyebrow mb-3 text-brand-400">{cms.Description_Enrolment_6}</p>
            <h1 className="t-h1 max-w-3xl text-white">
              {cms.Intro_Title_7}
            </h1>
            <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
              {cms.Intro_Text_8}
            </p>
          </Container>
        </Section>}
      

      {(cmsProps.section == null || cmsProps.section === 1) && <RegistrationForm data={{
      fields: fields.map(toPublicField),
      course,
      session,
      courses: coursesList?.items || [],
      cta: session ? registrationCta(session) : null,
      panel,
      payment,
      copy
    }} />}
      
    </>;
}
