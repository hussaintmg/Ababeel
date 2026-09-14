// Extracted from app/glossary-of-terms/page.jsx; original layouts with typed CMS content.
"use client";

import { webData } from "@/constants";
import defaults from "./glossary-of-terms.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  return <div className="min-h-screen bg-gray-100 px-4 py-12">
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">{cms.Heading_Glossary_of_Terms_1}</h1>

        <p className="mb-6 text-gray-700 leading-relaxed">{cms.Description_This_glossary_provides_clear_definitions_of_comm_2}{` ${webData.brand.name}`}{cms.Description_platform_to_help_users_better_understand_our_con_3}</p>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{webData.brand.name}</h2>
            <p>{cms.Description_A_digital_platform_that_provides_access_to_safet_4}</p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">{cms.Heading_Certification_Provider_5}</h2>
            <p>{cms.Description_An_organization_or_institution_authorized_to_off_6}{` courses through the ${webData.brand.name} platform.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">{cms.Heading_Course_7}</h2>
            <p>
              {`A structured educational program focused on safety-related topics, made available on the ${webData.brand.name} platform by a certification provider.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">{cms.Heading_Certification_8}</h2>
            <p>{cms.Description_A_document_or_digital_record_issued_upon_success_9}</p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">{cms.Heading_User_10}</h2>
            <p>
              {`Any individual or organization that accesses or uses the ${webData.brand.name} platform.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">{cms.Heading_Authorized_Use_11}</h2>
            <p>
              {`Use that complies with ${webData.brand.name} policies, terms, and written permissions where required.`}
            </p>
          </div>
        </div>
      </div>}
    </div>;
}
