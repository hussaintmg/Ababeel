// Extracted from app/FAQs/page.jsx; original layouts with typed CMS content.
"use client";

import { webData } from "@/constants";
import defaults from "./faqs.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const faqs = (Array.isArray(cms.faqs_1) ? cms.faqs_1 : []).map(entry => entry);
  return <div className="min-h-screen bg-gray-100 px-4 py-12">
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">{cms.Heading_Frequently_Asked_Questions_2}</h1>

        <p className="mb-8 text-gray-700 leading-relaxed">{cms.Description_This_section_answers_common_questions_about_the_3}{webData.brand.name}{cms.Description_platform_and_its_use__4}</p>

        <div className="space-y-6">
          {faqs.map((faq, index) => <div key={index} className="border-b pb-4 last:border-b-0">
              <h2 className="mb-2 text-lg font-medium text-gray-900">
                {faq.question}
              </h2>
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>)}
        </div>
      </div>}
    </div>;
}
