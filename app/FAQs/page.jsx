import CmsPageContent from "@/Components/cms/CmsPageContent";
import { webData } from "@/constants";

const faqs = [
  {
    question: `What is ${webData.brand.name} Qualifications?`,
    answer:
      `${webData.brand.name} Qualifications is a UK-based awarding organisation specialising in safety and technical qualifications. We develop, regulate, and award certifications in partnership with approved training providers.`,
  },
  {
    question: `How can a centre become approved by ${webData.brand.name}?`,
    answer:
      "Organisations can apply for centre approval through our application process. Each application is reviewed to ensure the centre meets our quality assurance, governance, and operational standards.",
  },
  {
    question: `Are ${webData.brand.name} qualifications recognised?`,
    answer:
      "Our qualifications are developed in line with UK industry and regulatory expectations, ensuring they reflect professional competence and workplace relevance.",
  },
  {
    question: `How does ${webData.brand.name} ensure quality across centres?`,
    answer:
      "We implement structured quality assurance procedures, including centre approval, monitoring, assessment verification, and compliance reviews to maintain consistent standards.",
  },
  {
    question: `Who can enrol on ${webData.brand.name} qualifications?`,
    answer:
      `Learners must enrol through an approved ${webData.brand.name} centre. Eligibility requirements vary depending on the qualification level and sector.`,
  },
  {
    question: "How are certificates issued?",
    answer:
      "Certificates are awarded upon successful completion of the qualification requirements and verification through an approved centre.",
  },
  {
    question: `How can I verify a ${webData.brand.name} certificate?`,
    answer:
      `Verification requests can be submitted directly to ${webData.brand.name} through our official communication channels.`,
  },
];

function FAQsPageInner() {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-semibold text-gray-900">
          Frequently Asked Questions
        </h1>

        <p className="mb-8 text-gray-700 leading-relaxed">
          This section answers common questions about the {webData.brand.name} platform and
          its use.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h2 className="mb-2 text-lg font-medium text-gray-900">
                {faq.question}
              </h2>
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FAQsPage(props) {
  return (
    <CmsPageContent pageKey="faqs">
      <FAQsPageInner {...props} />
    </CmsPageContent>
  );
}
