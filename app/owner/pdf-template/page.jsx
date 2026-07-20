"use client";

import Link from "next/link";
import { useTemplates } from "@/context/TemplateContext";
import pdfRequiredElements from "@/constants/pdfRequired";

export default function TemplatesHomePage() {
  const { templates, loading } = useTemplates();

  const getTemplateStatus = (element) => {
    const typeTemplates = templates.filter((t) => t.type === element);
    const templateExists = typeTemplates.length > 0;
    const activeTemplate = typeTemplates.find((t) => t.isActive);
    return {
      exists: templateExists,
      isActive: !!activeTemplate,
      templateCount: typeTemplates.length,
      templatesList: typeTemplates,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificate & ID Card Templates
          </h1>
          <p className="text-gray-600">
            Manage all your certificate and ID card templates. Create missing
            templates to enable downloads.
          </p>
        </div>

        {pdfRequiredElements.some((el) => !getTemplateStatus(el).exists) && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-yellow-600 text-xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-800">
                  Missing Templates Warning!
                </p>
                <p className="text-yellow-700 text-sm">
                  Following templates are not ready:{" "}
                  {pdfRequiredElements
                    .filter((el) => !getTemplateStatus(el).exists)
                    .join(", ")}
                  . Please create them urgently to enable certificate downloads.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 w-full">
          {pdfRequiredElements.map((element) => {
            const status = getTemplateStatus(element);
            const href = `/owner/pdf-template/${element.replace(/\s/g, "-").toLowerCase()}`;

            return (
              <div
                key={element}
                className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 w-full shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between w-full min-w-0">
                  {/* LEFT SIDE */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* STATUS ICON */}
                    <span className="text-xl shrink-0">
                      {status.exists ? (status.isActive ? "✅" : "🟡") : "❌"}
                    </span>

                    {/* CONTENT */}
                    <div className="min-w-0 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 break-words">
                          {element}
                        </h3>

                        {status.exists && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full shrink-0">
                            📄 {status.templateCount}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mt-1 break-words">
                        {status.exists
                          ? `${status.templateCount} template(s) available${
                              status.isActive
                                ? " • Active template set"
                                : " • No active template"
                            }`
                          : "Template not created yet"}
                      </p>

                      {/* TEMPLATE TAGS */}
                      {status.exists && status.templatesList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {status.templatesList.slice(0, 3).map((template) => (
                            <span
                              key={template._id}
                              className="text-xs px-2 py-1 bg-gray-100 rounded break-words"
                            >
                              {template.name}
                            </span>
                          ))}

                          {status.templatesList.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              +{status.templatesList.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-2 md:items-center w-full md:w-auto">
                    {!status.exists && (
                      <div className="bg-red-50 px-3 py-1.5 rounded-md text-red-700 text-sm w-full sm:w-auto text-center">
                        ⚠️ Create Template
                      </div>
                    )}

                    <Link
                      href={href}
                      className={`px-4 py-2 rounded-md font-medium text-center whitespace-nowrap w-full sm:w-auto ${
                        status.exists
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      }`}
                    >
                      {status.exists ? "✏️ Manage" : "➕ Create"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">💡 Note:</span> Each certificate
                type can have multiple templates. Only one template can be
                active at a time. Active templates will be used for generating
                certificates. Click on Manage Templates to view all templates
                for a specific type.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {templates.length}
            </div>
            <div className="text-xs text-gray-500">Total Templates</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {templates.filter((t) => t.isActive).length}
            </div>
            <div className="text-xs text-gray-500">Active Templates</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {pdfRequiredElements.length}
            </div>
            <div className="text-xs text-gray-500">Required Types</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {
                pdfRequiredElements.filter(
                  (el) => !getTemplateStatus(el).exists,
                ).length
              }
            </div>
            <div className="text-xs text-gray-500">Missing Types</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">
              {
                pdfRequiredElements.filter(
                  (el) =>
                    getTemplateStatus(el).exists &&
                    !getTemplateStatus(el).isActive,
                ).length
              }
            </div>
            <div className="text-xs text-gray-500">Types w/o Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
