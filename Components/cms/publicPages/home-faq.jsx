// Extracted from Components/FAQ.jsx; original layouts with typed CMS content.
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import webData from "@/constants";
import defaults from "./home-faq.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = (Array.isArray(cms.faqs_1) ? cms.faqs_1 : []).map(entry => entry);
  const toggleFAQ = index => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return <div className="py-16 bg-gray-50">
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }} viewport={{
        once: true
      }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{cms.Heading_Frequently_Asked_2}<span className="text-blue-600">{cms.Text_Questions_3}</span>
          </h2>
          <p className="text-lg text-gray-600">{cms.Description_Find_answers_to_common_questions_about_our_safet_4}</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => <motion.div key={index} initial={{
          opacity: 0,
          y: 10
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          delay: index * 0.1
        }} viewport={{
          once: true
        }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none" onClick={() => toggleFAQ(index)}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </h3>
                <motion.div animate={{
              rotate: openIndex === index ? 180 : 0
            }} transition={{
              duration: 0.3
            }} className="ml-4 shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && <motion.div initial={{
              height: 0,
              opacity: 0
            }} animate={{
              height: "auto",
              opacity: 1
            }} exit={{
              height: 0,
              opacity: 0
            }} transition={{
              duration: 0.3
            }} className="overflow-hidden">
                    <div className="px-6 pb-4 pt-2">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </motion.div>}
              </AnimatePresence>
            </motion.div>)}
        </div>

        {}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.6
      }} viewport={{
        once: true
      }} className="mt-12 text-center">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{cms.Heading_Still_have_questions__5}</h3>
            <p className="text-gray-600 mb-6">{cms.Description_We_offer_ongoing_expert_guidance_to_help_organis_6}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={cms.href__contact_us_7}>
                <motion.button whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">{cms.Text_Contact_Us_8}</motion.button>
              </Link>
              <motion.button whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors">{cms.Text_Contact_Now__9}{webData.contact.infoEmail}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>}
    </div>;
}
