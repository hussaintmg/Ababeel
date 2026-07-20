import { webData } from "@/constants";

export default function LogoUse() {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">
          {webData.brand.name} Logo Use
        </h1>

        <p className="mb-4 text-gray-700 leading-relaxed">
          {`The ${webData.brand.name} logo is a protected brand asset. This page explains who is permitted to use the ${webData.brand.name} logo and under what conditions.`}
        </p>

        <p className="mb-4 text-gray-700 leading-relaxed">
          {`${webData.brand.name} operates as a platform that enables access to safety certification courses and related educational programs. Use of the ${webData.brand.name} logo must accurately represent this role and must not imply activities, services, or responsibilities beyond the scope of the platform.`}
        </p>

        <h2 className="mt-8 mb-3 text-xl font-medium text-gray-800">
          Permitted Use
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700">
          <li>Authorized partners and affiliated organizations</li>
          <li>{`Approved certification providers listed on the ${webData.brand.name} platform`}</li>
          <li>{`Official ${webData.brand.name} publications, websites, and digital materials`}</li>
          <li>Media or third parties with prior written permission</li>
        </ul>

        <h2 className="mt-8 mb-3 text-xl font-medium text-gray-800">
          Prohibited Use
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700">
          <li>{`Use without written authorization from ${webData.brand.name}`}</li>
          <li>
            {`Any use that suggests ${webData.brand.name} directly delivers certification or operational services`}
          </li>
          <li>Modification, distortion, or recoloring of the logo</li>
          <li>
            Use in misleading, unlawful, or unethical content or activities
          </li>
        </ul>

        <div className="mt-8 rounded-md bg-gray-50 p-4 text-sm text-gray-600">
          {`Unauthorized or improper use of the ${webData.brand.name} logo may result in corrective action. Permission must be obtained before using the logo in any public or commercial material.`}
        </div>
      </div>
    </div>
  );
}
