"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CmsPageContent from "@/Components/cms/CmsPageContent";
import FAQ from "@/Components/FAQ";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Star,
  Users,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  Check,
  FileCheck,
  Layers,
  MapPin,
} from "lucide-react";
import webData from "@/constants";

const FEATURED_COURSES = [
  {
    id: "nvq-level-6-diploma-occupational-health-safety-practice",
    title: "NVQ Level 6 Diploma in Occupational Health and Safety Practice",
    level: "Level 6 (Degree Equiv.)",
    levelColor: "bg-teal-50 text-teal-700 border-teal-200",
    body: "ProQual Awarding Body",
    duration: "6 - 9 Months (Portfolio)",
    price: "£1,450",
    slug: "nvq-level-6-diploma-occupational-health-safety-practice",
    description:
      "The premier competence-based vocational qualification for health & safety practitioners seeking GradIOSH & CMIOSH chartered status.",
    highlights: [
      "100% Portfolio — No Written Exams",
      "Direct Pathway to GradIOSH / CMIOSH",
      "Dedicated 1-on-1 UK Assessor",
      "Flexible Distance Learning",
    ],
    popular: true,
  },
  {
    id: "level-7-diploma-strategic-management-leadership",
    title: "Level 7 Diploma in Strategic Management and Leadership",
    level: "Level 7 (Master's Equiv.)",
    levelColor: "bg-amber-50 text-amber-800 border-amber-200",
    body: "Qualifi Qualifications",
    duration: "6 - 12 Months",
    price: "£1,850",
    slug: "level-7-diploma-strategic-management-leadership",
    description:
      "Postgraduate executive diploma providing 120 credits with advanced progression to UK University MBA Top-Up dissertation stage.",
    highlights: [
      "120 Postgraduate Credits",
      "Direct UK MBA Top-Up Progression",
      "Strategic Governance & Leadership",
      "Executive Case-Study Learning",
    ],
    popular: false,
  },
  {
    id: "level-3-award-emergency-first-aid-at-work",
    title: "Level 3 Award in Emergency First Aid at Work (RQF)",
    level: "Level 3 (Intermediate)",
    levelColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    body: "Highfield Qualifications",
    duration: "1 Day (6 Hours)",
    price: "£175",
    slug: "level-3-award-emergency-first-aid-at-work",
    description:
      "HSE-compliant one-day regulated practical qualification equipping workplace first aiders with CPR, AED, and emergency trauma skills.",
    highlights: [
      "HSE & Resuscitation Council Compliant",
      "Valid for 3 Years Across UK",
      "Hands-On CPR & AED Practical Training",
      "Immediate Digital Certification",
    ],
    popular: false,
  },
];

const AWARDING_BODIES_LIST = [
  { name: "ProQual Awarding Body", type: "Ofqual Regulated", logo: "🛡️" },
  { name: "Focus Awards", type: "Ofqual Regulated", logo: "🏆" },
  { name: "Qualifi", type: "UK Recognized", logo: "🎓" },
  { name: "Highfield Qualifications", type: "Ofqual Regulated", logo: "⭐" },
  { name: "OTHM Qualifications", type: "UK Regulated", logo: "📜" },
];

const PATHWAYS = [
  {
    level: "Level 2",
    title: "Foundation & Safety Awareness",
    target: "Entry-level staff, operatives, and newly appointed safety marshals.",
    outcome: "Basic hazard identification, risk assessment, and legal workplace safety duties.",
    color: "from-sky-500 to-blue-600",
  },
  {
    level: "Level 3",
    title: "Supervisory & Intermediate Practice",
    target: "Site supervisors, team leaders, and designated first aid officers.",
    outcome: "Accident investigation, compliance auditing, and emergency workplace response.",
    color: "from-blue-600 to-indigo-600",
  },
  {
    level: "Level 6",
    title: "Bachelor Equivalent NVQ Diploma",
    target: "Safety managers, advisors, and corporate compliance leads.",
    outcome: "GradIOSH / CMIOSH chartered eligibility, policy formulation, and senior safety leadership.",
    color: "from-teal-600 to-emerald-700",
  },
  {
    level: "Level 7",
    title: "Postgraduate & Executive Strategic Diploma",
    target: "Directors, executives, and senior heads of department.",
    outcome: "UK MBA Top-Up entry, corporate governance, and enterprise strategic leadership.",
    color: "from-amber-600 to-orange-700",
  },
];

const TESTIMONIALS = [
  {
    name: "David Harrison",
    role: "Health & Safety Director",
    company: "Apex Construction Group Ltd",
    quote:
      "Completing the NVQ Level 6 with Ababeel was seamless. My dedicated assessor provided prompt, thorough feedback on each portfolio module. I attained GradIOSH within 7 months.",
    rating: 5,
    initials: "DH",
  },
  {
    name: "Ayesha Malik",
    role: "Senior Operations Lead",
    company: "Global Logistics UK",
    quote:
      "The Level 7 Strategic Management diploma gave me the executive toolkit needed for board-level leadership. The progression pathway to an MBA top-up was straightforward and valuable.",
    rating: 5,
    initials: "AM",
  },
  {
    name: "Michael Davies",
    role: "Workplace Safety Officer",
    company: "Vanguard Manufacturing",
    quote:
      "Excellent customer support and transparent assessment process. The online portal made evidence uploading easy, and the certification arrived quickly upon internal verification.",
    rating: 5,
    initials: "MD",
  },
];

const HomePageInner = () => {
  return (
    <div className="w-full bg-white text-gray-900 selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#0b1526] via-[#0f203c] to-[#0b1526] text-white pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading, Value Prop, CTAs */}
            <div className="lg:col-span-7 text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs md:text-sm font-medium backdrop-blur-sm"
              >
                <Sparkles size={15} className="text-orange-400" />
                <span>UK Regulated Qualifications & Professional Development</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
              >
                Accredited Qualifications Built for{" "}
                <span className="bg-linear-to-r from-blue-400 via-sky-300 to-orange-400 bg-clip-text text-transparent">
                  Real-World Competence
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed font-normal"
              >
                Earn Ofqual-regulated NVQ Level 2 to Level 7 qualifications and advance towards GradIOSH, CMIOSH, and UK MBA top-ups with flexible portfolio assessment and 1-on-1 UK tutor mentoring.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <BookOpen size={18} />
                  <span>Browse Courses</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/registration"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <GraduationCap size={18} className="text-orange-400" />
                  <span>Register Online</span>
                </Link>

                <Link
                  href="/schedule"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <Calendar size={18} className="text-blue-400" />
                  <span>View Schedule</span>
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10"
              >
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">50k+</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Certified Candidates</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">99.4%</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">First-Time Pass Rate</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-orange-400">100%</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Portfolio NVQ Option</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Ofqual</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Regulated Bodies</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Interactive Highlights Card */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative rounded-2xl bg-white/5 border border-white/15 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 text-left"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">Accredited Standards</h3>
                      <p className="text-xs text-gray-400">Approved UK Assessment Centre</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Enrolment
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">IOSH Membership Recognition</h4>
                      <p className="text-xs text-gray-300 mt-0.5">
                        NVQ Level 6 graduates are eligible for Graduate (GradIOSH) and Chartered (CMIOSH) membership.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={18} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">No Formal Written Exams</h4>
                      <p className="text-xs text-gray-300 mt-0.5">
                        NVQ competence qualifications are assessed through authentic workplace evidence and portfolios.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">Flexible Intake & Invoicing</h4>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Monthly enrolment intakes, corporate purchase order support, and zero-interest instalment plans.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/courses/nvq-level-6-diploma-occupational-health-safety-practice"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
                  >
                    <span>Featured: NVQ Level 6 Diploma</span>
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Awarding Bodies Ribbon */}
      <section className="bg-gray-50 border-b border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">
            Recognised & Regulated By Leading UK Awarding Organisations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14">
            {AWARDING_BODIES_LIST.map((body, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200/80 shadow-xs hover:shadow-sm transition-shadow"
              >
                <span className="text-xl">{body.logo}</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">{body.name}</p>
                  <p className="text-[10px] text-blue-600 font-medium">{body.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Grid Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            <BookOpen size={13} />
            <span>Featured Qualifications</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Popular Professional Qualifications
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Choose from industry-standard vocational certificates, NVQ diplomas, and executive management pathways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURED_COURSES.map((course) => (
            <div
              key={course.id}
              className={`relative flex flex-col justify-between rounded-2xl border ${
                course.popular
                  ? "border-blue-600 ring-2 ring-blue-600/20 shadow-xl"
                  : "border-gray-200 shadow-sm hover:shadow-md"
              } bg-white p-6 sm:p-8 transition-all duration-200 hover:-translate-y-1`}
            >
              {course.popular && (
                <div className="absolute -top-3 right-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${course.levelColor}`}>
                    {course.level}
                  </span>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <Award size={13} className="text-gray-400" />
                    {course.body}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 leading-snug hover:text-blue-600 transition-colors">
                  <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock size={14} className="text-blue-500" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin size={14} className="text-orange-500" />
                    <span>Online / UK Centre</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Key Highlights:</p>
                  {course.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Fee</p>
                  <p className="text-2xl font-extrabold text-gray-900">{course.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/registration?course=${course.slug}`}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Enrol Now
                  </Link>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                    aria-label={`View details for ${course.title}`}
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold shadow-xs transition-colors"
          >
            <span>View All Qualifications & Courses</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Qualifications Pathway Ladder */}
      <section className="bg-slate-900 text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Layers size={13} />
              <span>Career Progression Ladder</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Regulated Qualifications Framework (RQF) Pathways
            </h2>
            <p className="text-gray-300 text-base sm:text-lg">
              Structured stepping stones from foundational safety competence to chartered director status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PATHWAYS.map((p, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between hover:bg-white/10 transition-all duration-200"
              >
                <div className="space-y-4">
                  <div
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-lg bg-linear-to-r ${p.color} text-white font-bold text-xs`}
                  >
                    {p.level}
                  </div>
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <div className="space-y-2 text-xs text-gray-300">
                    <p>
                      <strong className="text-white">Target Audience:</strong> {p.target}
                    </p>
                    <p>
                      <strong className="text-white">Key Outcome:</strong> {p.outcome}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <Link
                    href={`/courses?level=${p.level.toLowerCase().replace(" ", "-")}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <span>Browse {p.level} Courses</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Ababeel (Key USPs) */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-100">
            <ShieldCheck size={13} />
            <span>The Ababeel Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Why Professionals & Organisations Choose Ababeel
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            We deliver flexible, rigorous vocational qualifications tailored for working practitioners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FileCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">100% Portfolio Assessment</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              No stressful written exams for NVQs. Demonstrate your competence through real workplace documentation and evidence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Dedicated 1-on-1 Assessors</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every candidate is paired with a qualified, highly experienced UK occupational safety assessor for continuous guidance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Fast-Track Verification</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Expedited internal verification and rapid certificate claim processing through our direct awarding body integrations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 text-left space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Corporate & Group Invoicing</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Full support for corporate purchase orders, employer billing, candidate tracking, and approved training centre (ATC) partnerships.
            </p>
          </div>
        </div>
      </section>

      {/* Candidate Testimonials */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              <Star size={13} className="text-emerald-600" />
              <span>Candidate Reviews</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Trusted by Health & Safety Leaders
            </h2>
            <p className="text-gray-600 text-base">
              See what our certified professionals say about their qualification journey with Ababeel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">"{t.quote}"</p>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                    <p className="text-xs text-gray-500">
                      {t.role} • <span className="text-blue-600 font-medium">{t.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* High-Impact Bottom Call to Action */}
      <section className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Achieve Your Regulated Qualification?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Enrol online today or speak with an academic advisor to discuss your prior experience, portfolio requirements, and corporate group discounts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/registration"
              className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 transition-all duration-200"
            >
              Enrol Online Now
            </Link>
            <Link
              href="/contact-us"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 backdrop-blur-sm transition-colors"
            >
              Contact Training Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const HomePage = () => (
  <CmsPageContent pageKey="home">
    <HomePageInner />
  </CmsPageContent>
);

export default HomePage;
