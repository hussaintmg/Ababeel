/**
 * Curated, high-fidelity public website sections and complete full-page templates.
 * Built with full dynamic variable support ({{site.name}}, {{site.phone}}, {{site.email}},
 * {{site.address}}, {{courses}}, {{testimonials}}, {{faqs}}, etc.) and modern animated styling.
 */

const b = (type, props = {}, style = {}) => ({ type, props, style });

const MODERN_CSS = {
  heading: "h1,h2,h3 { font-family: var(--font-geist-sans), 'Outfit', 'Inter', sans-serif; letter-spacing: -0.035em; font-weight: 800; text-wrap: balance; }",
  cardHover: ".cms-card { border: 1px solid rgba(226,232,240,0.8); border-radius: 1.25rem; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }\n.cms-card:hover { transform: translateY(-4px); border-color: #3b82f6; box-shadow: 0 20px 25px -5px rgba(59,130,246,0.12); }",
  darkStat: ".stat-value { font-size: 3rem; font-weight: 800; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }",
  btnHover: "a,button { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }\na:hover,button:hover { transform: translateY(-2px); }",
};

/* =========================================================================
   1. MODULAR SECTIONS WITH VARIABLES (FOR BROWSE SECTIONS MODAL)
   ========================================================================= */

export const MODERN_PUBLIC_SECTIONS = [
  /* ----- HEROES ----- */
  {
    id: "pub-sec-home-hero",
    name: "Home — Public Portal Hero (Variables & Badges)",
    category: "Heroes",
    desc: "Complete public website hero with dynamic {{site.name}}, accreditation badges, and dual CTA buttons.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "{{site.name}} · UK Regulated Qualifications",
          title: "Accredited Qualifications Built for Real-World Competence",
          subtitle:
            "Earn Ofqual-regulated NVQ Level 2 to Level 7 qualifications and accredited professional development programmes. Delivered with flexibility, academic rigor, and dedicated 1-on-1 mentor guidance.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#091224",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "600",
          accent: "#3b82f6",
          badges:
            "Ofqual Regulated Frameworks | Fast-Track Assessment | 98% First-Time Pass Rate | Global Verification",
          primaryCta: { label: "Explore All Qualifications", href: "/courses" },
          secondaryCta: { label: "Consult an Academic Advisor", href: "/contact-us" },
        },
        {
          animation: "fade-up",
          animDuration: "0.6",
          paddingY: "80",
          css: `${MODERN_CSS.heading}\n${MODERN_CSS.btnHover}`,
        }
      ),
    ],
  },

  {
    id: "pub-sec-about-hero",
    name: "About Us — Mission & Vision Hero",
    category: "Heroes",
    desc: "Inspiring company overview hero with mission statement and institutional credibility.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "About {{site.name}}",
          title: "Setting the International Standard in Occupational Safety & Technical Competence",
          subtitle:
            "We empower safety practitioners, engineers, and corporate leadership teams across the globe with accredited, employer-recognized qualifications that safeguard lives and advance careers.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "520",
          accent: "#10b981",
          primaryCta: { label: "Our Accreditations", href: "/qualification" },
          secondaryCta: { label: "Meet the Team", href: "/about-us" },
        },
        { animation: "fade", animDuration: "0.7", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-contact-hero",
    name: "Contact Us — Direct Assistance Hero",
    category: "Heroes",
    desc: "Welcoming contact hero with office support guarantees and advisor helpline.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "We Are Here To Help",
          title: "Connect with {{site.name}} Advisors",
          subtitle:
            "Whether you need guidance choosing the right qualification level, have cohort questions, or seek corporate group rates, our admissions team is ready to assist.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#0f172a",
          gradTo: "#1e293b",
          gradAngle: "160",
          textColor: "#ffffff",
          minHeight: "460",
          primaryCta: { label: "Call Us: {{site.phone}}", href: "tel:{{site.phone}}" },
          secondaryCta: { label: "Email: {{site.email}}", href: "mailto:{{site.email}}" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-courses-hero",
    name: "Courses — Regulated Directory Hero",
    category: "Heroes",
    desc: "Search and discovery hero for course directory with framework levels.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Regulated Qualifications Catalogue",
          title: "Advance Your Career with Globally Recognized Diplomas",
          subtitle: "Explore our complete suite of NVQ Level 2 through Level 7 qualifications in Occupational Health, Safety Management, and Technical Engineering.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#0b2246",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "500",
          accent: "#3b82f6",
          badges: "Levels 2 to 7 | Qualifi & OTHM Endorsed | Self-Paced Modules | Dedicated Tutor Support",
          primaryCta: { label: "Browse By Level", href: "/courses" },
          secondaryCta: { label: "Admissions Helpline", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-schedule-hero",
    name: "Schedule — Live Training Intakes Hero",
    category: "Heroes",
    desc: "Calendar hero highlighting upcoming monthly intakes, webinars, and tutor workshops.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Training Intakes & Timetable",
          title: "Upcoming Qualification Sessions & Workshop Dates",
          subtitle: "View scheduled cohort start dates, live portfolio workshops, and tutor drop-in sessions across all regulated programmes.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#f59e0b",
          primaryCta: { label: "Book Your Cohort", href: "/registration" },
          secondaryCta: { label: "Call Admissions: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-registration-hero",
    name: "Registration — Candidate Admissions Hero",
    category: "Heroes",
    desc: "Fast-track admissions hero with step instructions and data security notice.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Fast-Track Candidate Enrollment",
          title: "Begin Your Qualification Journey with {{site.name}}",
          subtitle: "Submit your details in 3 minutes. Our qualification team reviews your experience, confirms eligibility, and assigns your tutor advisor.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#1e1b4b",
          gradTo: "#0f172a",
          gradAngle: "140",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#6366f1",
          badges: "No Payment Taken Online | Rapid Verification | Official Registration Reference",
          primaryCta: { label: "Start Application Below", href: "#register-form" },
          secondaryCta: { label: "Admissions Assistance", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-resources-hero",
    name: "Resources — Technical Knowledge Hub Hero",
    category: "Heroes",
    desc: "Knowledge hub hero for technical whitepapers, regulatory updates, and safety forms.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Technical Library & Resources",
          title: "Free Industry Guidance, Whitepapers & Regulatory Briefings",
          subtitle: "Curated by chartered safety professionals to support active practitioners with compliance templates, inspection forms, and research insights.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#064e3b",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "480",
          accent: "#10b981",
          primaryCta: { label: "Explore Free Guides", href: "/resources" },
          secondaryCta: { label: "Subscribe for Updates", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-awarding-bodies-hero",
    name: "Awarding Bodies — Accreditation Authorities Hero",
    category: "Heroes",
    desc: "Overview hero presenting recognized UK awarding organizations (Qualifi, OTHM, ProQual, Highfield).",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "UK Regulated Bodies",
          title: "Our Partner Awarding Organisations",
          subtitle: "{{site.name}} works in formal partnership with leading Ofqual-regulated UK awarding bodies to deliver internationally valid qualifications.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#3b82f6",
          primaryCta: { label: "Explore Qualifications", href: "/courses" },
          secondaryCta: { label: "Verify Accreditation", href: "/qualification" },
        },
        { animation: "fade", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-verify-hero",
    name: "Verification — Official Certificate Portal Hero",
    category: "Heroes",
    desc: "Official verification portal hero providing instant verification for employers and learners.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Global Verification Service",
          title: "Verify An Official {{site.name}} Certificate",
          subtitle: "Instant, cryptographic validation for employers, regulators, and contractors. Authenticate graduate credentials anywhere in the world.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#042f2e",
          gradTo: "#091224",
          gradAngle: "145",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#14b8a6",
          badges: "Instant Verification | Anti-Fraud QR Matching | UK Awarding Registry Sync",
          primaryCta: { label: "Verify Below", href: "#verification-box" },
          secondaryCta: { label: "Verification Helpline: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-partner-hero",
    name: "Enterprise & Corporate Training Hero",
    category: "Heroes",
    desc: "Corporate B2B workforce training hero with group discounts and customized site safety curricula.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Corporate Safety Solutions",
          title: "Upskill Your Enterprise Workforce with Regulated Safety Credentials",
          subtitle: "Tailored workforce compliance packages, group enrollment discounts, and dedicated executive account management for contractor firms.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#1e3a8a",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "520",
          accent: "#60a5fa",
          badges: "Corporate Invoicing | Dedicated Account Manager | Customized Delivery Schedules",
          primaryCta: { label: "Request Corporate Proposal", href: "/contact-us" },
          secondaryCta: { label: "Call Enterprise Desk: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  {
    id: "pub-sec-legal-hero",
    name: "Legal & Regulatory Compliance Hero",
    category: "Heroes",
    desc: "Clean institutional hero for privacy, terms, refund policies, and governance.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Governance & Policies",
          title: "Transparency, Integrity & Regulatory Compliance",
          subtitle: "Review our institutional policies, data governance protocols, and candidate terms of service.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "380",
          primaryCta: { label: "Contact Compliance Officer", href: "mailto:{{site.email}}" },
          secondaryCta: { label: "Admissions Home", href: "/" },
        },
        { animation: "fade", paddingY: "56", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* ----- FEATURES & BENTO GRIDS ----- */
  {
    id: "pub-sec-why-choose",
    name: "Why Choose Ababeel — 6-Pillar Interactive Grid",
    category: "Features",
    desc: "The iconic 6-pillar framework from the public website with hover glow and modern iconography.",
    blocks: [
      b(
        "cardGrid",
        {
          eyebrow: "Institutional Excellence",
          title: "Why Professionals & Enterprises Choose {{site.name}}",
          subtitle:
            "Every programme is structured around practical workplace competence, international regulatory compliance, and measurable career outcomes.",
          columns: "3",
          accent: "#2563eb",
          variant: "plain",
          items: [
            {
              icon: "🛡️",
              title: "UK Regulated Qualifications",
              text: "Fully compliant with Ofqual criteria and aligned with European Qualifications Frameworks (EQF) for global recognition.",
              image: "",
              href: "/qualification",
              linkLabel: "View framework",
            },
            {
              icon: "⚡",
              title: "Flexible Digital Learning",
              text: "Designed specifically for busy professionals with self-paced submissions, live tutor drop-ins, and online materials.",
              image: "",
              href: "/courses",
              linkLabel: "Explore delivery",
            },
            {
              icon: "🎓",
              title: "Practitioner-Led Instruction",
              text: "All courses and portfolios are mentored by certified chartered safety specialists with extensive active site experience.",
              image: "",
              href: "/about-us",
              linkLabel: "Meet instructors",
            },
            {
              icon: "🌍",
              title: "Global Employer Standing",
              text: "Our certificates are verified and trusted by major contracting and enterprise employers across 25+ nations.",
              image: "",
              href: "/about-us",
              linkLabel: "Global reach",
            },
            {
              icon: "📈",
              title: "Accelerated Career Pathways",
              text: "Qualify for GradIOSH, CMIOSH, and international chartered institute memberships with our level 6 & 7 diplomas.",
              image: "",
              href: "/professional-dev",
              linkLabel: "Career paths",
            },
            {
              icon: "🤝",
              title: "Dedicated Tutor Supervision",
              text: "Personalized, actionable feedback on all portfolio evidence submissions until you meet full awarding standards.",
              image: "",
              href: "/contact-us",
              linkLabel: "Speak to team",
            },
          ],
        },
        {
          animation: "fade-up",
          paddingY: "80",
          bgColor: "#ffffff",
          css: `${MODERN_CSS.heading}\n${MODERN_CSS.cardHover}`,
        }
      ),
    ],
  },

  {
    id: "pub-sec-values-bento",
    name: "About Us — Core Values Bento Grid",
    category: "Features",
    desc: "4-pillar organizational values bento grid: Integrity, Excellence, Safety First, Lifelong Progress.",
    blocks: [
      b(
        "cardGrid",
        {
          eyebrow: "Our Guiding Principles",
          title: "The Pillars That Define {{site.name}}",
          subtitle:
            "We operate with an unyielding commitment to occupational safety, educational integrity, and learner empowerment.",
          columns: "2",
          accent: "#10b981",
          variant: "plain",
          items: [
            {
              icon: "⚖️",
              title: "Uncompromising Integrity",
              text: "We adhere strictly to regulatory awarding standards, transparent verification, and unbiased assessments.",
              image: "",
              href: "",
            },
            {
              icon: "🏆",
              title: "Educational Excellence",
              text: "Curricula developed in direct collaboration with chartered bodies and senior industrial safety consultants.",
              image: "",
              href: "",
            },
            {
              icon: "🦺",
              title: "Safety as a Human Right",
              text: "Our core mission is zero preventable harm on worksites globally through competent, qualified leadership.",
              image: "",
              href: "",
            },
            {
              icon: "🌱",
              title: "Lifelong Continuous Development",
              text: "Post-qualification CPD, alumni mentorship, and regular regulatory briefing updates for every graduate.",
              image: "",
              href: "",
            },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  {
    id: "pub-sec-qualification-levels",
    name: "Qualifications — Level 2 to Level 7 Diplomas Matrix",
    category: "Features",
    desc: "Interactive diploma matrix breaking down Level 2 (Entry), Level 3 (Supervisor), Level 5 (Manager), and Level 6/7 (Director).",
    blocks: [
      b(
        "cardGrid",
        {
          eyebrow: "Educational Framework",
          title: "Find the Qualification Suited to Your Career Stage",
          subtitle: "Aligned with UK RQF/Ofqual and European Qualifications Framework (EQF) guidelines.",
          columns: "4",
          accent: "#2563eb",
          items: [
            { icon: "🥉", title: "Level 2 & 3", text: "Entry & Site Supervisor Diplomas. Ideal for operatives stepping into safety supervision.", image: "", href: "/courses", linkLabel: "Explore Level 3" },
            { icon: "🥈", title: "Level 4 & 5", text: "HSE Management Diplomas. Comprehensive hazard control and safety auditing leadership.", image: "", href: "/courses", linkLabel: "Explore Level 5" },
            { icon: "🥇", title: "Level 6", text: "Graduate Safety Practitioner Diploma. Direct pathway to GradIOSH professional status.", image: "", href: "/courses", linkLabel: "Explore Level 6" },
            { icon: "👑", title: "Level 7", text: "Postgraduate Strategic Leadership Diploma. Designed for HSE Directors and CMIOSH candidates.", image: "", href: "/courses", linkLabel: "Explore Level 7" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  {
    id: "pub-sec-learning-pathway",
    name: "How It Works — 4-Step Learning Pathway",
    category: "Features",
    desc: "Numbered step-by-step pathway showing enrollment, study, portfolio submission, and graduation.",
    blocks: [
      b(
        "cardGrid",
        {
          eyebrow: "Simple 4-Step Process",
          title: "Your Clear Pathway to International Certification",
          subtitle: "Transparent milestones designed to fit around your demanding work schedule.",
          columns: "4",
          accent: "#3b82f6",
          items: [
            { icon: "1️⃣", title: "1. Select & Apply", text: "Choose your course level and complete the quick registration form online.", image: "", href: "/registration" },
            { icon: "2️⃣", title: "2. Tutor Onboarding", text: "Get paired with a dedicated tutor and receive comprehensive digital learning materials.", image: "", href: "/about-us" },
            { icon: "3️⃣", title: "3. Portfolio Assessment", text: "Submit real workplace evidence and receive actionable constructive feedback.", image: "", href: "/courses" },
            { icon: "4️⃣", title: "4. Certified Graduation", text: "Receive your UK-regulated diploma and international verification credentials.", image: "", href: "/qualification" },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc" }
      ),
    ],
  },

  /* ----- STATS & MILESTONES ----- */
  {
    id: "pub-sec-milestones-stats",
    name: "Milestones & Impact — Dark Glass Stat Band",
    category: "Stats",
    desc: "Premium dark stat band showcasing institutional credibility (10,000+ Certified, 98% Pass, 25+ Countries).",
    blocks: [
      b(
        "stats",
        {
          title: "Setting the Benchmark in Technical Education",
          subtitle: "Quantifiable results achieved by learners and partner organizations worldwide.",
          accent: "#38bdf8",
          bgColor: "#091224",
          items: [
            { value: "10,000+", label: "Certified Professionals" },
            { value: "98%", label: "First-Time Assessment Pass Rate" },
            { value: "25+", label: "Countries Represented" },
            { value: "50+", label: "Corporate Enterprise Partners" },
          ],
        },
        {
          animation: "zoom-in",
          textColor: "#f8fafc",
          paddingY: "64",
          css: `${MODERN_CSS.heading}\n${MODERN_CSS.darkStat}`,
        }
      ),
    ],
  },

  /* ----- TESTIMONIALS ----- */
  {
    id: "pub-sec-learner-testimonials",
    name: "Testimonials — Graduate Success Grid",
    category: "Testimonials",
    desc: "Real learner reviews with ratings, company roles, and quotes supporting {{testimonials}} variable binding.",
    blocks: [
      b(
        "testimonials",
        {
          title: "What Our Graduates Say About {{site.name}}",
          layout: "grid",
          items: [
            {
              quote:
                "The Level 6 Diploma in Occupational Health & Safety completely accelerated my career. The tutor feedback was thorough, practical, and helped me transition seamlessly to a Regional HSE Director role.",
              name: "Muhammad Tariq",
              role: "Regional HSE Director, Infrastructure",
              avatar: "",
              rating: "5",
            },
            {
              quote:
                "Balancing study with complex commercial construction sites was manageable thanks to {{site.name}}'s flexible digital portal. The qualification is recognized without question by all our international clients.",
              name: "David Richardson",
              role: "Senior Safety Manager, Energy Sector",
              avatar: "",
              rating: "5",
            },
            {
              quote:
                "Our company sponsored 12 engineers through the Level 3 and 5 certifications. The measurable improvement in hazard risk assessments on site has been remarkable.",
              name: "Fatima Al-Zahra",
              role: "VP of Quality & Compliance",
              avatar: "",
              rating: "5",
            },
          ],
        },
        {
          animation: "fade-up",
          paddingY: "80",
          bgColor: "#f8fafc",
          css: `${MODERN_CSS.heading}\nblockquote { font-size: 1.05rem; line-height: 1.7; color: #334155; }`,
        }
      ),
    ],
  },

  /* ----- FAQ ACCORDION ----- */
  {
    id: "pub-sec-home-faq",
    name: "FAQ — Comprehensive Candidate Accordion",
    category: "FAQ",
    desc: "Essential candidate questions about recognition, eligibility, deadlines, and tutor support.",
    blocks: [
      b(
        "faq",
        {
          title: "Frequently Asked Questions",
          subtitle: "Clear answers to the most common questions regarding certification and enrollment.",
          columns: "1",
          accent: "#2563eb",
          items: [
            {
              q: "Are {{site.name}} qualifications recognized internationally?",
              a: "Yes. All our vocational and diploma qualifications are regulated by established UK Awarding Organisations under Ofqual guidelines. They align with international frameworks and are recognized by employers and safety institutes globally.",
            },
            {
              q: "Can I study while working full-time?",
              a: "Absolutely. More than 85% of our learners are working safety professionals. Our courses feature flexible portfolio submission dates, digital seminar recordings, and continuous tutor drop-in sessions.",
            },
            {
              q: "How does the portfolio assessment method work?",
              a: "Rather than traditional memorization exams, vocational NVQs assess actual workplace competence. You compile and submit evidence from your occupational duties, guided step-by-step by your allocated assessor.",
            },
            {
              q: "How do I start the registration process?",
              a: "Select your desired qualification, click 'Register Online' or call {{site.phone}}. Our academic advisors will review your experience and confirm your eligibility immediately.",
            },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#ffffff", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* ----- CALL TO ACTION ----- */
  {
    id: "pub-sec-cta-advisor",
    name: "Call To Action — Academic Consultation Banner",
    category: "Call To Action",
    desc: "High-impact CTA banner with dynamic phone {{site.phone}} and email {{site.email}} links.",
    blocks: [
      b(
        "cta",
        {
          title: "Ready to Advance Your Professional Standing?",
          text: "Speak with an accredited {{site.name}} qualification advisor today. Reach us at {{site.phone}} or email {{site.email}} for course intake details.",
          button: { label: "Register for Next Intake", href: "/registration" },
          secondaryButton: { label: "Book Free Consultation", href: "/contact-us" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        {
          animation: "fade-up",
          paddingY: "72",
          css: `${MODERN_CSS.heading}\n${MODERN_CSS.btnHover}`,
        }
      ),
    ],
  },

  /* ----- CONTACT CARDS ----- */
  {
    id: "pub-sec-contact-cards",
    name: "Contact — Direct Channels (Phone, Email, Office)",
    category: "Contact",
    desc: "3-card contact grid connecting learners directly with phone {{site.phone}}, email {{site.email}}, and address.",
    blocks: [
      b(
        "cardGrid",
        {
          eyebrow: "Reach Out Anytime",
          title: "Direct Admissions & Learner Support",
          subtitle: "Our academic advisory team is available Monday through Saturday to answer all queries.",
          columns: "3",
          accent: "#2563eb",
          variant: "plain",
          items: [
            {
              icon: "📞",
              title: "Call Us Directly",
              text: "{{site.phone}}\nSpeak with an admissions advisor for immediate guidance.",
              image: "",
              href: "tel:{{site.phone}}",
              linkLabel: "Call now",
            },
            {
              icon: "✉️",
              title: "Email Support",
              text: "{{site.email}}\nSubmit detailed inquiries and receive a response within 24 hours.",
              image: "",
              href: "mailto:{{site.email}}",
              linkLabel: "Send email",
            },
            {
              icon: "📍",
              title: "Headquarters",
              text: "{{site.address}}\nDedicated administrative and verification headquarters.",
              image: "",
              href: "/contact-us",
              linkLabel: "Office details",
            },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  /* ----- COURSE DETAIL SUMMARY ----- */
  {
    id: "pub-sec-course-detail-summary",
    name: "Course Details — Qualification Specification & Breakdown",
    category: "Features",
    desc: "Bento specification cards for course level, credits, delivery mode, and assessment.",
    blocks: [
      b(
        "cardGrid",
        {
          title: "Qualification Structure & Delivery Overview",
          subtitle: "Designed around working professionals with complete assessment flexibility.",
          columns: "4",
          items: [
            {
              icon: "🏆",
              title: "Awarding Body",
              text: "Nationally recognized, Ofqual-regulated awarding organization certification.",
              image: "",
              href: "/awarding-bodies",
              linkLabel: "View accreditation",
            },
            {
              icon: "⏱️",
              title: "Duration & Pace",
              text: "Self-paced fast track (typically 4–12 weeks) with mentor milestones.",
              image: "",
              href: "/schedule",
              linkLabel: "Check dates",
            },
            {
              icon: "💻",
              title: "Study Format",
              text: "Blended digital learning platform + workplace evidence submission.",
              image: "",
              href: "/courses",
              linkLabel: "Learning mode",
            },
            {
              icon: "🎯",
              title: "Assessment Mode",
              text: "Portfolio evidence, professional discussion, and direct observation.",
              image: "",
              href: "/registration",
              linkLabel: "Register interest",
            },
          ],
        },
        { animation: "fade-up", paddingY: "64", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  /* ----- RESOURCES LIBRARY ----- */
  {
    id: "pub-sec-resources-library",
    name: "Resources — Regulatory Frameworks & Handbooks Library",
    category: "Cards",
    desc: "Downloadable guides, whitepapers, and assessment specifications.",
    blocks: [
      b(
        "cardGrid",
        {
          title: "Technical Guidance & Candidate Resources",
          subtitle: "Essential documentation, student handbooks, and regulatory frameworks.",
          columns: "3",
          items: [
            {
              icon: "📘",
              title: "Candidate Learner Handbook",
              text: "Step-by-step guidance on portfolio building, mentor interaction, and assessment criteria.",
              image: "",
              href: "/resources",
              linkLabel: "Access handbook",
            },
            {
              icon: "📊",
              title: "Occupational Health & Safety Whitepaper",
              text: "Current insights into UK HSE compliance, ISO 45001 alignment, and organizational competence.",
              image: "",
              href: "/resources",
              linkLabel: "Read whitepaper",
            },
            {
              icon: "📜",
              title: "Ofqual Level Descriptors Guide",
              text: "Understanding RQF Level 3 through Level 7 career progression pathways and equivalences.",
              image: "",
              href: "/resources",
              linkLabel: "Review guide",
            },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  /* ----- REGISTRATION HELP ----- */
  {
    id: "pub-sec-registration-help",
    name: "Registration — Advisory Reassurance & Support Panel",
    category: "Call To Action",
    desc: "Reassurance band highlighting 100% no-upfront fee guarantee and direct advisor helpline.",
    blocks: [
      b(
        "cardGrid",
        {
          title: "Why Register With {{site.name}}",
          subtitle: "Clear, transparent enrollment with complete professional reassurance.",
          columns: "3",
          items: [
            {
              icon: "🛡️",
              title: "Zero Up-Front Fee",
              text: "No payment is taken upon registration. Our advisors review your background and confirm suitability first.",
              image: "",
              href: "/registration",
              linkLabel: "Start registration",
            },
            {
              icon: "👨‍🏫",
              title: "Dedicated Course Mentor",
              text: "Assigned an experienced chartered practitioner who works with you through to completion.",
              image: "",
              href: "/our-team",
              linkLabel: "Our mentors",
            },
            {
              icon: "📞",
              title: "Direct Support Helpline",
              text: "Have questions? Call our admissions office directly at {{site.phone}} or email {{site.email}}.",
              image: "",
              href: "tel:{{site.phone}}",
              linkLabel: "Speak to team",
            },
          ],
        },
        { animation: "fade-up", paddingY: "64", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  /* ----- CONSULTANTS GRID ----- */
  {
    id: "pub-sec-consultants-grid",
    name: "Consultants — Senior Assessment & Industry Practitioners",
    category: "Team",
    desc: "Directory cards of senior technical verifiers and accredited consultants.",
    blocks: [
      b(
        "cardGrid",
        {
          title: "Principal Technical Consultants",
          subtitle: "Chartered practitioners leading our qualification quality and verification boards.",
          columns: "3",
          items: [
            {
              icon: "👔",
              title: "Senior Technical Verifier",
              text: "20+ years managing high-hazard construction and engineering audits across UK and EMEA.",
              image: "",
              href: "/contact-us",
              linkLabel: "Contact consultant",
            },
            {
              icon: "🎯",
              title: "Chartered Safety Lead",
              text: "Specialist in Process Safety, COMAH regulations, and executive behavioral safety frameworks.",
              image: "",
              href: "/contact-us",
              linkLabel: "Request advisory",
            },
            {
              icon: "⚖️",
              title: "Quality Assurance Auditor",
              text: "Former awarding organization external quality assurer overseeing rigorous standards.",
              image: "",
              href: "/contact-us",
              linkLabel: "Book audit",
            },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
    ],
  },

  /* ----- GLOSSARY ACCORDION ----- */
  {
    id: "pub-sec-glossary-table",
    name: "Glossary — UK Technical & Regulatory Terminology",
    category: "FAQ",
    desc: "Key regulatory and qualification terms explained clearly.",
    blocks: [
      b(
        "faq",
        {
          title: "Regulatory & Qualification Terms Explained",
          items: [
            {
              q: "What is Ofqual?",
              a: "The Office of Qualifications and Examinations Regulation (Ofqual) is the non-ministerial government department that regulates qualifications, exams and tests in England.",
            },
            {
              q: "What does NVQ mean?",
              a: "National Vocational Qualification. A competence-based work-related qualification earned through on-the-job performance and professional evidence rather than traditional written examinations.",
            },
            {
              q: "What is RQF?",
              a: "Regulated Qualifications Framework. The single framework for describing all regulated qualifications in England, ranging from Entry Level to Level 8 (Doctoral equivalent).",
            },
            {
              q: "What is CPD accreditation?",
              a: "Continuing Professional Development. Formal recognition that a learning activity reaches the required standards and contributes to ongoing professional competence benchmarks.",
            },
          ],
        },
        { animation: "fade-up", paddingY: "64", bgColor: "#ffffff", css: MODERN_CSS.heading }
      ),
    ],
  },
];

/* =========================================================================
   2. COMPLETE FULL-PAGE TEMPLATES (FOR "FULL PAGES" CATEGORY)
   ========================================================================= */

export const MODERN_FULL_PAGES = [
  /* 1. HOME PAGE */
  {
    id: "pub-page-home-complete",
    name: "Home — Premium Public Portal (Complete)",
    category: "Full Pages",
    desc: "The complete, modern Ababeel Home Page with dynamic variables, accreditation strip, course grid, bento features, live stats, testimonials, FAQ, and CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "{{site.name}} · UK Regulated Qualifications",
          title: "Accredited Qualifications Built for Real-World Competence",
          subtitle:
            "Earn Ofqual-regulated NVQ Level 2 to Level 7 qualifications and accredited professional development programmes. Delivered with flexibility, rigor, and full tutor guidance.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#091224",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "620",
          accent: "#3b82f6",
          badges: "Ofqual Regulated | Fast-Track Assessment | 98% Pass Rate | Global Verification",
          primaryCta: { label: "Browse All Qualifications", href: "/courses" },
          secondaryCta: { label: "Consult an Advisor", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "80", css: `${MODERN_CSS.heading}\n${MODERN_CSS.btnHover}` }
      ),
      b("accreditationLogos", {
        title: "Recognized by Leading UK Regulatory & Awarding Bodies",
        subtitle: "",
        grayscale: false,
      }, { bgColor: "#f8fafc", paddingY: "48" }),
      b("courseGrid", {
        title: "Popular Regulated Qualifications",
        subtitle: "Level 2 to Level 7 diplomas in safety, management, and technical compliance.",
        category: "",
        limit: "6",
        source: "featured",
        ctaLabel: "View all courses",
        ctaHref: "/courses",
      }, { paddingY: "80" }),
      b(
        "cardGrid",
        {
          eyebrow: "The Ababeel Difference",
          title: "Why Industry Leaders Trust {{site.name}}",
          subtitle: "A structured educational framework built on practical competence and career progression.",
          columns: "3",
          accent: "#2563eb",
          variant: "plain",
          items: [
            { icon: "🛡️", title: "UK Regulated Diplomas", text: "Regulated by Ofqual under recognized national qualification frameworks.", image: "", href: "/qualification" },
            { icon: "⚡", title: "Flexible Online Delivery", text: "Designed around work schedules with digital modules and tutor check-ins.", image: "", href: "/courses" },
            { icon: "🎓", title: "Chartered Practitioner Tutors", text: "1-on-1 portfolio feedback from certified safety assessors.", image: "", href: "/about-us" },
            { icon: "🌍", title: "Global Recognition", text: "Certificates trusted by employers across 25+ countries worldwide.", image: "", href: "/about-us" },
            { icon: "📈", title: "Career Acceleration", text: "Direct route to technical GradIOSH and CMIOSH memberships.", image: "", href: "/professional-dev" },
            { icon: "🤝", title: "Continuous Guidance", text: "Dedicated admissions and portfolio support until full graduation.", image: "", href: "/contact-us" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: `${MODERN_CSS.heading}\n${MODERN_CSS.cardHover}` }
      ),
      b(
        "stats",
        {
          title: "Setting the Standard in Technical Certification",
          subtitle: "",
          accent: "#38bdf8",
          bgColor: "#091224",
          items: [
            { value: "10,000+", label: "Certified Professionals" },
            { value: "98%", label: "First-Time Pass Rate" },
            { value: "25+", label: "Countries" },
            { value: "50+", label: "Corporate Partners" },
          ],
        },
        { animation: "zoom-in", textColor: "#ffffff", paddingY: "64", css: `${MODERN_CSS.heading}\n${MODERN_CSS.darkStat}` }
      ),
      b(
        "testimonials",
        {
          title: "What Our Graduates Say",
          layout: "grid",
          items: [
            { quote: "The Level 6 Diploma unlocked my promotion to Regional Safety Director. Outstanding tutor support.", name: "Muhammad Tariq", role: "Safety Director", avatar: "", rating: "5" },
            { quote: "Seamless online study while working on offshore projects. Highly recommended.", name: "David Richardson", role: "HSE Manager", avatar: "", rating: "5" },
            { quote: "Ababeel trained our entire corporate safety team with exceptional professionalism.", name: "Fatima Al-Zahra", role: "Compliance Lead", avatar: "", rating: "5" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#f8fafc", css: MODERN_CSS.heading }
      ),
      b(
        "faq",
        {
          title: "Frequently Asked Questions",
          subtitle: "Everything you need to know about enrollments, recognition, and tutoring.",
          columns: "1",
          accent: "#2563eb",
          items: [
            { q: "Are certificates recognized internationally?", a: "Yes, all qualifications are regulated by UK Awarding Organisations under Ofqual rules and recognized globally." },
            { q: "Can I study while working full-time?", a: "Yes, our programs feature self-paced modules and flexible portfolio submissions specifically for working professionals." },
            { q: "How do I enroll?", a: "Submit an online registration or contact {{site.phone}} to speak with an advisor." },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#ffffff", css: MODERN_CSS.heading }
      ),
      b(
        "cta",
        {
          title: "Advance Your Occupational Safety Career Today",
          text: "Contact our admissions team at {{site.phone}} or email {{site.email}} for immediate assistance.",
          button: { label: "Register for Next Intake", href: "/registration" },
          secondaryButton: { label: "Consult an Advisor", href: "/contact-us" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: `${MODERN_CSS.heading}\n${MODERN_CSS.btnHover}` }
      ),
    ],
  },

  /* 2. ABOUT US */
  {
    id: "pub-page-about-complete",
    name: "About Us — Complete Institutional Profile",
    category: "Full Pages",
    desc: "Complete About Us page with company heritage, core values bento grid, leadership board, accreditation strip, and contact CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "About {{site.name}}",
          title: "Setting the International Standard in Safety & Technical Competence",
          subtitle: "Empowering professionals across 25+ nations with accredited vocational qualifications.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "520",
          primaryCta: { label: "Explore Our Accreditations", href: "/qualification" },
          secondaryCta: { label: "Contact Leadership", href: "/contact-us" },
        },
        { animation: "fade", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "split",
        {
          eyebrow: "Our Heritage & Mission",
          title: "Dedicated to Zero Harm Through Qualified Leadership",
          text: "<p>{{site.name}} was established to bridge the gap between academic theory and practical worksite safety. We believe every worker deserves a safe environment, led by competent, certified professionals.</p>",
          bullets: [
            { text: "Accredited by UK Ofqual-regulated awarding bodies" },
            { text: "Practitioner-led instruction with direct industry experience" },
            { text: "Global verification trusted by major infrastructure contractors" },
          ],
          image: "",
          imageSide: "right",
          cta: { label: "Explore Qualifications", href: "/courses" },
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Our Values",
          title: "The Pillars Behind Our Work",
          subtitle: "Integrity, Excellence, Safety First, and Continuous Professional Progress.",
          columns: "2",
          accent: "#10b981",
          items: [
            { icon: "⚖️", title: "Integrity", text: "Rigorous assessment standards and complete transparency in verification.", image: "", href: "" },
            { icon: "🏆", title: "Excellence", text: "Curricula vetted by leading chartered safety institutions.", image: "", href: "" },
            { icon: "🦺", title: "Safety First", text: "A relentless drive to eliminate preventable worksite incidents.", image: "", href: "" },
            { icon: "🌱", title: "Continuous Progress", text: "Lifelong CPD support and networking for every graduate.", image: "", href: "" },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
      b("accreditationLogos", { title: "Our Regulatory Accreditations", subtitle: "", grayscale: false }, { paddingY: "48" }),
      b(
        "cta",
        {
          title: "Join Thousands of Certified Practitioners",
          text: "Contact our team at {{site.email}} or call {{site.phone}} to discuss your educational goals.",
          button: { label: "Get In Touch", href: "/contact-us" },
          secondaryButton: { label: "Browse Courses", href: "/courses" },
          bgColor: "#0f172a",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 3. CONTACT US */
  {
    id: "pub-page-contact-complete",
    name: "Contact Us — Complete Portal",
    category: "Full Pages",
    desc: "Complete Contact Us page with hero, direct channels ({{site.phone}}, {{site.email}}, {{site.address}}), admissions FAQ, and consultation CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Admissions & Support",
          title: "We Are Here To Guide Your Learning Journey",
          subtitle: "Get in touch with an accredited advisor for course advice, enrollment verification, or group rates.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#0f172a",
          gradTo: "#1e293b",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "440",
          primaryCta: { label: "Call Us: {{site.phone}}", href: "tel:{{site.phone}}" },
          secondaryCta: { label: "Email Us: {{site.email}}", href: "mailto:{{site.email}}" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Direct Contact Channels",
          title: "How to Reach {{site.name}}",
          subtitle: "Fast response times across phone, email, and campus inquiries.",
          columns: "3",
          accent: "#2563eb",
          items: [
            { icon: "📞", title: "Admissions Phone", text: "{{site.phone}}\nMonday to Saturday, 9am - 6pm", image: "", href: "tel:{{site.phone}}", linkLabel: "Call now" },
            { icon: "✉️", title: "Email Inquiry", text: "{{site.email}}\nResponses typically within 24 hours", image: "", href: "mailto:{{site.email}}", linkLabel: "Email us" },
            { icon: "📍", title: "Headquarters", text: "{{site.address}}\nCertification and verification center", image: "", href: "/contact-us", linkLabel: "Get directions" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "faq",
        {
          title: "Common Admissions Questions",
          subtitle: "Instant answers regarding documentation, intakes, and registration.",
          columns: "1",
          accent: "#2563eb",
          items: [
            { q: "What documents are required to register?", a: "Generally, a valid photo ID, CV detailing your safety or technical experience, and copies of any prior certificates." },
            { q: "When do cohorts start?", a: "We run monthly intakes with rolling enrollment so you can begin whenever you are ready." },
            { q: "Are corporate billing options available?", a: "Yes, we support direct corporate invoicing and PO billing for enterprise clients." },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.heading }
      ),
      b(
        "cta",
        {
          title: "Ready to Register?",
          text: "Start your registration online now or reach out to {{site.email}} for immediate assistance.",
          button: { label: "Register Online", href: "/registration" },
          secondaryButton: { label: "View Schedule", href: "/schedule" },
          bgColor: "#2563eb",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 4. QUALIFICATIONS */
  {
    id: "pub-page-qualifications-complete",
    name: "Qualifications — UK Regulated Diplomas Hub",
    category: "Full Pages",
    desc: "Complete Qualifications portal with Levels 3-7 Diplomas matrix, awarding body verification, and advisor CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "UK Regulated Framework",
          title: "Ofqual Regulated Diplomas from Level 2 to Level 7",
          subtitle: "Internationally recognized qualifications that build professional credibility and career progression.",
          align: "left",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "560",
          primaryCta: { label: "View Course Directory", href: "/courses" },
          secondaryCta: { label: "Check Your Eligibility", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "80", css: MODERN_CSS.heading }
      ),
      b("awardingBodyLogos", { title: "Awarding Organisations", subtitle: "Certified through Qualifi, OTHM, Highfield and ProQual.", grayscale: false }, { paddingY: "48", bgColor: "#f8fafc" }),
      b("courseGrid", { title: "All Regulated Qualifications", subtitle: "Select a qualification level to view module specifications.", limit: "12", source: "featured", ctaLabel: "View all courses", ctaHref: "/courses" }, { paddingY: "80" }),
      b(
        "cta",
        {
          title: "Need Guidance on the Right Qualification Level?",
          text: "Our qualification specialists evaluate your experience and recommend the optimal diploma pathway. Call {{site.phone}} today.",
          button: { label: "Talk to an Advisor", href: "/contact-us" },
          secondaryButton: { label: "Online Registration", href: "/registration" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 5. COURSES CATALOG */
  {
    id: "pub-page-courses-complete",
    name: "Courses — Interactive Directory & Search",
    category: "Full Pages",
    desc: "Complete Courses page with search hero, level filter options, live course cards grid, and admissions support banner.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Explore Qualifications",
          title: "Find Your Next Career-Defining Qualification",
          subtitle: "Browse industry-aligned diplomas regulated by Ofqual. Study at your own pace with full assessor support.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#0b2246",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#3b82f6",
          badges: "Levels 2 to 7 | Rolling Monthly Intakes | 100% Online Delivery | 1-on-1 Assessors",
          primaryCta: { label: "Register for a Course", href: "/registration" },
          secondaryCta: { label: "Admissions Helpline: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b("courseGrid", {
        title: "All Available Programmes",
        subtitle: "Filter by qualification level or safety domain to view full syllabus specifications.",
        limit: "12",
        source: "all",
      }, { paddingY: "80", bgColor: "#ffffff" }),
      b(
        "cta",
        {
          title: "Unsure Which Course Matches Your Experience?",
          text: "Submit your CV to {{site.email}} or speak with our qualification team at {{site.phone}} for an instant assessment.",
          button: { label: "Request Free Assessment", href: "/contact-us" },
          secondaryButton: { label: "View Schedule", href: "/schedule" },
          bgColor: "#091224",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 6. COURSE DETAIL TEMPLATE */
  {
    id: "pub-page-course-detail-complete",
    name: "Course Detail — Dynamic Single Course Specification",
    category: "Full Pages",
    desc: "Template for single course pages with overview hero, unit breakdown, entry requirements, and registration box.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Regulated Qualification Specification",
          title: "Level 6 Diploma in Occupational Health and Safety Management",
          subtitle: "Achieve GradIOSH eligibility and advance into senior HSE leadership. Assessment via workplace competence evidence portfolio.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#0f172a",
          gradTo: "#1e293b",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "520",
          accent: "#3b82f6",
          badges: "60 Credits | Ofqual Regulated | European Qualifications Framework Level 6 | Fast-Track Available",
          primaryCta: { label: "Enroll in this Programme", href: "/registration" },
          secondaryCta: { label: "Download Syllabus", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Programme Overview",
          title: "Key Qualification Details",
          subtitle: "Essential metrics regarding duration, credit value, and assessment method.",
          columns: "4",
          accent: "#2563eb",
          items: [
            { icon: "⏱️", title: "Duration", text: "4 to 6 Months (Flexible, self-paced submissions)" },
            { icon: "📜", title: "Credits", text: "60 RQF Credits (Level 6 UK Framework)" },
            { icon: "📝", title: "Assessment", text: "Workplace Evidence Portfolio (No written exams)" },
            { icon: "🎓", title: "Outcome", text: "GradIOSH / CMIOSH Membership Pathway" },
          ],
        },
        { animation: "fade-up", paddingY: "64", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Secure Your Place in the Upcoming Intake",
          text: "Register online or contact our course coordination team at {{site.phone}} for fee structure and modular timeline.",
          button: { label: "Register for this Course", href: "/registration" },
          secondaryButton: { label: "Consult Academic Advisor", href: "/contact-us" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 7. SCHEDULE */
  {
    id: "pub-page-schedule-complete",
    name: "Schedule — Live Training Calendar",
    category: "Full Pages",
    desc: "Complete Schedule page with timetable hero, upcoming monthly cohort matrix, and reservation CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "{{site.name}} Training Timetable",
          title: "Official Qualification Schedule & Cohort Dates",
          subtitle: "Plan your learning pathway. View rolling cohort start dates, online induction sessions, and portfolio submission deadlines.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#091224",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#f59e0b",
          badges: "Monthly Cohort Intakes | Live Assessor Drop-Ins | 24/7 Digital Portal Access",
          primaryCta: { label: "Register for Next Intake", href: "/registration" },
          secondaryCta: { label: "Admissions Helpline: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Cohort Intakes",
          title: "Upcoming Training Intakes",
          subtitle: "Select your preferred start month. All intakes feature full assessor allocation upon enrollment.",
          columns: "3",
          accent: "#3b82f6",
          items: [
            { icon: "📅", title: "Current Month Intake", text: "Registrations closing soon. Immediate tutor allocation upon enrollment verification.", image: "", href: "/registration", linkLabel: "Enroll now" },
            { icon: "📆", title: "Next Month Intake", text: "Open for standard enrollment. Ideal for learners preparing their work documentation.", image: "", href: "/registration", linkLabel: "Reserve seat" },
            { icon: "🗓️", title: "Corporate Group Intakes", text: "Custom start dates available for enterprise cohorts of 5 or more staff members.", image: "", href: "/contact-us", linkLabel: "Enquire group dates" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Need a Customized Start Date or Corporate Schedule?",
          text: "Our academic team arranges bespoke cohort timelines for corporate clients. Contact {{site.email}} or call {{site.phone}}.",
          button: { label: "Contact Admissions Team", href: "/contact-us" },
          secondaryButton: { label: "Register Candidate Online", href: "/registration" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 8. REGISTRATION */
  {
    id: "pub-page-registration-complete",
    name: "Registration — Candidate Admissions Portal",
    category: "Full Pages",
    desc: "Complete Registration page with admissions hero, 3-step registration roadmap, payment notice, and advisor hotline.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Candidate Registration",
          title: "Enroll in an Accredited Qualification",
          subtitle: "Complete your online application in minutes. Our admissions team will verify your experience and confirm your place.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#1e1b4b",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "460",
          accent: "#6366f1",
          badges: "Instant Confirmation | Zero Upfront Payment | Official Candidate ID Assigned",
          primaryCta: { label: "Proceed to Form", href: "/registration#form" },
          secondaryCta: { label: "Need Help? Call {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Admission Steps",
          title: "What Happens After You Submit",
          subtitle: "A transparent, structured enrollment procedure guided by our academic coordinators.",
          columns: "3",
          accent: "#6366f1",
          items: [
            { icon: "1️⃣", title: "1. Eligibility Review", text: "Our qualification coordinators verify your CV and prior certifications within 24 hours." },
            { icon: "2️⃣", title: "2. Enrollment Confirmation", text: "You receive your candidate onboarding pack and your designated tutor introduction." },
            { icon: "3️⃣", title: "3. Learning Portal Access", text: "Log in to access module briefing recordings, templates, and evidence criteria." },
          ],
        },
        { animation: "fade-up", paddingY: "72", bgColor: "#f8fafc", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Questions Regarding Eligibility or Prerequisites?",
          text: "Call our dedicated registration helpline at {{site.phone}} or email admissions at {{site.email}}.",
          button: { label: "Speak with Admissions Advisor", href: "/contact-us" },
          bgColor: "#312e81",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 9. RESOURCES */
  {
    id: "pub-page-resources-complete",
    name: "Resources — Knowledge Base & Downloads",
    category: "Full Pages",
    desc: "Complete Resources library with search hero, downloadable technical guides, whitepapers, and newsletter CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Technical Library & Knowledge Hub",
          title: "HSE Guides, Risk Assessment Whitepapers & Tools",
          subtitle: "Access practical resources authored by certified safety practitioners to elevate your site compliance and safety culture.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#064e3b",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "480",
          accent: "#10b981",
          badges: "Free Practitioner Guides | Inspection Checklists | Regulatory Updates | Case Studies",
          primaryCta: { label: "Browse All Resources", href: "/resources" },
          secondaryCta: { label: "Subscribe to Briefings", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Featured Publications",
          title: "Latest Practical HSE Toolkits",
          subtitle: "Downloadable resources designed for immediate worksite implementation.",
          columns: "3",
          accent: "#10b981",
          items: [
            { icon: "📋", title: "Workplace Risk Assessment Toolkit", text: "Step-by-step methodology for hazard identification and hierarchy of controls compliance.", image: "", href: "/resources", linkLabel: "Download Toolkit" },
            { icon: "🏗️", title: "Construction Safety Briefing 2026", text: "Analysis of updated UK and European worksite scaffolding and fall protection standards.", image: "", href: "/resources", linkLabel: "Read Briefing" },
            { icon: "🛡️", title: "Incident Investigation Guide", text: "Root-cause analysis framework and corrective action documentation templates.", image: "", href: "/resources", linkLabel: "View Guide" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Contribute or Request a Technical Paper",
          text: "Have a specific regulatory topic you want our faculty to research? Contact our editorial team at {{site.email}}.",
          button: { label: "Suggest a Topic", href: "/contact-us" },
          secondaryButton: { label: "View Qualifications", href: "/courses" },
          bgColor: "#064e3b",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 10. RESOURCE DETAIL */
  {
    id: "pub-page-resource-detail-complete",
    name: "Resource Detail — Single Publication Page",
    category: "Full Pages",
    desc: "Single resource article template with executive summary hero, key points, author bio, and download link.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Technical Publication",
          title: "Modern Risk Assessment & Hazard Mitigation Framework",
          subtitle: "A comprehensive operational blueprint for industrial safety managers and site supervisors.",
          align: "left",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "440",
          accent: "#10b981",
          primaryCta: { label: "Download Full PDF", href: "/resources" },
          secondaryCta: { label: "Browse All Resources", href: "/resources" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "richText",
        {
          html: "<h2>Executive Summary</h2><p>Occupational safety management begins with rigorous hazard identification. This paper outlines contemporary risk assessment methodologies, dynamic site reviews, and compliance documentation compliant with international standards.</p><h3>Key Takeaways</h3><ul><li>Hierarchy of control measures prioritized by elimination and substitution</li><li>Workforce behavioral safety observation strategies</li><li>Audit-ready incident tracking and continuous improvement cycles</li></ul>",
          maxWidth: "prose",
          align: "left",
        },
        { paddingY: "64", bgColor: "#ffffff" }
      ),
      b(
        "cta",
        {
          title: "Upgrade Your Safety Credentials with {{site.name}}",
          text: "Turn academic knowledge into accredited vocational qualifications. Call {{site.phone}} or register online.",
          button: { label: "Explore Regulated Courses", href: "/courses" },
          bgColor: "#0f172a",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 11. AWARDING BODIES */
  {
    id: "pub-page-awarding-bodies-complete",
    name: "Awarding Bodies — UK Regulatory Partners",
    category: "Full Pages",
    desc: "Accreditation authorities portal showcasing Qualifi, OTHM, ProQual, and Highfield partnerships with verification links.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "UK Regulated Qualifications",
          title: "Internationally Recognized Awarding Bodies",
          subtitle: "All diplomas delivered by {{site.name}} are formally regulated by Ofqual-approved UK Awarding Organisations.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "480",
          accent: "#3b82f6",
          badges: "Ofqual Regulated | Global Framework Equivalencies | Official Registry Verification",
          primaryCta: { label: "Browse Regulated Courses", href: "/courses" },
          secondaryCta: { label: "Verify Accreditation", href: "/qualification" },
        },
        { animation: "fade", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b("awardingBodyLogos", { title: "Our Regulated Awarding Partners", subtitle: "Official delivery centre status across leading UK institutes.", grayscale: false }, { paddingY: "48", bgColor: "#f8fafc" }),
      b(
        "cardGrid",
        {
          eyebrow: "Partner Profiles",
          title: "UK Awarding Organisations We Deliver",
          subtitle: "Learn about the awarding authorities that issue our certificates.",
          columns: "2",
          accent: "#2563eb",
          items: [
            { icon: "🏛️", title: "Qualifi Awarding Organisation", text: "A recognized UK awarding organization regulated by Ofqual, offering vocational diplomas from Level 3 to Level 7.", image: "", href: "/qualification" },
            { icon: "🏛️", title: "OTHM Qualifications", text: "UK established awarding body offering forward-thinking qualifications that enable progression to university degrees and chartered institute memberships.", image: "", href: "/qualification" },
            { icon: "🏛️", title: "ProQual Awarding Body", text: "Specialists in occupational NVQs, ensuring practical worksite competence assessment across engineering and safety disciplines.", image: "", href: "/qualification" },
            { icon: "🏛️", title: "Highfield Qualifications", text: "Top-tier UK awarding organisation known worldwide for compliance, health, safety, and training excellence.", image: "", href: "/qualification" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Verify An Awarding Body Certificate",
          text: "Our team facilitates instant third-party employer verification for all graduate credentials. Reach us at {{site.email}}.",
          button: { label: "Verify a Certificate", href: "/verify-certificate" },
          secondaryButton: { label: "Speak to an Advisor", href: "/contact-us" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 12. OUR TEAM */
  {
    id: "pub-page-team-complete",
    name: "Our Team — Faculty & Leadership Board",
    category: "Full Pages",
    desc: "Complete Team page highlighting executive leadership, chartered safety tutors, and qualification assessors.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Instructional Excellence",
          title: "Meet the Certified Faculty Behind {{site.name}}",
          subtitle: "Our assessors, internal quality assurers, and advisors bring decades of front-line occupational safety leadership.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#091224",
          gradTo: "#1e293b",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "480",
          accent: "#10b981",
          primaryCta: { label: "Explore Our Programmes", href: "/courses" },
          secondaryCta: { label: "Contact the Faculty", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Leadership & Assessors",
          title: "Experienced Chartered Safety Specialists",
          subtitle: "Every learner receives direct 1-on-1 mentorship from an accredited professional assessor.",
          columns: "3",
          accent: "#2563eb",
          items: [
            { icon: "👨‍🏫", title: "Dr. Hamza Al-Mansoor", text: "Head of Academic Quality & Lead Assessor. CMIOSH, 20+ years industrial safety experience across oil, gas, and energy infrastructure." },
            { icon: "👩‍💼", title: "Sarah Jenkins, MSc", text: "Director of Vocational Qualifications. Chartered Fellow of IIRSM, specializing in Level 6 & 7 diploma assessment standards." },
            { icon: "👨‍💼", title: "Rashid Mahmood, BEng", text: "Senior Technical Tutor. Specialist in construction HSE risk management and European machinery safety directives." },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Join Our Worldwide Faculty",
          text: "Are you a qualified chartered safety assessor or IQA? We are always interested in connecting with talented tutors. Email {{site.email}}.",
          button: { label: "Send Academic CV", href: "/contact-us" },
          bgColor: "#0f172a",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 13. OUR CONSULTANTS */
  {
    id: "pub-page-consultants-complete",
    name: "Our Consultants — Senior HSE Advisory Board",
    category: "Full Pages",
    desc: "Consultants page featuring enterprise HSE advisors, corporate audit specialists, and compliance engineers.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Enterprise Advisory",
          title: "Senior HSE Consultants & Safety Auditors",
          subtitle: "Providing high-level strategic safety consultancy, statutory audits, and bespoke management frameworks for corporate operators.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#0f172a",
          gradTo: "#1e1b4b",
          gradAngle: "140",
          textColor: "#ffffff",
          minHeight: "480",
          accent: "#8b5cf6",
          primaryCta: { label: "Request Corporate Consultation", href: "/contact-us" },
          secondaryCta: { label: "Call Enterprise Desk: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Advisory Capabilities",
          title: "Bespoke Corporate HSE Consultancy",
          subtitle: "Tailored to high-risk environments including construction, offshore energy, and manufacturing.",
          columns: "3",
          accent: "#8b5cf6",
          items: [
            { icon: "🔍", title: "Comprehensive Safety Audits", text: "Independent, rigorous gap analyses evaluating compliance with ISO 45001 and statutory regulations." },
            { icon: "📊", title: "Enterprise Risk Management", text: "Quantitative hazard modeling, bow-tie risk assessments, and executive governance workshops." },
            { icon: "🏗️", title: "Site Inspection & Protocols", text: "On-site third-party safety supervision and contractor competence monitoring." },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Partner with {{site.name}} Senior Consultants",
          text: "Discuss your organization's risk profile and compliance targets with our consulting directors. Email {{site.email}} or call {{site.phone}}.",
          button: { label: "Schedule Executive Briefing", href: "/contact-us" },
          bgColor: "#1e1b4b",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 14. ACCREDITATIONS & CERTIFICATIONS */
  {
    id: "pub-page-accreditations-complete",
    name: "Accreditations — Quality & Regulatory Standards",
    category: "Full Pages",
    desc: "Complete Accreditations showcase detailing regulatory frameworks, quality approvals, and compliance verification.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Regulatory Assurance",
          title: "Accredited Standards That Give Your Diploma Global Weight",
          subtitle: "{{site.name}} holds approved delivery centre status with recognized UK Awarding Organisations, ensuring complete validity for every graduate.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "500",
          accent: "#3b82f6",
          badges: "Ofqual Regulated | ISO 9001 Quality Assured | European Qualifications Framework Aligned",
          primaryCta: { label: "Explore Regulated Courses", href: "/courses" },
          secondaryCta: { label: "Verify a Certificate", href: "/verify-certificate" },
        },
        { animation: "fade", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b("accreditationLogos", { title: "Institutional Accreditation Approvals", subtitle: "Audited and endorsed by external quality regulators.", grayscale: false }, { paddingY: "48", bgColor: "#f8fafc" }),
      b(
        "cardGrid",
        {
          eyebrow: "Compliance Frameworks",
          title: "How Our Accreditations Protect You",
          subtitle: "Strict adherence to assessment integrity, anti-plagiarism protocols, and external moderation.",
          columns: "3",
          accent: "#2563eb",
          items: [
            { icon: "🛡️", title: "Ofqual Regulation", text: "Regulated by the UK government's Office of Qualifications and Examinations Regulation for absolute authenticity." },
            { icon: "🌐", title: "International Portability", text: "Diplomas mapped to European (EQF) and international vocational benchmarks for worldwide job mobility." },
            { icon: "🔒", title: "Permanent Verification", text: "Every issued credential is permanently recorded on official registries for instant employer authentication." },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Verify Institutional Center Status",
          text: "Have verification or auditing questions? Contact our quality assurance desk at {{site.email}} or call {{site.phone}}.",
          button: { label: "Contact Quality Team", href: "/contact-us" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 15. FAQS */
  {
    id: "pub-page-faqs-complete",
    name: "FAQs — Comprehensive Candidate Help Hub",
    category: "Full Pages",
    desc: "Complete FAQs page with categorized accordions covering Admissions, Courses, Examinations, and Certificates.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Candidate Help Centre",
          title: "Frequently Asked Questions",
          subtitle: "Get immediate answers to questions about qualifications, admission requirements, assessment timelines, and payment procedures.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#0f172a",
          gradTo: "#1e293b",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "440",
          accent: "#3b82f6",
          primaryCta: { label: "Online Registration", href: "/registration" },
          secondaryCta: { label: "Admissions Phone: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "faq",
        {
          title: "Admissions & Entry Criteria",
          subtitle: "Requirements for enrolling in NVQ Level 3 to Level 7 Diplomas.",
          columns: "1",
          accent: "#2563eb",
          items: [
            { q: "What qualifications do I need to start Level 6?", a: "Candidates should typically hold a Level 3 or 5 safety qualification, or possess minimum 3 years of active worksite health and safety experience." },
            { q: "Do I have to sit written exams?", a: "No. Our vocational NVQs are assessed through a portfolio of workplace evidence demonstrating practical competence, evaluated by a dedicated assessor." },
            { q: "How long does certification take?", a: "Most candidates complete their evidence portfolio in 4 to 6 months. Fast-track options are available for seasoned practitioners." },
          ],
        },
        { animation: "fade-up", paddingY: "64", bgColor: "#ffffff", css: MODERN_CSS.heading }
      ),
      b(
        "faq",
        {
          title: "Recognition & Certification",
          subtitle: "Details on awarding bodies, Ofqual regulation, and employer verification.",
          columns: "1",
          accent: "#10b981",
          items: [
            { q: "Is the certificate issued directly by the UK Awarding Body?", a: "Yes. Upon successful moderation of your portfolio, your official certificate is issued directly by Qualifi, OTHM, or the designated UK awarding body." },
            { q: "Can my employer verify my certificate?", a: "Yes. Certificates feature an official verification number verifiable 24/7 on both our portal and the awarding body registry." },
            { q: "Does Level 6 lead to GradIOSH?", a: "Yes. The Level 6 Diploma in Occupational Health & Safety meets the academic criteria for GradIOSH membership application." },
          ],
        },
        { animation: "fade-up", paddingY: "64", bgColor: "#f8fafc", css: MODERN_CSS.heading }
      ),
      b(
        "cta",
        {
          title: "Didn't Find Your Answer?",
          text: "Our admissions advisors are available Monday to Saturday to answer any questions. Call {{site.phone}} or email {{site.email}}.",
          button: { label: "Ask an Advisor Directly", href: "/contact-us" },
          bgColor: "#1d4ed8",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 16. PROFESSIONAL DEVELOPMENT */
  {
    id: "pub-page-professional-complete",
    name: "Professional Development — CPD & Executive Hub",
    category: "Full Pages",
    desc: "Complete Professional Development portal covering CPD programmes, executive coaching, and bespoke safety frameworks.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Continuous Professional Development",
          title: "Elevate Your Technical Leadership with CPD Programmes",
          subtitle: "Targeted executive training, advanced risk assessment masterclasses, and corporate compliance certifications.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#064e3b",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "560",
          primaryCta: { label: "Enquire About CPD", href: "/contact-us" },
          secondaryCta: { label: "Corporate Training", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "80", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Programme Pillars",
          title: "Specialized Professional Development Streams",
          subtitle: "Modular courses tailored to senior engineers, HSE directors, and site supervisors.",
          columns: "3",
          accent: "#10b981",
          items: [
            { icon: "🎯", title: "Continuous Professional Development (CPD)", text: "Accredited short courses for annual professional membership renewal and skills upkeep.", image: "", href: "/courses" },
            { icon: "⚡", title: "Executive Safety Leadership", text: "High-level strategic safety governance for C-suite and managing directors.", image: "", href: "/contact-us" },
            { icon: "🛡️", title: "Bespoke Corporate Workshops", text: "Tailored safety protocols delivered directly to your project workforce.", image: "", href: "/contact-us" },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Empower Your Corporate Team",
          text: "Discuss customized group training modules with our academic faculty. Email {{site.email}} or call {{site.phone}}.",
          button: { label: "Request Corporate Proposal", href: "/contact-us" },
          bgColor: "#065f46",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 17. VERIFY CERTIFICATE */
  {
    id: "pub-page-verify-certificate-complete",
    name: "Verify Certificate — Official Verification Portal",
    category: "Full Pages",
    desc: "Complete Certificate Verification portal with authentication hero, security guarantees, anti-fraud checklist, and support contacts.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Official Verification System",
          title: "Verify An Official {{site.name}} Certificate",
          subtitle: "Authenticate qualifications in seconds. Trusted by employers, engineering contractors, and government regulators worldwide.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#042f2e",
          gradTo: "#091224",
          gradAngle: "145",
          textColor: "#ffffff",
          minHeight: "480",
          accent: "#14b8a6",
          badges: "Live Database Sync | Cryptographic Security | Anti-Fraud QR Code Validated",
          primaryCta: { label: "Verify Online", href: "/verify-certificate" },
          secondaryCta: { label: "Verification Helpline: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Security Standards",
          title: "How {{site.name}} Protects Credential Integrity",
          subtitle: "Multi-layered validation preventing fraud and ensuring genuine qualification records.",
          columns: "3",
          accent: "#0d9488",
          items: [
            { icon: "🔒", title: "Unique Certificate Reference", text: "Every diploma carries an unforgeable candidate and certificate ID linked to the student portfolio." },
            { icon: "🏛️", title: "Awarding Body Synchronization", text: "Records cross-referenced directly with UK Ofqual-regulated awarding organisation central databases." },
            { icon: "📱", title: "Instant QR Validation", text: "Scanning the physical certificate QR code routes directly to the cryptographically verified graduate profile." },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Need An Official Verification Letter For Visa or Employment?",
          text: "Our registrar office provides formal confirmation letters on official letterhead within 24 hours. Contact {{site.email}}.",
          button: { label: "Request Verification Letter", href: "/contact-us" },
          bgColor: "#0f172a",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 18. CORPORATE PARTNER */
  {
    id: "pub-page-partner-complete",
    name: "Corporate Partner — Enterprise B2B Safety Solutions",
    category: "Full Pages",
    desc: "Complete Enterprise partner page with workforce benefits, group discount tiers, bespoke syllabus options, and proposal CTA.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Enterprise Safety Partnerships",
          title: "Strategic Workforce Qualification & Compliance Partnerships",
          subtitle: "Partner with {{site.name}} to train and certify your engineering and construction teams at preferred enterprise rates.",
          align: "left",
          bgType: "gradient",
          gradFrom: "#1e3a8a",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "520",
          accent: "#60a5fa",
          badges: "Corporate Invoicing | Dedicated Account Manager | Customized Delivery Schedules",
          primaryCta: { label: "Request Corporate Proposal", href: "/contact-us" },
          secondaryCta: { label: "Call Enterprise Desk: {{site.phone}}", href: "tel:{{site.phone}}" },
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Enterprise Benefits",
          title: "Why Corporate Clients Partner with {{site.name}}",
          subtitle: "Measurable reduction in worksite safety risks and streamlined audit compliance.",
          columns: "3",
          accent: "#2563eb",
          items: [
            { icon: "💼", title: "Dedicated Corporate Manager", text: "Single point of contact for candidate onboarding, progress reports, and certification delivery." },
            { icon: "💰", title: "Volume Tiered Pricing", text: "Significant fee discounts for organizations enrolling cohorts of 5, 10, or 25+ engineers." },
            { icon: "📊", title: "Executive Progress Dashboard", text: "Real-time visibility into staff submission milestones, assessor feedback, and completion timelines." },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Schedule An Enterprise Consultation Today",
          text: "Let our corporate directors design a customized safety qualification program for your enterprise. Call {{site.phone}} or email {{site.email}}.",
          button: { label: "Schedule Corporate Meeting", href: "/contact-us" },
          bgColor: "#1e3a8a",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },

  /* 19. PRIVACY POLICY */
  {
    id: "pub-page-privacy-policy-complete",
    name: "Privacy Policy — Data Protection & GDPR",
    category: "Full Pages",
    desc: "Complete Privacy Policy page with data governance hero, clear legal clauses, data rights, and DPO contact details.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Data Protection & Privacy",
          title: "{{site.name}} Privacy Policy",
          subtitle: "We are committed to safeguarding candidate personal data in full compliance with UK GDPR and international data protection standards.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "380",
          primaryCta: { label: "Contact Data Officer", href: "mailto:{{site.email}}" },
          secondaryCta: { label: "Back to Home", href: "/" },
        },
        { animation: "fade", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "richText",
        {
          html: "<h2>1. Information We Collect</h2><p>{{site.name}} collects candidate identification, contact details (phone, email, postal address), qualification history, and portfolio evidence strictly for educational registration, assessment, and certification purposes.</p><h2>2. How We Use Your Data</h2><p>Your data is shared securely with UK Ofqual-regulated Awarding Bodies to process your formal registration and certificate issuance. We do not sell, rent, or trade personal information to third parties.</p><h2>3. Your Data Rights</h2><p>You have the right to request access, correction, or deletion of your personal records. Contact our Data Protection Officer at {{site.email}} for any inquiries.</p>",
          maxWidth: "prose",
          align: "left",
        },
        { paddingY: "64", bgColor: "#ffffff" }
      ),
    ],
  },

  /* 20. TERMS OF SERVICES */
  {
    id: "pub-page-terms-complete",
    name: "Terms of Service — Candidate Agreement",
    category: "Full Pages",
    desc: "Complete Terms of Service page covering candidate enrollment terms, academic integrity, portfolio submission rules, and dispute resolution.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Terms & Conditions",
          title: "{{site.name}} Terms of Service",
          subtitle: "Please read these terms and conditions carefully before enrolling in any qualification or professional development programme.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "380",
          primaryCta: { label: "Contact Legal Team", href: "mailto:{{site.email}}" },
          secondaryCta: { label: "Explore Courses", href: "/courses" },
        },
        { animation: "fade", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "richText",
        {
          html: "<h2>1. Enrollment & Candidate Obligations</h2><p>Upon registration, candidates agree to submit authentic, original workplace evidence. Plagiarism or submission of fraudulent documentation results in immediate disqualification and reporting to the awarding body.</p><h2>2. Tutor Support & Assessment</h2><p>{{site.name}} assigns an accredited assessor to review submissions and provide constructive guidance according to the official awarding body criteria.</p><h2>3. Certification & Issuance</h2><p>Certificates are issued only after full portfolio verification and external moderation by the authorized UK awarding organisation.</p>",
          maxWidth: "prose",
          align: "left",
        },
        { paddingY: "64", bgColor: "#ffffff" }
      ),
    ],
  },

  /* 21. REFUND POLICY */
  {
    id: "pub-page-refund-policy-complete",
    name: "Refund Policy — Candidate Fee Protection",
    category: "Full Pages",
    desc: "Complete Refund Policy page detailing cooling-off periods, withdrawal guidelines, and fee protection terms.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Fee Protection Policy",
          title: "{{site.name}} Refund & Cancellation Policy",
          subtitle: "Clear, fair guidelines governing enrollment cancellations, course transfers, and fee adjustments.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "380",
          primaryCta: { label: "Contact Accounts: {{site.email}}", href: "mailto:{{site.email}}" },
          secondaryCta: { label: "Admissions Home", href: "/" },
        },
        { animation: "fade", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "richText",
        {
          html: "<h2>1. 14-Day Cooling-Off Period</h2><p>Candidates are entitled to a full refund within 14 calendar days of initial enrollment, provided learning materials have not been accessed and awarding body registration has not been finalized.</p><h2>2. Course Transfers & Deferrals</h2><p>If an active candidate experiences unforeseen work or personal circumstances, {{site.name}} offers complimentary cohort deferral up to 12 months without penalty.</p><h2>3. How to Request a Refund</h2><p>Submit written notification with your registration reference to {{site.email}}. Requests are evaluated within 5 business days.</p>",
          maxWidth: "prose",
          align: "left",
        },
        { paddingY: "64", bgColor: "#ffffff" }
      ),
    ],
  },

  /* 22. LOGO USE POLICY */
  {
    id: "pub-page-logo-use-complete",
    name: "Logo Use Policy — Brand Assets & Trademarks",
    category: "Full Pages",
    desc: "Complete Logo Use Policy page providing guidelines for corporate partners, alumni badges, and trademark usage.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Brand Guidelines",
          title: "{{site.name}} Logo & Brand Usage Policy",
          subtitle: "Guidelines for certified alumni, accredited corporate partners, and media outlets referencing {{site.name}} branding.",
          align: "center",
          bgType: "solid",
          bgColor: "#091224",
          textColor: "#ffffff",
          minHeight: "380",
          primaryCta: { label: "Request Brand Kit", href: "mailto:{{site.email}}" },
          secondaryCta: { label: "Back to Home", href: "/" },
        },
        { animation: "fade", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "richText",
        {
          html: "<h2>1. Authorized Partner Usage</h2><p>Corporate partners in good standing may display the official {{site.name}} Partner emblem on their websites and corporate capability statements to indicate approved training collaboration.</p><h2>2. Graduate Badges</h2><p>Alumni who have successfully completed regulated diplomas may display the {{site.name}} Graduate badge on LinkedIn profiles and personal CVs alongside their official certificate ID.</p><h2>3. Prohibited Modifications</h2><p>The {{site.name}} logo must not be recolored, distorted, or displayed in any manner implying endorsement of non-accredited services.</p>",
          maxWidth: "prose",
          align: "left",
        },
        { paddingY: "64", bgColor: "#ffffff" }
      ),
    ],
  },

  /* 23. GLOSSARY OF TERMS */
  {
    id: "pub-page-glossary-complete",
    name: "Glossary of Terms — Safety & Vocational Terminology",
    category: "Full Pages",
    desc: "Complete Occupational Safety & Qualifications Glossary breaking down NVQ, RQF, Ofqual, CMIOSH, and HSE terms.",
    blocks: [
      b(
        "hero",
        {
          eyebrow: "Industry Reference",
          title: "Occupational Safety & Qualification Glossary",
          subtitle: "Understand key acronyms, regulatory frameworks, and chartered institute terminologies used across UK and international safety education.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#0b2246",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "420",
          accent: "#3b82f6",
          primaryCta: { label: "Browse Qualifications", href: "/courses" },
          secondaryCta: { label: "Contact Admissions", href: "/contact-us" },
        },
        { animation: "fade-up", paddingY: "64", css: MODERN_CSS.heading }
      ),
      b(
        "cardGrid",
        {
          eyebrow: "Key Acronyms & Definitions",
          title: "Essential Qualification Acronyms Decoded",
          subtitle: "Click through our glossary to understand regulatory framework levels.",
          columns: "3",
          accent: "#2563eb",
          items: [
            { icon: "📖", title: "Ofqual", text: "The Office of Qualifications and Examinations Regulation — the non-ministerial government department regulating UK vocational qualifications." },
            { icon: "📖", title: "NVQ", text: "National Vocational Qualification — work-based competence awards assessing practical capability rather than theoretical written examinations." },
            { icon: "📖", title: "RQF / EQF", text: "Regulated Qualifications Framework (UK) and European Qualifications Framework, ensuring cross-border academic credit equivalency." },
            { icon: "📖", title: "CMIOSH", text: "Chartered Member of the Institution of Occupational Safety and Health — the premier international gold standard for safety professionals." },
            { icon: "📖", title: "IQA / EQA", text: "Internal and External Quality Assurers responsible for auditing portfolio marking standards to guarantee grading fairness." },
            { icon: "📖", title: "CPD", text: "Continuing Professional Development — ongoing learning required by chartered institutes to maintain certified practitioner status." },
          ],
        },
        { animation: "fade-up", paddingY: "80", bgColor: "#ffffff", css: MODERN_CSS.cardHover }
      ),
      b(
        "cta",
        {
          title: "Ready to Earn Your Regulated Qualification?",
          text: "Start your journey today with {{site.name}}. Contact our qualification team at {{site.phone}} or email {{site.email}}.",
          button: { label: "Register for a Course", href: "/registration" },
          bgColor: "#091224",
          textColor: "#ffffff",
        },
        { animation: "fade-up", paddingY: "72", css: MODERN_CSS.heading }
      ),
    ],
  },
];

export const PUBLIC_WEBSITE_TEMPLATES = [
  ...MODERN_FULL_PAGES,
  ...MODERN_PUBLIC_SECTIONS,
];
