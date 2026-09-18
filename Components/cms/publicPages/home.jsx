// Extracted from app/page.js; original layouts with typed CMS content.
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import FAQ from "@/Components/FAQ";
import { Award, BookOpen, Calendar, CheckCircle2, ChevronRight, GraduationCap, ShieldCheck, Star, Users, ArrowRight, Clock, Sparkles, Building2, Check, FileCheck, Layers, MapPin } from "lucide-react";
import webData from "@/constants";
import defaults from "./home.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const FEATURED_COURSES = (Array.isArray(cms.FEATURED_COURSES_1) ? cms.FEATURED_COURSES_1 : []).map(entry => ({
    ...entry,
    highlights: (Array.isArray(entry.highlights) ? entry.highlights : []).map(entry => entry.value)
  }));
  const AWARDING_BODIES_LIST = (Array.isArray(cms.AWARDING_BODIES_LIST_2) ? cms.AWARDING_BODIES_LIST_2 : []).map(entry => entry);
  const PATHWAYS = (Array.isArray(cms.PATHWAYS_3) ? cms.PATHWAYS_3 : []).map(entry => entry);
  const TESTIMONIALS = (Array.isArray(cms.TESTIMONIALS_4) ? cms.TESTIMONIALS_4 : []).map(entry => entry);
  return <div className="w-full bg-white text-gray-900 selection:bg-blue-600 selection:text-white">
      {}
      {(cmsProps.section == null || cmsProps.section === 0) && <section className="relative overflow-hidden bg-linear-to-b from-[#0b1526] via-[#0f203c] to-[#0b1526] text-white pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8">
        {}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {}
            <div className="lg:col-span-7 text-left space-y-6">
              <motion.div initial={{
              opacity: 0,
              y: 15
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5
            }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs md:text-sm font-medium backdrop-blur-sm">
                <Sparkles size={15} className="text-orange-400" />
                <span>{cms.Text_UK_Regulated_Qualifications___Professional_Devel_5}</span>
              </motion.div>

              <motion.h1 initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.1
            }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">{cms.Heading_Accredited_Qualifications_Built_for_6}{" "}
                <span className="bg-linear-to-r from-blue-400 via-sky-300 to-orange-400 bg-clip-text text-transparent">{cms.Text_Real_World_Competence_7}</span>
              </motion.h1>

              <motion.p initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed font-normal">{cms.Description_Earn_Ofqual_regulated_NVQ_Level_2_to_Level_7_qua_8}</motion.p>

              {}
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.3
            }} className="flex flex-wrap items-center gap-4 pt-2">
                <Link href={cms.href__courses_9} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all duration-200">
                  <BookOpen size={18} />
                  <span>{cms.Text_Browse_Courses_10}</span>
                  <ArrowRight size={16} />
                </Link>

                <Link href={cms.href__registration_11} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200">
                  <GraduationCap size={18} className="text-orange-400" />
                  <span>{cms.Text_Register_Online_12}</span>
                </Link>

                <Link href={cms.href__schedule_13} className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-gray-300 hover:text-white font-medium transition-colors">
                  <Calendar size={18} className="text-blue-400" />
                  <span>{cms.Text_View_Schedule_14}</span>
                </Link>
              </motion.div>

              {}
              <motion.div initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} transition={{
              duration: 0.6,
              delay: 0.4
            }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">{cms.Description_50k__15}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{cms.Description_Certified_Candidates_16}</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">{cms.Description_99_4__17}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{cms.Description_First_Time_Pass_Rate_18}</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-orange-400">{cms.Description_100__19}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{cms.Description_Portfolio_NVQ_Option_20}</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{cms.Description_Ofqual_21}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{cms.Description_Regulated_Bodies_22}</p>
                </div>
              </motion.div>
            </div>

            {}
            <div className="lg:col-span-5">
              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              duration: 0.7,
              delay: 0.2
            }} className="relative rounded-2xl bg-white/5 border border-white/15 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 text-left">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{cms.Heading_Accredited_Standards_23}</h3>
                      <p className="text-xs text-gray-400">{cms.Description_Approved_UK_Assessment_Centre_24}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{cms.Text_Live_Enrolment_25}</span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{cms.Heading_IOSH_Membership_Recognition_26}</h4>
                      <p className="text-xs text-gray-300 mt-0.5">{cms.Description_NVQ_Level_6_graduates_are_eligible_for_Graduate__27}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={18} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{cms.Heading_No_Formal_Written_Exams_28}</h4>
                      <p className="text-xs text-gray-300 mt-0.5">{cms.Description_NVQ_competence_qualifications_are_assessed_throu_29}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{cms.Heading_Flexible_Intake___Invoicing_30}</h4>
                      <p className="text-xs text-gray-300 mt-0.5">{cms.Description_Monthly_enrolment_intakes__corporate_purchase_or_31}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={cms.href__courses_nvq_level_6_diploma_occupatio_32} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors">
                    <span>{cms.Text_Featured__NVQ_Level_6_Diploma_33}</span>
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 1) && <section className="bg-gray-50 border-b border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">{cms.Description_Recognised___Regulated_By_Leading_UK_Awarding_Or_34}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
            {AWARDING_BODIES_LIST.map((body, idx) => <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200/80 shadow-xs hover:shadow-sm transition-shadow">
                <span className="text-xl">{body.logo}</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">{body.name}</p>
                  <p className="text-[10px] text-blue-600 font-medium">{body.type}</p>
                </div>
              </div>)}
          </div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 2) && <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            <BookOpen size={13} />
            <span>{cms.Text_Featured_Qualifications_35}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{cms.Heading_Popular_Professional_Qualifications_36}</h2>
          <p className="text-gray-600 text-base sm:text-lg">{cms.Description_Choose_from_industry_standard_vocational_certifi_37}</p>
        </div>

        {FEATURED_COURSES.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-gray-50 border border-gray-200 max-w-md mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
              <Calendar size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Upcoming Sessions Scheduled</h3>
            <p className="text-xs text-gray-500">There are currently no sessions scheduled for this period. View our complete training calendar to plan ahead.</p>
            <Link href="/schedule" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors">
              <span>View Training Schedule</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_COURSES.map((course, idx) => {
              const isRegClosed = course.registrationAvailable === false || course.registrationAvailable === "false";
              const regUrl = course.registrationUrl || (course.courseId && course.id ? `/registration?course=${course.courseId}&reference=${course.id}` : (course.slug ? `/registration?course=${course.slug}` : ''));
              const detailsUrl = course.slug ? `/courses/${course.slug}` : (course.courseSlug ? `/courses/${course.courseSlug}` : '/courses');
              const displayPrice = course.price === 0 ? "Free" : (typeof course.price === "number" ? `${course.currency || "£"}${course.price.toLocaleString()}` : (course.price || "Enquire"));

              return (
                <div key={course.id || idx} className={`relative flex flex-col justify-between rounded-2xl border ${course.popular ? "border-blue-600 ring-2 ring-blue-600/20 shadow-xl" : "border-gray-200 shadow-sm hover:shadow-md"} bg-white p-6 sm:p-8 transition-all duration-200 hover:-translate-y-1`}>
                  {course.popular && <div className="absolute -top-3 right-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">{cms.Text_Most_Popular_38}</div>}

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${course.levelColor || "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {typeof course.level === "object" ? course.level?.name : (course.level || "Accredited")}
                      </span>
                      {course.body ? (
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Award size={13} className="text-gray-400" />
                          {course.body}
                        </span>
                      ) : null}
                    </div>

                    {(course.batch || course.referenceName || course.startDate) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-100 text-blue-800 text-xs font-semibold">
                        <Calendar size={13} className="text-blue-600 shrink-0" />
                        <span>
                          {course.batch || course.referenceName ? `${course.batch || course.referenceName}${course.startDate ? ` • ${new Date(course.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}` : ""}` : (course.startDate ? new Date(course.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "")}
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 leading-snug hover:text-blue-600 transition-colors">
                      <Link href={detailsUrl}>{course.title}</Link>
                    </h3>

                    {course.description ? (
                      /<[a-z][\s\S]*>/i.test(course.description) ? (
                        <div
                          className="text-gray-600 text-sm leading-relaxed line-clamp-3 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: course.description }}
                        />
                      ) : (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{course.description}</p>
                      )
                    ) : null}

                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-blue-500 shrink-0" />
                        <span>{course.duration || "Flexible"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-orange-500 shrink-0" />
                        <span>{course.location || course.modeLabel || course.mode || cms.Text_Online___UK_Centre_39}</span>
                      </div>
                    </div>

                    {Array.isArray(course.highlights) && course.highlights.length > 0 && (
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{cms.Description_Key_Highlights__40}</p>
                        {course.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check size={14} className="text-emerald-500 shrink-0" />
                            <span>{typeof h === "object" ? h.value : h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">{cms.Description_Fee_41}</p>
                      <p className="text-2xl font-extrabold text-gray-900">{displayPrice}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRegClosed ? (
                        <button type="button" disabled className="px-4 py-2.5 bg-gray-200 text-gray-400 text-xs font-semibold rounded-lg cursor-not-allowed">
                          Closed
                        </button>
                      ) : regUrl ? (
                        <Link href={regUrl} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                          {cms.Text_Enrol_Now_42 || "Enrol Now"}
                        </Link>
                      ) : (
                        <Link href="/contact-us" className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                          Enquire
                        </Link>
                      )}
                      <Link href={detailsUrl} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors" aria-label={`View details for ${course.title}`}>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href={cms.href__courses_43} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold shadow-xs transition-colors">
            <span>{cms.Text_View_All_Qualifications___Courses_44}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 3) && <section className="bg-slate-900 text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Layers size={13} />
              <span>{cms.Text_Career_Progression_Ladder_45}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{cms.Heading_Regulated_Qualifications_Framework__RQF__Pathway_46}</h2>
            <p className="text-gray-300 text-base sm:text-lg">{cms.Description_Structured_stepping_stones_from_foundational_saf_47}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PATHWAYS.map((p, idx) => <div key={idx} className="relative rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between hover:bg-white/10 transition-all duration-200">
                <div className="space-y-4">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg bg-linear-to-r ${p.color} text-white font-bold text-xs`}>
                    {p.level}
                  </div>
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <div className="space-y-2 text-xs text-gray-300">
                    <p>
                      <strong className="text-white">{cms.Text_Target_Audience__48}</strong> {p.target}
                    </p>
                    <p>
                      <strong className="text-white">{cms.Text_Key_Outcome__49}</strong> {p.outcome}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <Link href={`/courses?level=${p.level.toLowerCase().replace(" ", "-")}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300">
                    <span>{cms.Text_Browse_50}{p.level}{cms.Text_Courses_51}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>)}
          </div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 4) && <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-100">
            <ShieldCheck size={13} />
            <span>{cms.Text_The_Ababeel_Advantage_52}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{cms.Heading_Why_Professionals___Organisations_Choose_Ababeel_53}</h2>
          <p className="text-gray-600 text-base sm:text-lg">{cms.Description_We_deliver_flexible__rigorous_vocational_qualifi_54}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FileCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{cms.Heading_100__Portfolio_Assessment_55}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{cms.Description_No_stressful_written_exams_for_NVQs__Demonstrate_56}</p>
          </div>

          <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{cms.Heading_Dedicated_1_on_1_Assessors_57}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{cms.Description_Every_candidate_is_paired_with_a_qualified__high_58}</p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{cms.Heading_Fast_Track_Verification_59}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{cms.Description_Expedited_internal_verification_and_rapid_certif_60}</p>
          </div>

          <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{cms.Heading_Corporate___Group_Invoicing_61}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{cms.Description_Full_support_for_corporate_purchase_orders__empl_62}</p>
          </div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 5) && <section className="bg-gray-50 border-t border-gray-200 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              <Star size={13} className="text-emerald-600" />
              <span>{cms.Text_Candidate_Reviews_63}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{cms.Heading_Trusted_by_Health___Safety_Leaders_64}</h2>
            <p className="text-gray-600 text-base">{cms.Description_See_what_our_certified_professionals_say_about_t_65}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({
                  length: t.rating
                }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">{cms.Description___66}{t.quote}{cms.Description___67}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                    <p className="text-xs text-gray-500">
                      {t.role}{cms.Description___68}<span className="text-blue-600 font-medium">{t.company}</span>
                    </p>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 6) && <FAQ />}

      {}
      {(cmsProps.section == null || cmsProps.section === 7) && <section className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{cms.Heading_Ready_to_Achieve_Your_Regulated_Qualification__69}</h2>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">{cms.Description_Enrol_online_today_or_speak_with_an_academic_adv_70}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href={cms.href__registration_71} className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 transition-all duration-200">{cms.Text_Enrol_Online_Now_72}</Link>
            <Link href={cms.href__contact_us_73} className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 backdrop-blur-sm transition-colors">{cms.Text_Contact_Training_Team_74}</Link>
          </div>
        </div>
      </section>}
    </div>;
}
