// components/FAQ.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import webData from "@/constants";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: `What is ${webData.brand.shortName} Qualifications?`,
      answer:
        `${webData.brand.shortName} Qualifications is a UK-based awarding organisation specialising in safety and technical qualifications. We develop, regulate, and award certifications in partnership with approved training providers.`,
    },
    {
      question: `How can a centre become approved by ${webData.brand.shortName}?`,
      answer:
        "Organisations can apply for centre approval through our application process. Each application is reviewed to ensure the centre meets our quality assurance, governance, and operational standards.",
    },
    {
      question: `Are ${webData.brand.shortName} qualifications recognised?`,
      answer:
        "Our qualifications are developed in line with UK industry and regulatory expectations, ensuring they reflect professional competence and workplace relevance.",
    },
    {
      question: `How does ${webData.brand.shortName} ensure quality across centres?`,
      answer:
        "We implement structured quality assurance procedures, including centre approval, monitoring, assessment verification, and compliance reviews to maintain consistent standards.",
    },
    {
      question: `Who can enrol on ${webData.brand.shortName} qualifications?`,
      answer:
        `Learners must enrol through an approved ${webData.brand.shortName} centre. Eligibility requirements vary depending on the qualification level and sector.`,
    },
    {
      question: "How are certificates issued?",
      answer:
        "Certificates are awarded upon successful completion of the qualification requirements and verification through an approved centre.",
    },
    {
      question: `How can I verify a ${webData.brand.shortName} certificate?`,
      answer:
        `Verification requests can be submitted directly to ${webData.brand.shortName} through our official communication channels.`,
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="text-blue-600">Questions</span>
          </h2>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our safety & technical
            programs.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 shrink-0"
                >
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 pt-2">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              We offer ongoing expert guidance to help organisations determine
              the most suitable safety qualifications for their workforce.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact-us">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Us
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Contact Now: {webData.contact.infoEmail}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
