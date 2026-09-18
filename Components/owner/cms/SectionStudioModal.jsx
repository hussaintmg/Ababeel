"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Sliders,
  Palette,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Laptop,
  Tablet,
  Smartphone,
  X,
  Copy,
  Wand2,
  HelpCircle,
  ChevronDown,
  Layers,
  Save,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import PreviewFrame from "@/Components/owner/cms/PreviewFrame";
import SdkCustomBlock from "@/Components/cms/SdkCustomBlock";
import { saveSdkCustomTemplate } from "@/Components/cms/customTemplates";
import { toast } from "react-toastify";
import { generateTemplatePrompt } from "@/lib/cms/promptGenerator";
import { validateTemplate } from "@/lib/cms/templateValidator";

/* ---------------- Master Prompt for AI Code Agents ---------------- */
export const AI_CUSTOM_SECTION_PROMPT = `You are an expert React / Tailwind CSS / Web Component developer creating custom section templates for the Ababeel CMS Section Code Studio (SDK).

Please generate a high-converting, visually stunning section according to the user's specification.

### OUTPUT SPECIFICATION:
Respond with a valid JSON object adhering to this exact schema (enclosed in a \`\`\`json markdown code block):

\`\`\`json
{
  "name": "Section Name",
  "category": "Hero Sections | Features | Stats | Testimonials | CTA | Pricing | Courses | Forms",
  "description": "Clear 1-2 sentence description of what this section displays.",
  "options": {
    "enableFramerMotion": true,
    "enableGsap": false,
    "enableTailwind": true,
    "googleFont": "Outfit"
  },
  "fields": [
    // Dynamic fields editable from CMS sidebar
    { "key": "badgeText", "label": "Badge Text", "type": "text", "default": "Accredited Training" },
    { "key": "heading", "label": "Main Heading", "type": "text", "default": "Elevate Your Career Standards" },
    { "key": "subheading", "label": "Subtitle", "type": "textarea", "default": "Internationally recognized qualifications tailored for professionals." },
    { "key": "buttonText", "label": "Button Text", "type": "text", "default": "Explore Courses" },
    { "key": "buttonUrl", "label": "Button URL", "type": "text", "default": "/courses" },
    { "key": "accentColor", "label": "Accent Color", "type": "color", "default": "#0284c7" }
  ],
  "css": "/* Scoped CSS styling (optional) */\\n.glow-effect { filter: drop-shadow(0 0 20px rgba(2, 132, 199, 0.3)); }\\n",
  "code": "// React 19 JSX Component\\n// In scope: React, useState, useEffect, useRef, motion, AnimatePresence, Lucide icons (Sparkles, ArrowRight, Shield, CheckCircle, Award, Star, etc.), toast, props, data\\nreturn (\\n  <section className=\\"relative overflow-hidden bg-slate-950 py-20 px-4 sm:px-6 lg:px-8 text-white\\">\\n    <div className=\\"max-w-6xl mx-auto text-center\\">\\n      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className=\\"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-6\\">\\n        <Sparkles size={14} />\\n        <span>{props.badgeText}</span>\\n      </motion.div>\\n      <h2 className=\\"text-3xl sm:text-5xl font-bold tracking-tight mb-4\\">{props.heading}</h2>\\n      <p className=\\"text-slate-300 max-w-2xl mx-auto text-base sm:text-lg mb-8\\">{props.subheading}</p>\\n      <a href={props.buttonUrl} className=\\"inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all shadow-lg hover:shadow-sky-500/25\\">\\n        <span>{props.buttonText}</span>\\n        <ArrowRight size={16} />\\n      </a>\\n    </div>\\n  </section>\\n);"
}
\`\`\`

### CRITICAL RULES:
1. ALL dynamic/customizable text, URLs, colors, and images MUST be accessed through \`props.<key>\` (e.g. \`props.heading\`, \`props.buttonUrl\`).
2. Every \`props.<key>\` referenced in the code MUST have a corresponding entry in the \`fields\` array so users can edit it from the CMS sidebar. Supported field types: \`text\`, \`textarea\`, \`color\`, \`image\`, \`boolean\`, \`link\`, \`select\`.
3. All Lucide React icon components (e.g. \`<Sparkles />\`, \`<ArrowRight />\`, \`<Shield />\`, \`<CheckCircle />\`, \`<Award />\`, \`<Star />\`, \`<Phone />\`, \`<Mail />\`, etc.) are directly in scope!
4. Framer Motion (\`motion.div\`, \`motion.h1\`, \`AnimatePresence\`) and standard React hooks (\`useState\`, \`useEffect\`, \`useRef\`) work natively.
5. Use modern Tailwind CSS classes for responsive layouts, flex, grid, gradients, and shadows.
6. Return a valid JSX element: either \`return (<section ...>...</section>);\` or \`export default function Section(props) { return ... }\`.

Please generate a custom section for:
[DESCRIBE YOUR SECTION OR REQUIREMENT HERE]`;

/* ---------------- Pre-designed SDK Starter Presets ---------------- */
export const STARTER_PRESETS = [
  {
    id: "framer_hero",
    name: "Animated Hero with Framer Motion & Glow",
    category: "Hero Sections",
    description: "High-impact hero section with staggered entrance animations, floating badge, and gradient glow.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Outfit",
    },
    fields: [
      { key: "badgeText", label: "Eyebrow Badge", type: "text", default: "UK Regulated Safety Qualifications" },
      { key: "heading", label: "Main Headline", type: "text", default: "Empower Your Career with World-Class Safety Training" },
      { key: "subheading", label: "Description", type: "textarea", default: "Accredited highfield, IOSH, and NEBOSH certifications tailored for global industry leaders." },
      { key: "primaryBtnText", label: "Primary Button Text", type: "text", default: "Explore Courses" },
      { key: "primaryBtnUrl", label: "Primary Button URL", type: "text", default: "/courses" },
      { key: "secondaryBtnText", label: "Secondary Button Text", type: "text", default: "Download Syllabus" },
      { key: "secondaryBtnUrl", label: "Secondary Button URL", type: "text", default: "#syllabus" },
      { key: "accentColor", label: "Accent Color", type: "color", default: "#0284c7" },
    ],
    css: `
.glow-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.45;
}
.animated-border {
  background: linear-gradient(135deg, rgba(2,132,199,0.3), rgba(99,102,241,0.1));
}
`,
    code: `// React, motion, AnimatePresence, icons, toast are in scope!
return (
  <section className="relative overflow-hidden bg-slate-950 py-20 px-4 sm:px-6 lg:px-8 text-white">
    {/* Ambient Glows */}
    <div className="glow-orb w-72 h-72 bg-sky-500 top-0 left-1/4 -translate-y-1/2" />
    <div className="glow-orb w-80 h-80 bg-indigo-600 bottom-0 right-1/4 translate-y-1/3" />

    <div className="relative max-w-5xl mx-auto text-center">
      {/* Eyebrow Badge with Motion */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-300 text-xs font-semibold mb-6 shadow-inner"
      >
        <Sparkles size={14} className="text-sky-400 animate-pulse" />
        <span>{props.badgeText || "Accredited Training"}</span>
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
        style={{ fontFamily: "var(--sdk-font, inherit)" }}
      >
        <span className="block">{props.heading || "Your Headline Here"}</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
      >
        {props.subheading || "Your description text here."}
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <a
          href={props.primaryBtnUrl || "#"}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 transition-all"
        >
          <span>{props.primaryBtnText || "Get Started"}</span>
          <ArrowRight size={16} />
        </a>
        <a
          href={props.secondaryBtnUrl || "#"}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all hover:border-slate-600"
        >
          <span>{props.secondaryBtnText || "Learn More"}</span>
        </a>
      </motion.div>
    </div>
  </section>
);`,
  },
  {
    id: "gsap_features",
    name: "GSAP Floating Cards & Micro-interactions",
    category: "Features",
    description: "Interactive 3-column card grid with GSAP hover tweens, custom icons, and glowing glassmorphism.",
    options: {
      enableFramerMotion: true,
      enableGsap: true,
      googleFont: "Plus Jakarta Sans",
    },
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", default: "Why Choose Ababeel?" },
      { key: "sectionSubtitle", label: "Subtitle", type: "text", default: "Industry benchmarks in health, safety, and environmental education." },
      { key: "card1Title", label: "Card 1 Title", type: "text", default: "UK Accredited" },
      { key: "card1Desc", label: "Card 1 Description", type: "textarea", default: "Direct accreditation from globally respected awarding bodies." },
      { key: "card2Title", label: "Card 2 Title", type: "text", default: "Hands-on Practical" },
      { key: "card2Desc", label: "Card 2 Description", type: "textarea", default: "Real workplace scenario simulations and certified assessments." },
      { key: "card3Title", label: "Card 3 Title", type: "text", default: "Career Advancement" },
      { key: "card3Desc", label: "Card 3 Description", type: "textarea", default: "Recognized certificates trusted by multinational employers." },
    ],
    css: `
.card-hover-box {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}
.card-hover-box:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 30px -10px rgba(14, 165, 233, 0.15);
}
`,
    code: `// GSAP and Lucide icons are accessible here!
const gridRef = useRef(null);

useEffect(() => {
  if (window.gsap && gridRef.current) {
    window.gsap.fromTo(
      gridRef.current.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: "power2.out" }
    );
  }
}, []);

const items = [
  { title: props.card1Title, desc: props.card1Desc, icon: Shield, color: "text-blue-600 bg-blue-50" },
  { title: props.card2Title, desc: props.card2Desc, icon: Award, color: "text-emerald-600 bg-emerald-50" },
  { title: props.card3Title, desc: props.card3Desc, icon: CheckCircle, color: "text-purple-600 bg-purple-50" },
];

return (
  <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {props.sectionTitle || "Our Key Strengths"}
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base">
          {props.sectionSubtitle}
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="card-hover-box rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className={\`w-12 h-12 rounded-xl flex items-center justify-center mb-4 \${item.color}\`}>
                  <IconComp size={24} />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-sky-600 gap-1 hover:gap-2 transition-all">
                <span>Learn details</span>
                <ArrowRight size={13} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);`,
  },
  {
    id: "interactive_inquiry",
    name: "Interactive Course Inquiry Form (API + Toasts)",
    category: "Forms & CTA",
    description: "Complete interactive lead form with state handling, live validation, and toast notifications.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Outfit",
    },
    fields: [
      { key: "formHeading", label: "Form Title", type: "text", default: "Request a Course Consultation" },
      { key: "formSubtext", label: "Form Subtext", type: "text", default: "Speak with our safety advisors to choose the right certificate." },
      { key: "submitBtnText", label: "Button Label", type: "text", default: "Submit Inquiry" },
      { key: "targetCourse", label: "Default Course", type: "text", default: "Level 3 International Safety" },
    ],
    css: `
.input-field {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5e1;
  outline: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}
.input-field:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}
`,
    code: `// State and API calls operate smoothly in this sandbox!
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [submitted, setSubmitted] = useState(false);
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!name.trim() || !email.trim()) {
    if (window.toast) toast.error("Please fill in your name and email.");
    return;
  }
  setSubmitting(true);
  try {
    // Simulated API call or real endpoint
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    if (window.toast) toast.success("Thank you! Our advisor will contact you shortly.");
  } catch (err) {
    if (window.toast) toast.error("Submission failed. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

return (
  <section className="py-16 px-4 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white">
    <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
      <h3 className="text-2xl font-bold text-white mb-2 text-center">
        {props.formHeading || "Get in Touch"}
      </h3>
      <p className="text-sm text-sky-200 mb-6 text-center">
        {props.formSubtext}
      </p>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h4 className="text-lg font-bold text-white mb-1">Inquiry Sent!</h4>
          <p className="text-xs text-slate-300">We will respond within 24 hours.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold"
          >
            Send another inquiry
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="input-field bg-white/90 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="input-field bg-white/90 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 20 1234 5678"
              className="input-field bg-white/90 text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? "Sending..." : props.submitBtnText || "Submit"}
          </button>
        </form>
      )}
    </div>
  </section>
);`,
  },
  {
    id: "bento_showcase",
    name: "Modern Bento Grid Feature Showcase",
    category: "Features",
    description: "Asymmetrical 4-card bento grid with glowing borders, stats pills, and micro-hover animations.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Outfit",
    },
    fields: [
      { key: "eyebrowBadge", label: "Eyebrow Badge", type: "text", default: "Why Professionals Choose Us" },
      { key: "mainHeading", label: "Main Headline", type: "text", default: "Industry-Leading Safety Standards" },
      { key: "subHeading", label: "Section Subtitle", type: "textarea", default: "Accredited credentials, flexible study modes, and guaranteed career advancement across the UK and worldwide." },
      { key: "card1Title", label: "Hero Card Title", type: "text", default: "Ofqual Regulated Qualifications" },
      { key: "card1Desc", label: "Hero Card Description", type: "textarea", default: "Gain Level 2 to Level 7 NVQ qualifications recognized by top tier construction and engineering employers." },
      { key: "card2Stat", label: "Card 2 Stat Number", type: "text", default: "98.7%" },
      { key: "card2Label", label: "Card 2 Stat Label", type: "text", default: "First-time pass rate across all accredited modules" },
      { key: "card3Title", label: "Card 3 Title", type: "text", default: "Flexible Remote & On-Site Study" },
      { key: "card3Desc", label: "Card 3 Description", type: "textarea", default: "Study at your own pace with dedicated 1-on-1 tutor feedback." },
      { key: "card4Title", label: "Card 4 Title", type: "text", default: "Verified Digital Credentials" },
      { key: "card4Desc", label: "Card 4 Description", type: "textarea", default: "Instant QR certificate verification for contractors and employers." },
    ],
    css: `
.bento-card {
  position: relative;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 35px -10px rgba(2, 132, 199, 0.18);
}
.bento-gradient-border {
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.05));
}
`,
    code: `// Bento Grid Showcase with Framer Motion and Lucide icons
return (
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white relative overflow-hidden">
    {/* Subtle backdrop glow */}
    <div className="absolute top-1/3 -left-32 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-10 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

    <div className="max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/25 text-sky-400 text-xs font-semibold mb-4 shadow-sm">
          <Sparkles size={14} />
          <span>{props.eyebrowBadge || "Excellence in Training"}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
          {props.mainHeading || "Built for Real-World Competence"}
        </h2>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          {props.subHeading}
        </p>
      </div>

      {/* Asymmetric 4-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Card (Spans 2 cols) */}
        <div className="md:col-span-2 bento-card bento-gradient-border rounded-3xl p-8 border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-6">
              <Award size={26} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Accredited Pathway</span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
              {props.card1Title}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              {props.card1Desc}
            </p>
          </div>
          <div className="mt-8 flex items-center gap-3 pt-6 border-t border-white/10">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs text-slate-400 font-medium">Ofqual Regulated • ProQual • Highfield Approved</span>
          </div>
        </div>

        {/* Stats Card (1 col) */}
        <div className="bento-card rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-sky-600/20 to-slate-900/80 backdrop-blur-xl flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4">
            <TrendingUp size={26} />
          </div>
          <div>
            <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-300 tracking-tight">
              {props.card2Stat || "98.7%"}
            </div>
            <p className="text-sm font-medium text-slate-300 mt-3 leading-snug">
              {props.card2Label}
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs text-sky-400 font-semibold gap-1">
            <CheckCircle size={14} />
            <span>Verified Candidate Success</span>
          </div>
        </div>

        {/* Card 3 (1 col) */}
        <div className="bento-card rounded-3xl p-8 border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-4">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{props.card3Title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{props.card3Desc}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-1 text-xs text-indigo-300 font-medium">
            <span>Learn online or in-person</span>
          </div>
        </div>

        {/* Card 4 (Spans 2 cols) */}
        <div className="md:col-span-2 bento-card rounded-3xl p-8 border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{props.card4Title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{props.card4Desc}</p>
          </div>
          <a
            href="/verify-certificate"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all whitespace-nowrap shadow-sm hover:scale-105"
          >
            <span>Verify Certificate</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  </section>
);`,
  },
  {
    id: "course_explorer",
    name: "Interactive Dynamic Course Explorer",
    category: "Courses & Cards",
    description: "Filterable course catalog with category tabs, live database bindings, price badges, and enroll buttons.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Outfit",
    },
    fields: [
      { key: "catalogBadge", label: "Catalog Badge", type: "text", default: "Available Programs" },
      { key: "catalogTitle", label: "Catalog Headline", type: "text", default: "Explore Regulated Qualifications" },
      { key: "catalogDesc", label: "Catalog Subtitle", type: "textarea", default: "Choose from our high-demand accredited safety and construction NVQ pathways." },
      { key: "primaryCtaText", label: "Card CTA Text", type: "text", default: "View Course & Syllabus" },
    ],
    css: `
.course-filter-btn.active {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
}
.course-card-hover {
  transition: all 0.25s ease;
}
.course-card-hover:hover {
  transform: translateY(-5px);
  border-color: #0284c7;
  box-shadow: 0 16px 30px -10px rgba(2, 132, 199, 0.12);
}
`,
    code: `// Dynamic data bindings + interactive category filtering
const [selectedCategory, setSelectedCategory] = useState("All");

// Read the explicitly selected preview or public data context
const courseList = Array.isArray(data?.courses) ? data.courses : Array.isArray(data?.courseRef) ? data.courseRef : [];

const categories = ["All", "Health & Safety", "Management", "First Aid"];

const filteredCourses = selectedCategory === "All"
  ? courseList
  : courseList.filter(c => (c.category || "").toLowerCase() === selectedCategory.toLowerCase());

return (
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider mb-3">
          {props.catalogBadge || "Accredited Catalogue"}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          {props.catalogTitle || "Featured Qualifications"}
        </h2>
        <p className="text-slate-600 text-base">
          {props.catalogDesc}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={\`px-4 py-2 rounded-full text-xs font-semibold transition-all border \${
              selectedCategory === cat
                ? "course-filter-btn active border-sky-600"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }\`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCourses.map((c, i) => (
          <div
            key={c._id || i}
            className="course-card-hover rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {c.referenceNumber || \`REF-00\${i+1}\`}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {c.mode || "Online"}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-3 leading-snug line-clamp-2">
                {c.courseName || c.title || "Course Qualification"}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-sky-500" />
                  {c.duration || "Self-paced"}
                </span>
                <span className="flex items-center gap-1">
                  <Award size={14} className="text-amber-500" />
                  Regulated
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Price</span>
                <span className="text-xl font-extrabold text-slate-900">{c.coursePrice || c.price || "£1,450"}</span>
              </div>
              <a
                href={c.slug ? \`/courses/\${c.slug}\` : "/courses"}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <span>{props.primaryCtaText || "Enroll"}</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);`,
  },
  {
    id: "glass_accordion_faq",
    name: "Interactive Animated FAQ Accordion",
    category: "FAQ & Content",
    description: "Sleek interactive FAQ with expandable question cards, Framer Motion smooth height animations, and support CTA.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Plus Jakarta Sans",
    },
    fields: [
      { key: "faqEyebrow", label: "Eyebrow Badge", type: "text", default: "Common Inquiries" },
      { key: "faqTitle", label: "FAQ Headline", type: "text", default: "Frequently Asked Questions" },
      { key: "faqSubtitle", label: "FAQ Subtitle", type: "textarea", default: "Everything you need to know about accredited certification and exam procedures." },
      { key: "q1", label: "Question 1", type: "text", default: "Are these qualifications recognized worldwide?" },
      { key: "a1", label: "Answer 1", type: "textarea", default: "Yes, all qualifications are regulated by Ofqual (UK) and accredited by bodies like ProQual and Highfield, recognized by multinational employers globally." },
      { key: "q2", label: "Question 2", type: "text", default: "How does the remote portfolio assessment work?" },
      { key: "a2", label: "Answer 2", type: "textarea", default: "You submit evidence of workplace competency via our digital portal, reviewed by accredited assessors who guide you 1-on-1 until completion." },
      { key: "q3", label: "Question 3", type: "text", default: "What payment options and installment plans are available?" },
      { key: "a3", label: "Answer 3", type: "textarea", default: "We provide flexible installment plans with 0% interest, corporate invoicing, and secure card payment via Stripe." },
    ],
    css: `
.faq-item-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.faq-item-card.open {
  border-color: #0284c7;
  box-shadow: 0 4px 20px rgba(2, 132, 199, 0.08);
}
`,
    code: `// Animated Accordion with state and Framer Motion AnimatePresence
const [openIdx, setOpenIdx] = useState(0);

const faqs = [
  { q: props.q1, a: props.a1 },
  { q: props.q2, a: props.a2 },
  { q: props.q3, a: props.a3 },
];

return (
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-slate-900">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider mb-3">
          {props.faqEyebrow || "Help Center"}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          {props.faqTitle || "Questions & Answers"}
        </h2>
        <p className="text-slate-600 text-base max-w-xl mx-auto">
          {props.faqSubtitle}
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={\`faq-item-card rounded-2xl border bg-slate-50/50 p-6 transition-all \${
                isOpen ? "open bg-white border-sky-500/40" : "border-slate-200 hover:border-slate-300"
              }\`}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="w-full flex items-center justify-between text-left gap-4 font-semibold text-base sm:text-lg text-slate-900"
              >
                <span>{faq.q || "Question"}</span>
                <span className={\`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 transition-transform duration-300 \${
                  isOpen ? "rotate-180 bg-sky-100 text-sky-600" : ""
                }\`}>
                  <ChevronDown size={18} />
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="pt-4 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 mt-4">
                      {faq.a || "Answer details..."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);`,
  },
  {
    id: "trust_accreditation_vault",
    name: "Executive Accreditation & Trust Vault",
    category: "Trust & Proof",
    description: "Interactive 3D holographic accreditation showcase with live certificate authenticity lookup simulation, Ofqual/Highfield badge tilt effects, and real-time verification status.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Outfit",
    },
    fields: [
      { key: "vaultBadge", label: "Eyebrow Badge", type: "text", default: "UK Regulated Awarding Bodies" },
      { key: "vaultHeading", label: "Main Headline", type: "text", default: "Nationally Accredited & Globally Recognized" },
      { key: "vaultDesc", label: "Subtitle", type: "textarea", default: "Every certificate awarded by Ababeel is backed by UK Ofqual regulated frameworks, verifying your competency to Tier-1 employers." },
      { key: "certPlaceholder", label: "Search Placeholder", type: "text", default: "Enter Certificate ID (e.g. ABA-2026-9941)" },
      { key: "verifiedCount", label: "Total Certificates Issued", type: "text", default: "14,850+" },
      { key: "passRate", label: "First-Time Pass Rate", type: "text", default: "99.4%" },
    ],
    css: `
.vault-badge-card {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 30px -10px rgba(14, 165, 233, 0.1);
}
.vault-badge-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px -10px rgba(14, 165, 233, 0.25);
  border-color: rgba(56, 189, 248, 0.5);
}
.shield-glow {
  filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.4));
}
`,
    code: `// Live Certificate Lookup & Accreditation Vault
const [certQuery, setCertQuery] = useState("");
const [lookupState, setLookupState] = useState(null);

const handleVerify = (e) => {
  e.preventDefault();
  if (!certQuery.trim()) return;
  setLookupState("loading");
  setTimeout(() => {
    setLookupState("found");
  }, 600);
};

const accreditationBodies = [
  { name: "Ofqual Regulated", label: "UK Office of Qualifications", level: "RQF Level 1-7", icon: ShieldCheck, color: "text-sky-400" },
  { name: "Highfield Qualifications", label: "International Awarding Body", level: "HABC Approved", icon: Award, color: "text-amber-400" },
  { name: "ProQual AB", label: "NVQ Competence Standards", level: "Construction & EHS", icon: CheckCircle2, color: "text-emerald-400" },
  { name: "IOSH Accredited", label: "Institution of Occ. Safety", level: "Managing Safely", icon: Sparkles, color: "text-indigo-400" },
];

return (
  <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
          <Shield size={14} className="shield-glow" />
          <span>{props.vaultBadge || "Accreditation Guarantee"}</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          {props.vaultHeading || "Nationally Accredited & Globally Recognized"}
        </h2>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          {props.vaultDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {accreditationBodies.map((b, i) => {
          const IconComp = b.icon;
          return (
            <div
              key={i}
              className="vault-badge-card rounded-2xl p-6 bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4">
                  <IconComp size={24} className={b.color} />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">{b.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{b.label}</p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-sky-400 font-semibold">{b.level}</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <Check size={13} /> Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/30 backdrop-blur-xl shadow-2xl">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Instant Certificate Authenticity Check</h3>
          <p className="text-sm text-slate-300 mb-6">
            Employers & compliance officers can instantly verify any candidate credential in real time.
          </p>

          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={certQuery}
                onChange={(e) => setCertQuery(e.target.value)}
                placeholder={props.certPlaceholder || "Enter Certificate ID (e.g. ABA-2026-9941)"}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-sky-500/30 flex items-center justify-center gap-2"
            >
              {lookupState === "loading" ? (
                <span>Checking...</span>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>

          {lookupState === "found" && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Credential Verified: {certQuery || "ABA-2026-9941"}</span>
                  <span className="text-xs text-slate-300">Ofqual Regulated NVQ Level 6 Diploma in Occupational Health and Safety</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-400/20 text-emerald-300 font-mono text-xs font-bold">100% Genuine</span>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400">
            <div className="text-center">
              <span className="block text-xl font-bold text-white">{props.verifiedCount || "14,850+"}</span>
              <span>Credentials Verified</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-white">{props.passRate || "99.4%"}</span>
              <span>Pass Rate Standard</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-white">24 / 7</span>
              <span>Employer Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);`,
  },
  {
    id: "career_roi_calculator",
    name: "Interactive Career & Salary Pathway Calculator",
    category: "Calculators & Pathways",
    description: "Dynamic career progression and salary projection calculator for Safety & EHS professionals with interactive role selectors, salary growth charts, and instant enrollment triggers.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Plus Jakarta Sans",
    },
    fields: [
      { key: "calcBadge", label: "Eyebrow Badge", type: "text", default: "EHS Career Progression" },
      { key: "calcHeading", label: "Main Headline", type: "text", default: "Calculate Your Career & Salary Potential" },
      { key: "calcDesc", label: "Subtitle", type: "textarea", default: "Select your career stage to see the recognized qualification pathway, expected UK salary uplift, and study timeline." },
      { key: "ctaButtonText", label: "CTA Button Text", type: "text", default: "Fast-Track My Qualification" },
      { key: "ctaButtonUrl", label: "CTA Button URL", type: "text", default: "/contact-us" },
    ],
    css: `
.role-pill {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.role-pill.active {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #ffffff;
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.3);
}
`,
    code: `// Career ROI Calculator Component
const [activeRoleIndex, setActiveRoleIndex] = useState(1);

const pathways = [
  {
    role: "Entry / Safety Officer",
    salary: "£32,000",
    uplift: "+25%",
    duration: "4 - 8 Weeks",
    qualification: "NVQ Level 3 Certificate in Occupational Safety",
    suitableFor: "Graduates, Site Marshals, Junior Supervisors",
    badge: "Level 3 RQF",
  },
  {
    role: "Site Safety Manager",
    salary: "£55,000",
    uplift: "+45%",
    duration: "10 - 16 Weeks",
    qualification: "NVQ Level 6 Diploma in Occupational Health & Safety",
    suitableFor: "Senior Managers, HSE Advisors, Engineers",
    badge: "GradIOSH / Level 6",
  },
  {
    role: "Director of EHS / Head of Safety",
    salary: "£85,000+",
    uplift: "+75%",
    duration: "16 - 24 Weeks",
    qualification: "NVQ Level 7 Strategic Health & Safety Leadership",
    suitableFor: "Executives, Operations Directors, Global HSE Leads",
    badge: "CMIOSH / Level 7",
  },
];

const selected = pathways[activeRoleIndex] || pathways[0];

return (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
    <div className="max-w-5xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
          {props.calcBadge || "Career Projection"}
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          {props.calcHeading || "Calculate Your Career & Salary Potential"}
        </h2>
        <p className="text-slate-300 text-base sm:text-lg">
          {props.calcDesc}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {pathways.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setActiveRoleIndex(idx)}
            className={\`role-pill px-5 py-3 rounded-2xl font-semibold text-sm border flex items-center gap-2 \${
              activeRoleIndex === idx
                ? "active border-sky-400/60"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
            }\`}
          >
            <TrendingUp size={16} />
            <span>{p.role}</span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl p-8 sm:p-12 bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Award size={14} />
              <span>{selected.badge}</span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Career Milestone</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{selected.role}</h3>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Recommended Qualification:</span>
                <span className="font-semibold text-sky-400 text-right">{selected.qualification}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Typical Completion:</span>
                <span className="font-semibold text-white">{selected.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Target Audience:</span>
                <span className="font-semibold text-slate-300 text-right">{selected.suitableFor}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl p-6 bg-gradient-to-br from-blue-900/30 to-sky-900/20 border border-sky-500/30 text-center flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">Average UK Salary</span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-300 tracking-tight">
                {selected.salary}
              </div>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-bold">
                {selected.uplift} Estimated Career Uplift
              </span>
            </div>

            <div className="mt-8">
              <a
                href={props.ctaButtonUrl || "/contact-us"}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all"
              >
                <span>{props.ctaButtonText || "Get Qualification Plan"}</span>
                <ArrowRight size={16} />
              </a>
              <span className="block text-[11px] text-slate-400 mt-2">Zero commitment • Free 1-on-1 advisor consultation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);`,
  },
  {
    id: "course_comparison_matrix",
    name: "Dynamic Course Qualification Matrix",
    category: "Courses",
    description: "Side-by-side interactive comparison matrix pulling dynamic course data with study mode toggles (Online vs Classroom vs Blended), syllabus highlights, and direct enrollment buttons.",
    options: {
      enableFramerMotion: true,
      enableGsap: false,
      googleFont: "Outfit",
    },
    fields: [
      { key: "matrixEyebrow", label: "Eyebrow Badge", type: "text", default: "Direct Course Comparison" },
      { key: "matrixHeading", label: "Main Headline", type: "text", default: "Compare Leading NVQ & Safety Qualifications" },
      { key: "matrixSubtitle", label: "Subtitle", type: "textarea", default: "Find the exact credential matching your job role, experience level, and timeline." },
      { key: "enrollBtnText", label: "Button Label", type: "text", default: "View Course Details" },
    ],
    css: `
.matrix-row {
  transition: background-color 0.15s ease;
}
.matrix-row:hover {
  background-color: rgba(241, 245, 249, 0.6);
}
`,
    code: `// Dynamic Course Qualification Matrix
const [selectedMode, setSelectedMode] = useState("All");

const rawList = Array.isArray(data?.courses) ? data.courses : Array.isArray(data?.courseRef) ? data.courseRef : [];

const filtered = selectedMode === "All"
  ? rawList
  : rawList.filter(c => (c.mode || "").toLowerCase().includes(selectedMode.toLowerCase()));

return (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-slate-900">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider mb-3">
          {props.matrixEyebrow || "Comparison Guide"}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          {props.matrixHeading || "Compare Leading Safety Qualifications"}
        </h2>
        <p className="text-slate-600 text-base max-w-xl mx-auto">
          {props.matrixSubtitle}
        </p>

        <div className="mt-8 flex items-center justify-center gap-2">
          {["All", "Online", "Classroom"].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              className={\`px-4 py-2 rounded-xl text-xs font-semibold transition-all \${
                selectedMode === m
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }\`}
            >
              {m === "All" ? "All Formats" : m}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Qualification Title</th>
                <th className="py-4 px-4">Level / Framework</th>
                <th className="py-4 px-4">Study Mode</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-4">Pass Rate</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <tr key={idx} className="matrix-row">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    <div className="font-bold text-slate-900">{item.courseName || item.title || "Course"}</div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5">UK Ofqual Regulated</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200">
                      <Award size={12} />
                      {typeof item.level === "object" ? item.level?.name : (item.level || "RQF Standard")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {item.mode || "Online"}
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {item.duration || "Self-Paced"}
                  </td>
                  <td className="py-4 px-4 text-emerald-600 font-bold">
                    {item.passRate || "99%"}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-base font-extrabold text-slate-900">{item.coursePrice || item.price || "£950"}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <a
                      href={item.slug ? \`/courses/\${item.slug}\` : "/courses"}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
                    >
                      <span>Enroll</span>
                      <ArrowRight size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);`,
  },
];

/* ---------------- Lightweight Code Beautifier / Formatter ---------------- */
function formatCodeLocally(sourceCode) {
  if (!sourceCode) return "";
  try {
    const lines = sourceCode.split("\n");
    let indentLevel = 0;
    const formattedLines = [];

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        formattedLines.push("");
        continue;
      }

      // Closing braces/tags decrease indent before printing
      if (line.startsWith("}") || line.startsWith(")") || line.startsWith("</") || line.startsWith("]")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formattedLines.push("  ".repeat(indentLevel) + line);

      // Opening braces/tags increase indent for following lines
      const openMatches = (line.match(/\{|\(|\[|<[A-Za-z0-9]+/g) || []).length;
      const closeMatches = (line.match(/\}|\)|\]|<\/[A-Za-z0-9]+|\/>/g) || []).length;
      const netChange = openMatches - closeMatches;

      if (netChange > 0) {
        indentLevel += Math.min(netChange, 2);
      } else if (netChange < 0) {
        indentLevel = Math.max(0, indentLevel + netChange);
      }
    }

    return formattedLines.join("\n");
  } catch {
    return sourceCode;
  }
}

/* ---------------- Main Section Studio Modal Component ---------------- */
export default function SectionStudioModal({
  isOpen,
  onClose,
  initialSection = null,
  data = {},
  sampleMode = false,
  onSave,
  onInsert,
}) {
  // Form state
  const [sectionId, setSectionId] = useState("");
  const [name, setName] = useState("Custom Code Section");
  const [category, setCategory] = useState("Custom Sections");
  const [description, setDescription] = useState("Created in Section Code Studio (SDK)");
  const [code, setCode] = useState(STARTER_PRESETS[0].code);
  const [css, setCss] = useState(STARTER_PRESETS[0].css);
  const [fields, setFields] = useState(STARTER_PRESETS[0].fields);
  const [options, setOptions] = useState(STARTER_PRESETS[0].options);

  // Active sub-tab in left studio pane: 'code' | 'fields' | 'css' | 'options'
  const [activeTab, setActiveTab] = useState("code");

  // Device simulation for right sandbox preview: 'desktop' | 'tablet' | 'mobile'
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Live test values for fields inside the studio
  const [testValues, setTestValues] = useState({});
  const [showVariablesDrawer, setShowVariablesDrawer] = useState(false);

  // Saving / feedback status
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState("");

  // Initialize or load existing section if passed
  useEffect(() => {
    if (initialSection) {
      setSectionId(initialSection.sectionId || initialSection.id || `sdk_${Date.now()}`);
      setName(initialSection.name || initialSection.props?._name || "Custom Code Section");
      setCategory(initialSection.category || "Custom Sections");
      setDescription(initialSection.description || "Created in Section Code Studio");
      setCode(initialSection.code || initialSection.props?._code || STARTER_PRESETS[0].code);
      setCss(initialSection.css || initialSection.props?._css || "");
      const f = initialSection.fields || initialSection.props?._fields || [];
      setFields(Array.isArray(f) && f.length > 0 ? f : STARTER_PRESETS[0].fields);
      setOptions(initialSection.options || initialSection.props?._options || STARTER_PRESETS[0].options);

      // Pre-fill test values
      const initialProps = initialSection.props || initialSection.defaultProps || {};
      setTestValues(initialProps);
    } else {
      setSectionId(`sdk_sec_${Date.now().toString(36)}`);
      setName("My New Custom Section");
      setCode(STARTER_PRESETS[0].code);
      setCss(STARTER_PRESETS[0].css);
      setFields(STARTER_PRESETS[0].fields);
      setOptions(STARTER_PRESETS[0].options);

      // Default values from preset
      const defs = {};
      STARTER_PRESETS[0].fields.forEach((f) => {
        defs[f.key] = f.default || "";
      });
      setTestValues(defs);
    }
  }, [initialSection, isOpen]);

  // Load starter preset
  const handleLoadPreset = (presetId) => {
    const p = STARTER_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setCode(p.code);
    setCss(p.css);
    setFields(p.fields);
    setOptions(p.options);
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description);

    const defs = {};
    p.fields.forEach((f) => {
      defs[f.key] = f.default || "";
    });
    setTestValues(defs);
    toast.info(`Loaded "${p.name}" starter preset`);
  };

  // Prettier / local code format
  const handleFormatCode = () => {
    setCode((prev) => formatCodeLocally(prev));
    setCss((prev) => prev.trim());
    toast.success("Code formatted");
  };

  // Copy structured prompt for AI agents (ChatGPT, Claude, Gemini, Antigravity)
  const handleCopyAiPrompt = () => {
    const dynamicPrompt = generateTemplatePrompt({
      sectionType: name || "Custom Section",
      category: category || "Hero Sections",
      purpose: description || "Modern responsive section with customizable fields",
      selectedModel: "Course",
      expectedProps: fields,
    });

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(dynamicPrompt)
        .then(() => {
          setCopiedPrompt(true);
          setTimeout(() => setCopiedPrompt(false), 2500);
          toast.success("AI Prompt copied! Includes active fields, loop rules & SDK contracts.");
        })
        .catch(() => {
          toast.error("Failed to copy to clipboard automatically.");
        });
    } else {
      toast.info("Clipboard not accessible in current environment.");
    }
  };

  // Unpack an AI section JSON definition into Studio state
  const unpackSectionJson = (input) => {
    try {
      let parsed = typeof input === "object" && input !== null ? input : null;
      if (!parsed && typeof input === "string") {
        let raw = input.trim();
        const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) raw = match[1].trim();
        if (raw.startsWith("{")) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            const codeMatch = raw.match(/"code"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
            const nameMatch = raw.match(/"name"\s*:\s*"([^"]+)"/);
            if (codeMatch || nameMatch) {
              parsed = {
                name: nameMatch ? nameMatch[1] : undefined,
                code: codeMatch ? JSON.parse(`"${codeMatch[1]}"`) : undefined,
              };
            }
          }
        }
      }
      if (parsed && typeof parsed === "object" && (parsed.code || parsed.name || parsed.fields)) {
        if (parsed.name) setName(parsed.name);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.code) setCode(parsed.code);
        if (parsed.css) setCss(parsed.css);
        if (Array.isArray(parsed.fields)) setFields(parsed.fields);
        if (parsed.options) setOptions((prev) => ({ ...prev, ...(parsed.options || {}) }));

        const defs = {};
        (parsed.fields || []).forEach((f) => {
          defs[f.key] = f.default !== undefined ? f.default : "";
        });
        setTestValues(defs);
        return true;
      }
    } catch (err) {
      console.warn("unpackSectionJson error:", err);
    }
    return false;
  };

  // Import JSON generated by AI
  const handleImportAiJson = () => {
    if (!aiJsonInput.trim()) {
      toast.error("Please paste the AI-generated JSON first.");
      return;
    }
    try {
      let raw = aiJsonInput.trim();
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        raw = match[1].trim();
      }
      const parsed = JSON.parse(raw);
      if (!parsed.code && !parsed.name) {
        toast.error("Invalid format: expected 'name', 'code', or 'fields'.");
        return;
      }

      // Check validation warnings without crashing on harmless warnings
      try {
        const val = validateTemplate(parsed);
        if (val.warnings?.length) {
          toast.warn(`Import notice: ${val.warnings[0]}`);
        }
      } catch {}

      if (unpackSectionJson(parsed)) {
        setShowAiImportModal(false);
        setAiJsonInput("");
        toast.success(`Successfully loaded "${parsed.name || "Custom Section"}" into Studio!`);
      } else {
        toast.error("Failed to unpack template contents from JSON.");
      }
    } catch (e) {
      toast.error(`JSON Parse Error: ${e.message}`);
    }
  };

  // Auto-detect variables from code: scans for `props.XYZ` or `props['XYZ']`
  const handleAutoDetectVariables = () => {
    const propRegex = /props\.([a-zA-Z0-9_]+)|props\[['"]([a-zA-Z0-9_]+)['"]\]/g;
    const detected = new Set();
    let match;
    while ((match = propRegex.exec(code)) !== null) {
      const key = match[1] || match[2];
      if (key && !key.startsWith("_") && key !== "children") {
        detected.add(key);
      }
    }

    const existingKeys = new Set(fields.map((f) => f.key));
    const newFields = [...fields];
    let addedCount = 0;

    detected.forEach((k) => {
      if (!existingKeys.has(k)) {
        // Guess type from name
        let guessedType = "text";
        if (k.toLowerCase().includes("color")) guessedType = "color";
        else if (k.toLowerCase().includes("image") || k.toLowerCase().includes("img") || k.toLowerCase().includes("avatar")) guessedType = "image";
        else if (k.toLowerCase().includes("desc") || k.toLowerCase().includes("subheading") || k.toLowerCase().includes("body")) guessedType = "textarea";
        else if (k.toLowerCase().includes("enable") || k.toLowerCase().includes("show") || k.toLowerCase().includes("is")) guessedType = "boolean";

        newFields.push({
          key: k,
          label: k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
          type: guessedType,
          default: "",
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setFields(newFields);
      toast.success(`Discovered ${addedCount} new variable(s) from your code!`);
    } else {
      toast.info("All variables referenced in code are already listed.");
    }
  };

  // Add a blank variable field
  const handleAddField = () => {
    const nextIdx = fields.length + 1;
    setFields((prev) => [
      ...prev,
      {
        key: `variable_${nextIdx}`,
        label: `Variable ${nextIdx}`,
        type: "text",
        default: "",
      },
    ]);
  };

  // Update a field definition
  const handleUpdateField = (index, key, val) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  // Remove a field definition
  const handleRemoveField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Build the compiled block for live preview
  const previewBlock = useMemo(() => {
    // Merge defaults with interactive test values
    const mergedProps = {
      _sectionId: sectionId,
      _name: name,
      _code: code,
      _css: css,
      _fields: fields,
      _options: options,
    };
    fields.forEach((f) => {
      mergedProps[f.key] = testValues[f.key] !== undefined ? testValues[f.key] : f.default || "";
    });
    return {
      id: sectionId || "sdk_preview",
      type: "sdkCustomSection",
      props: mergedProps,
      _style: {},
    };
  }, [sectionId, name, code, css, fields, options, testValues]);

  // Handle Save
  const handleSave = async (andInsert = false) => {
    if (!name.trim()) {
      toast.error("Please provide a name for this section template.");
      return;
    }
    setIsSaving(true);
    try {
      // Default props mapping
      const defaultProps = {};
      fields.forEach((f) => {
        defaultProps[f.key] = f.default !== undefined ? f.default : "";
      });

      const payload = {
        sectionId: sectionId || `sdk_${Date.now()}`,
        name: name.trim(),
        category: (category || "Custom Sections").trim(),
        description: (description || "").trim(),
        code,
        css,
        fields,
        options,
        defaultProps,
      };

      const savedTemplate = await saveSdkCustomTemplate(payload);
      toast.success(`Saved "${name}" to Custom Sections!`);

      if (onSave) {
        await onSave(payload, savedTemplate);
      }

      if (andInsert && onInsert) {
        onInsert(payload);
      }
    } catch (err) {
      toast.error(`Save error: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts: Escape to exit, Ctrl+S / Cmd+S to save
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showAiImportModal) {
          setShowAiImportModal(false);
          return;
        }
        onClose?.();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showAiImportModal, handleSave, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-[98vw] max-w-[1550px] h-[95vh] max-h-[95vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* ================= TOP HEADER ================= */}
          <header className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: Branding & Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 shrink-0">
                <Code2 size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Section Name"
                    className="font-bold text-sm sm:text-base text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-violet-500 outline-none px-1 py-0.5 rounded transition-colors truncate"
                  />
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-semibold uppercase tracking-wider hidden sm:inline-block">
                    SDK Studio
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate px-1">
                  React JSX • Scoped CSS • Framer Motion & GSAP • Dynamic Variables
                </p>
              </div>
            </div>

            {/* Middle: Starter Preset Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden lg:inline">Starter:</span>
              <select
                onChange={(e) => handleLoadPreset(e.target.value)}
                defaultValue=""
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
              >
                <option value="" disabled>
                  Load Starter Preset...
                </option>
                {STARTER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleCopyAiPrompt}
                title="Copy ready-made structured prompt to ask ChatGPT, Claude, or Gemini to build custom sections"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold border border-violet-400/40 transition-all shadow-sm hover:shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {copiedPrompt ? <Check size={13} className="text-emerald-300" /> : <Sparkles size={13} className="text-violet-200 animate-pulse" />}
                <span>{copiedPrompt ? "Prompt Copied!" : "Copy AI Prompt"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiImportModal(true)}
                title="Import custom section JSON created by AI"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-sky-200 text-xs font-medium border border-sky-500/30 transition-colors shadow-xs"
              >
                <Copy size={13} className="text-sky-400" />
                <span className="hidden sm:inline">Import AI JSON</span>
              </button>

              <button
                type="button"
                onClick={handleFormatCode}
                title="Format code indentation and cleanup"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-xs"
              >
                <Wand2 size={13} className="text-violet-400" />
                <span className="hidden sm:inline">Format</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {onInsert && (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Check size={14} />
                  <span>Insert to Page</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-900/30 transition-all hover:scale-105 active:scale-95"
              >
                <Save size={14} />
                <span>{isSaving ? "Saving..." : "Save Template"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
                title="Close Studio"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* ================= MAIN SPLIT WORKSPACE ================= */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
            {/* ---------------- LEFT PANEL: CODE & CONFIG ---------------- */}
            <div className="flex flex-col min-h-0 bg-slate-950/80">
              {/* Tabs Navigation */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "code"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Code2 size={13} />
                    <span>JSX Code</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("fields")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "fields"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sliders size={13} />
                    <span>Variables ({fields.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("css")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "css"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Palette size={13} />
                    <span>Scoped CSS</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("options")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "options"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>Fonts & SDK</span>
                  </button>
                </div>

                {/* Sub-tab quick hint */}
                <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                  {activeTab === "code" && "React JSX syntax with automatic Babel compiler"}
                  {activeTab === "fields" && "Declare editable CMS sidebar controls"}
                  {activeTab === "css" && "Scoped styles & animations"}
                  {activeTab === "options" && "Google Fonts and runtime libraries"}
                </span>
              </div>

              {/* Tab 1: JSX Code Editor */}
              {activeTab === "code" && (
                <div className="flex-1 min-h-0 flex flex-col p-4">
                  {/* Code Editor Banner */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl mb-3 text-xs text-slate-300 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Available Globals:</span>
                      <code className="text-violet-400 font-mono">props</code>
                      <code className="text-sky-400 font-mono">React</code>
                      <code className="text-pink-400 font-mono">motion</code>
                      <code className="text-amber-400 font-mono">gsap</code>
                      <code className="text-teal-400 font-mono">axios</code>
                      <code className="text-indigo-400 font-mono">toast</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(code);
                        toast.info("Code copied to clipboard");
                      }}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded"
                      title="Copy code"
                    >
                      <Copy size={13} />
                    </button>
                  </div>

                  {/* Code text editor area */}
                  <div className="flex-1 min-h-0 relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                    <textarea
                      value={code}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData("text") || "";
                        if (pasted.trim().startsWith("{") && (pasted.includes('"code"') || pasted.includes('"name"') || pasted.includes('"fields"'))) {
                          if (unpackSectionJson(pasted)) {
                            e.preventDefault();
                            toast.success("AI Section JSON automatically unpacked into Code, CSS, and Fields!");
                          }
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.trim().startsWith("{") && val.trim().endsWith("}") && (val.includes('"code"') || val.includes('"name"'))) {
                          if (unpackSectionJson(val)) {
                            toast.success("AI Section JSON automatically unpacked into Code, CSS, and Fields!");
                            return;
                          }
                        }
                        setCode(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const start = e.target.selectionStart;
                          const end = e.target.selectionEnd;
                          const val = e.target.value;
                          setCode(val.substring(0, start) + "  " + val.substring(end));
                          setTimeout(() => {
                            e.target.selectionStart = e.target.selectionEnd = start + 2;
                          }, 0);
                        }
                      }}
                      spellCheck={false}
                      className="w-full h-full p-4 bg-transparent text-emerald-300 font-mono text-xs sm:text-[13px] leading-relaxed resize-none outline-none overflow-y-auto selection:bg-violet-900 selection:text-white"
                      placeholder="// Write your React JSX component here... return (<section>...</section>);"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Fields & Variables Builder */}
              {activeTab === "fields" && (
                <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto preview-scrollbar">
                  <div className="flex items-center justify-between mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">Declared CMS Variables</h4>
                      <p className="text-xs text-slate-400">
                        These fields automatically appear in the CMS Block Editor for users to fill in without code.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoDetectVariables}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 text-xs font-medium border border-violet-500/30 transition-colors"
                        title="Scan code for props.xyz and add them automatically"
                      >
                        <Wand2 size={13} />
                        <span>Auto-detect from Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus size={13} />
                        <span>Add Variable</span>
                      </button>
                    </div>
                  </div>

                  {fields.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                      <Sliders size={32} className="mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-medium text-slate-400">No variables declared yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Add variables so authors can customize text, images, buttons, and colors in the CMS sidebar.
                      </p>
                      <button
                        type="button"
                        onClick={handleAutoDetectVariables}
                        className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                      >
                        Auto-detect from Code
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((f, i) => (
                        <div
                          key={i}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center hover:border-slate-700 transition-colors"
                        >
                          {/* Prop Key */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                              Key (props.key)
                            </label>
                            <input
                              type="text"
                              value={f.key}
                              onChange={(e) => handleUpdateField(i, "key", e.target.value)}
                              placeholder="e.g. heading"
                              className="w-full bg-slate-950 text-emerald-300 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Label */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                              Sidebar Label
                            </label>
                            <input
                              type="text"
                              value={f.label}
                              onChange={(e) => handleUpdateField(i, "label", e.target.value)}
                              placeholder="e.g. Main Headline"
                              className="w-full bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Field Type */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                              Input Type
                            </label>
                            <select
                              value={f.type}
                              onChange={(e) => handleUpdateField(i, "type", e.target.value)}
                              className="w-full bg-slate-950 text-slate-200 text-xs px-2 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                            >
                              <option value="text">Text (single line)</option>
                              <option value="textarea">Textarea (multi-line)</option>
                              <option value="color">Color Picker</option>
                              <option value="image">Image Picker</option>
                              <option value="boolean">Toggle (yes/no)</option>
                              <option value="select">Dropdown Options</option>
                            </select>
                          </div>

                          {/* Default value */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                              Default Value
                            </label>
                            <input
                              type="text"
                              value={f.default || ""}
                              onChange={(e) => handleUpdateField(i, "default", e.target.value)}
                              placeholder="Default value..."
                              className="w-full bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Delete */}
                          <div className="sm:col-span-1 flex items-end justify-center sm:pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveField(i)}
                              className="p-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400 transition-colors"
                              title="Delete Variable"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Custom Scoped CSS */}
              {activeTab === "css" && (
                <div className="flex-1 min-h-0 flex flex-col p-4">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl mb-3 text-xs text-slate-300 shrink-0">
                    <span>Scoped CSS Rules (Automatically scoped to section root ID)</span>
                    <span className="text-[11px] text-violet-400">@keyframes & transitions supported</span>
                  </div>
                  <div className="flex-1 min-h-0 relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                    <textarea
                      value={css}
                      onChange={(e) => setCss(e.target.value)}
                      spellCheck={false}
                      className="w-full h-full p-4 bg-transparent text-indigo-300 font-mono text-xs sm:text-[13px] leading-relaxed resize-none outline-none overflow-y-auto"
                      placeholder={`/* Write custom CSS rules here */\n.my-custom-glow {\n  filter: blur(40px);\n}`}
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Fonts & SDK Options */}
              {activeTab === "options" && (
                <div className="flex-1 min-h-0 p-4 space-y-5 overflow-y-auto preview-scrollbar">
                  {/* Category & Description */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-slate-100">Category & Metadata</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Section Category</label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g. Hero Sections"
                          className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Description</label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description for template gallery"
                          className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Google Font */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-100">Custom Google Font</h4>
                      <span className="text-[11px] text-slate-400">Loads asynchronously</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={options.googleFont || ""}
                        onChange={(e) => setOptions((prev) => ({ ...prev, googleFont: e.target.value }))}
                        placeholder="e.g. Outfit, Plus Jakarta Sans, Syne, Space Grotesk"
                        className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-violet-500"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {["Outfit", "Plus Jakarta Sans", "Space Grotesk", "Cinzel", "Syne", "Inter"].map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => setOptions((prev) => ({ ...prev, googleFont: font }))}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                              options.googleFont === font
                                ? "bg-violet-600 text-white border-violet-500"
                                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                            }`}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Runtime Libraries */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-slate-100">Runtime SDK Libraries</h4>
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={options.enableFramerMotion !== false}
                          onChange={(e) =>
                            setOptions((prev) => ({ ...prev, enableFramerMotion: e.target.checked }))
                          }
                          className="w-4 h-4 text-violet-600 rounded bg-slate-950 border-slate-700"
                        />
                        <div>
                          <span className="text-xs font-medium text-slate-200 block">
                            Framer Motion Support
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Provides <code className="text-violet-400">motion</code> and <code className="text-violet-400">AnimatePresence</code>.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={options.enableGsap !== false}
                          onChange={(e) => setOptions((prev) => ({ ...prev, enableGsap: e.target.checked }))}
                          className="w-4 h-4 text-violet-600 rounded bg-slate-950 border-slate-700"
                        />
                        <div>
                          <span className="text-xs font-medium text-slate-200 block">
                            GSAP Support
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Enables <code className="text-amber-400">window.gsap</code> timelines and micro-interactions.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ---------------- RIGHT PANEL: LIVE SANDBOX PREVIEW ---------------- */}
            <div className="flex flex-col min-h-0 bg-slate-950">
              {/* Preview Controls Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
                {/* Device Viewport Switcher */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewDevice === "desktop"
                        ? "bg-slate-950 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Laptop size={13} />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice("tablet")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewDevice === "tablet"
                        ? "bg-slate-950 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Tablet size={13} />
                    <span>Tablet</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      previewDevice === "mobile"
                        ? "bg-slate-950 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>Mobile</span>
                  </button>
                </div>

                {/* Test Variables Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowVariablesDrawer((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    showVariablesDrawer
                      ? "bg-violet-600 text-white border-violet-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  <Sliders size={12} />
                  <span>Test Inputs</span>
                </button>
              </div>

              {/* Collapsible Test Inputs Drawer */}
              <AnimatePresence>
                {showVariablesDrawer ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-900/95 border-b border-slate-800 p-3 overflow-hidden shrink-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-200">
                        Live Test Inputs ({fields.length})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Changes update the preview in real-time
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto preview-scrollbar">
                      {fields.map((f) => (
                        <div key={f.key} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <label className="block text-[10px] font-mono text-slate-400 mb-0.5 truncate">
                            {f.label || f.key}
                          </label>
                          {f.type === "color" ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={testValues[f.key] || f.default || "#0284c7"}
                                onChange={(e) =>
                                  setTestValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                              />
                              <span className="font-mono text-xs text-slate-300">
                                {testValues[f.key] || f.default || "#0284c7"}
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={testValues[f.key] !== undefined ? testValues[f.key] : f.default || ""}
                              onChange={(e) =>
                                setTestValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                              }
                              className="w-full bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded border border-slate-800 outline-none focus:border-violet-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Viewport Frame with SdkCustomBlock */}
              <div className="flex-1 min-h-0 bg-slate-900/50 p-4 flex items-center justify-center overflow-auto preview-scrollbar">
                <PreviewFrame width={previewDevice === "mobile" ? 390 : previewDevice === "tablet" ? 820 : 1440} height={600}>
                  <SdkCustomBlock block={previewBlock} data={data} sampleMode={sampleMode} />
                </PreviewFrame>
              </div>
            </div>
          </div>
          {/* ================= IMPORT AI JSON MODAL ================= */}
          <AnimatePresence>
            {showAiImportModal ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowAiImportModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Import Template from AI</h3>
                        <p className="text-[11px] text-slate-400">Paste the JSON response received from ChatGPT, Claude, or Gemini</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiImportModal(false)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <textarea
                    value={aiJsonInput}
                    onChange={(e) => setAiJsonInput(e.target.value)}
                    placeholder={'{\n  "name": "My Hero Section",\n  "category": "Hero Sections",\n  "code": "return (<section ...>...</section>);",\n  "fields": [...]\n}'}
                    rows={12}
                    className="w-full font-mono text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500"
                  />

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyAiPrompt}
                      className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
                    >
                      <Copy size={13} />
                      <span>Need prompt? Copy AI Prompt</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAiImportModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleImportAiJson}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-sky-900/30"
                      >
                        Load into Studio
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
