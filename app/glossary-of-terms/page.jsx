import CmsPageContent from "@/Components/cms/CmsPageContent";
import { webData } from "@/constants";

function GlossaryOfTermsInner() {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">
          Glossary of Terms
        </h1>

        <p className="mb-6 text-gray-700 leading-relaxed">
          This glossary provides clear definitions of commonly used terms on the
          {` ${webData.brand.name}`} platform to help users better understand our content and
          services.
        </p>

        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{webData.brand.name}</h2>
            <p>
              A digital platform that provides access to safety certification courses
              and related educational resources offered by approved providers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Certification Provider
            </h2>
            <p>
              An organization or institution authorized to offer safety certification
              {` courses through the ${webData.brand.name} platform.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">Course</h2>
            <p>
              {`A structured educational program focused on safety-related topics, made available on the ${webData.brand.name} platform by a certification provider.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">Certification</h2>
            <p>
              A document or digital record issued upon successful completion of
              a course, subject to the policies of the certification provider.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">User</h2>
            <p>
              {`Any individual or organization that accesses or uses the ${webData.brand.name} platform.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Authorized Use
            </h2>
            <p>
              {`Use that complies with ${webData.brand.name} policies, terms, and written permissions where required.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GlossaryOfTerms(props) {
  return (
    <CmsPageContent pageKey="glossary-of-terms">
      <GlossaryOfTermsInner {...props} />
    </CmsPageContent>
  );
}
