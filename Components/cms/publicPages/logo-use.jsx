// Extracted from app/logo-use/page.jsx; original layouts with typed CMS content.
"use client";

import { webData } from "@/constants";
import defaults from "./logo-use.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  return <div className="min-h-screen bg-gray-100 px-4 py-12">
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">
          {webData.brand.name}{cms.Heading_Logo_Use_1}</h1>

        <p className="mb-4 text-gray-700 leading-relaxed">
          {`The ${webData.brand.name} logo is a protected brand asset. This page explains who is permitted to use the ${webData.brand.name} logo and under what conditions.`}
        </p>

        <p className="mb-4 text-gray-700 leading-relaxed">
          {`${webData.brand.name} operates as a platform that enables access to safety certification courses and related educational programs. Use of the ${webData.brand.name} logo must accurately represent this role and must not imply activities, services, or responsibilities beyond the scope of the platform.`}
        </p>

        <h2 className="mt-8 mb-3 text-xl font-medium text-gray-800">{cms.Heading_Permitted_Use_2}</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700">
          <li>{cms.Text_Authorized_partners_and_affiliated_organizations_3}</li>
          <li>{`Approved certification providers listed on the ${webData.brand.name} platform`}</li>
          <li>{`Official ${webData.brand.name} publications, websites, and digital materials`}</li>
          <li>{cms.Text_Media_or_third_parties_with_prior_written_permis_4}</li>
        </ul>

        <h2 className="mt-8 mb-3 text-xl font-medium text-gray-800">{cms.Heading_Prohibited_Use_5}</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700">
          <li>{`Use without written authorization from ${webData.brand.name}`}</li>
          <li>
            {`Any use that suggests ${webData.brand.name} directly delivers certification or operational services`}
          </li>
          <li>{cms.Text_Modification__distortion__or_recoloring_of_the_l_6}</li>
          <li>{cms.Text_Use_in_misleading__unlawful__or_unethical_conten_7}</li>
        </ul>

        <div className="mt-8 rounded-md bg-gray-50 p-4 text-sm text-gray-600">
          {`Unauthorized or improper use of the ${webData.brand.name} logo may result in corrective action. Permission must be obtained before using the logo in any public or commercial material.`}
        </div>
      </div>}
    </div>;
}
