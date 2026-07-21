// Ready-made section templates ("patterns"). Each template is one or more
// pre-styled blocks. Inserting a template appends fully-editable blocks to the
// page, so users can tweak content, design, positioning and drag order after.
//
// A template block = { type, props, style? }. `createBlocksFromTemplate` turns
// these into real blocks (fresh ids + merged default _style). `style` seeds the
// block's Design tab (gradients, animations, spacing, hover, etc.).
import { newId, defaultStyle } from "@/Components/cms/blockSchemas";

const b = (type, props = {}, style = {}) => ({ type, props, style });

export const TEMPLATE_CATEGORIES = [
  "Full Pages",
  "Heroes",
  "Sliders",
  "Features",
  "Stats",
  "Testimonials",
  "Pricing",
  "Team",
  "Gallery",
  "Logos",
  "Content",
  "FAQ",
  "Call To Action",
  "Video",
  "Custom / Tailwind",
];

/* ---------- reusable pieces ---------- */
const heroDark = (title, subtitle, eyebrow = "") =>
  b("hero", {
    eyebrow, title, subtitle, align: "center", bgType: "solid", bgColor: "#0f172a", textColor: "#ffffff",
    primaryCta: { label: "Get Started", href: "/contact-us" },
    secondaryCta: { label: "Learn More", href: "/about-us" }, image: "",
  });

const heroGradient = (title, subtitle, eyebrow, from, to, angle = 135) =>
  b("hero", {
    eyebrow, title, subtitle, align: "center", bgType: "gradient", gradFrom: from, gradTo: to, gradAngle: String(angle),
    textColor: "#ffffff", minHeight: "560",
    primaryCta: { label: "Get Started", href: "/contact-us" },
    secondaryCta: { label: "Learn More", href: "/about-us" }, image: "",
  });

const cards3 = (title, items, style = {}) => b("cardGrid", { title, subtitle: "", columns: "3", items }, style);
const up = { animation: "fade-up" };

const slide = (title, caption, href = "", ctaLabel = "") => ({ image: "", title, caption, href, ctaLabel });

/* ---------- templates ---------- */
export const TEMPLATES = [
  /* ===== FULL PAGES ===== */
  {
    id: "page-home",
    name: "Home Page (complete)",
    category: "Full Pages",
    desc: "Hero + slider + features + stats + testimonials + CTA",
    blocks: [
      heroDark("Setting the Benchmark in Technical & Safety Certification", "Globally recognized qualifications that strengthen compliance, reduce risk and build professional credibility.", "Ababeel"),
      b("carousel", {
        height: "460", variant: "fade", contentAlign: "bottom", autoplay: true, interval: "4", showArrows: true, showDots: true, rounded: true, kenBurns: true,
        slides: [
          slide("Accredited Programs", "Industry-aligned safety qualifications", "/qualification", "Explore"),
          slide("Professional Development", "Advance your career with CPD", "/professional-dev", "Learn more"),
          slide("Global Recognition", "Certificates trusted worldwide", "/about-us", "About us"),
        ],
      }),
      cards3("Why Choose Ababeel", [
        { icon: "🛡️", title: "Accredited Standards", text: "Aligned with international safety and technical frameworks.", image: "", href: "" },
        { icon: "🎓", title: "Recognized Qualifications", text: "Certificates that build real professional credibility.", image: "", href: "" },
        { icon: "🌍", title: "Global Reach", text: "Trusted by learners and organizations across 25+ countries.", image: "", href: "" },
      ], up),
      b("stats", { title: "", bgColor: "#f1f5f9", items: [
        { value: "10+", label: "Years experience" },
        { value: "500+", label: "Certified professionals" },
        { value: "25+", label: "Countries" },
        { value: "98%", label: "Satisfaction" },
      ] }, up),
      b("testimonials", { title: "What Our Learners Say", layout: "grid", items: [
        { quote: "The certification opened new career opportunities for me.", name: "A. Rahman", role: "Safety Officer", avatar: "", rating: "5" },
        { quote: "Professional, structured and globally respected.", name: "S. Khan", role: "Site Manager", avatar: "", rating: "5" },
        { quote: "Helped our whole team get compliant fast.", name: "M. Iqbal", role: "HSE Lead", avatar: "", rating: "5" },
      ] }, up),
      b("cta", { title: "Ready to get certified?", text: "Join hundreds of professionals advancing their careers with Ababeel.", button: { label: "Contact Us", href: "/contact-us" } }, { bgType: "gradient", gradFrom: "#2563eb", gradTo: "#1e3a8a", textColor: "#ffffff", animation: "zoom-in" }),
    ],
  },
  {
    id: "page-home-gradient",
    name: "Home Page (gradient style)",
    category: "Full Pages",
    desc: "Gradient hero + feature cards + stats + testimonials grid + gradient CTA",
    blocks: [
      heroGradient("Build a Safer, More Competent Workforce", "Accredited safety and technical qualifications, delivered with modern learning and global recognition.", "Ababeel", "#4f46e5", "#0ea5e9", 130),
      cards3("Everything you need", [
        { icon: "⚡", title: "Fast Certification", text: "Streamlined assessment and instant digital certificates.", image: "", href: "" },
        { icon: "🏅", title: "Recognized Awards", text: "Qualifications that employers trust and value.", image: "", href: "" },
        { icon: "🤝", title: "Ongoing Support", text: "Guidance from enrollment through to certification.", image: "", href: "" },
      ], up),
      b("stats", { title: "Trusted at scale", items: [
        { value: "500+", label: "Professionals" }, { value: "25+", label: "Countries" }, { value: "98%", label: "Pass rate" }, { value: "4.9", label: "Avg rating" },
      ] }, { bgType: "gradient", gradFrom: "#0f172a", gradTo: "#1e293b", textColor: "#ffffff", animation: "fade-up" }),
      b("testimonials", { title: "Loved by professionals", layout: "grid", items: [
        { quote: "Outstanding experience from start to finish.", name: "Jane Doe", role: "Safety Officer", avatar: "", rating: "5" },
        { quote: "Truly professional and globally recognized.", name: "John Smith", role: "Manager", avatar: "", rating: "5" },
        { quote: "Got promoted within months of certifying.", name: "Aisha K.", role: "HSE Lead", avatar: "", rating: "5" },
      ] }, up),
      b("cta", { title: "Start your journey today", text: "Talk to our team about the right program for you.", button: { label: "Get in Touch", href: "/contact-us" } }, { bgType: "gradient", gradFrom: "#7c3aed", gradTo: "#2563eb", textColor: "#ffffff", animation: "zoom-in" }),
    ],
  },
  {
    id: "page-qualification",
    name: "Qualifications Page",
    category: "Full Pages",
    desc: "Hero + program cards + pricing + FAQ + CTA",
    blocks: [
      heroDark("Our Qualifications", "Structured qualification frameworks designed to assess competence and uphold industry standards.", "Programs"),
      cards3("Popular Qualifications", [
        { icon: "🔥", title: "Fire Safety", text: "Comprehensive fire prevention and response training.", image: "", href: "" },
        { icon: "⚗️", title: "Chemical Safety", text: "Safe handling, storage and risk assessment.", image: "", href: "" },
        { icon: "🏗️", title: "Construction Safety", text: "Site safety, hazard control and compliance.", image: "", href: "" },
      ], up),
      b("pricing", {
        title: "Qualification Levels", subtitle: "Choose the level that fits your goals",
        tiers: [
          { name: "Foundation", price: "£99", period: "/course", features: "Core modules\nDigital certificate\nEmail support", cta: { label: "Enroll", href: "/contact-us" }, highlighted: false },
          { name: "Advanced", price: "£199", period: "/course", features: "All Foundation content\nPractical assessment\nPrinted certificate\nMentoring", cta: { label: "Enroll", href: "/contact-us" }, highlighted: true },
          { name: "Professional", price: "£349", period: "/course", features: "Advanced content\nCase studies\nCPD hours\nPriority support", cta: { label: "Enroll", href: "/contact-us" }, highlighted: false },
        ],
      }, up),
      b("faq", { title: "Qualification FAQs", items: [
        { q: "Are the qualifications internationally recognized?", a: "Yes — our programs align with international standards and are recognized across industries." },
        { q: "How long does a course take?", a: "Most courses can be completed within 4–8 weeks depending on the level." },
      ] }),
      b("cta", { title: "Start your qualification today", text: "Speak to our team about the right program for you.", button: { label: "Get in Touch", href: "/contact-us" }, bgColor: "#0f172a", textColor: "#ffffff" }),
    ],
  },
  {
    id: "page-about",
    name: "About Page",
    category: "Full Pages",
    desc: "Hero + mission + team + stats",
    blocks: [
      heroDark("About Ababeel", "Pioneering safety and technical education for a safer, more competent world.", "Who We Are"),
      b("richText", { html: "<h2>Our Mission</h2><p>To advance workplace safety and technical competence through globally recognized qualifications, structured assessment and continuous professional development.</p>", maxWidth: "prose", align: "center" }, up),
      b("stats", { title: "", bgColor: "#f8fafc", items: [
        { value: "2015", label: "Founded" }, { value: "500+", label: "Graduates" }, { value: "25+", label: "Countries" }, { value: "50+", label: "Programs" },
      ] }, up),
      b("team", { title: "Meet Our Team", columns: "3", members: [
        { photo: "", name: "Full Name", role: "Founder & CEO", bio: "" },
        { photo: "", name: "Full Name", role: "Head of Training", bio: "" },
        { photo: "", name: "Full Name", role: "Lead Assessor", bio: "" },
      ] }, up),
    ],
  },
  {
    id: "page-landing",
    name: "Landing / Promo Page",
    category: "Full Pages",
    desc: "Banner + gradient hero + features + testimonials + pricing + CTA",
    blocks: [
      b("banner", { text: "🎉 New qualifications now open for enrollment!", href: "/qualification", bgColor: "#111827", textColor: "#ffffff" }),
      heroGradient("Advance Your Safety Career", "Enroll in accredited programs trusted by professionals worldwide.", "Limited Seats", "#db2777", "#f97316", 135),
      cards3("What You Get", [
        { icon: "✅", title: "Accredited Certificate", text: "Recognized proof of competence.", image: "", href: "" },
        { icon: "📚", title: "Expert Content", text: "Built by industry practitioners.", image: "", href: "" },
        { icon: "🤝", title: "Ongoing Support", text: "Guidance from enrollment to certification.", image: "", href: "" },
      ], up),
      b("cta", { title: "Enroll before seats fill up", text: "Secure your place in the next intake.", button: { label: "Enroll Now", href: "/contact-us" } }, { bgType: "gradient", gradFrom: "#2563eb", gradTo: "#7c3aed", textColor: "#ffffff", animation: "zoom-in" }),
    ],
  },

  /* ===== HEROES ===== */
  { id: "hero-dark-center", name: "Hero — Dark Centered", category: "Heroes", desc: "Classic dark hero with two buttons", blocks: [heroDark("Your Bold Headline Goes Here", "A concise supporting sentence that explains your value proposition.", "Welcome")] },
  { id: "hero-grad-ocean", name: "Hero — Ocean Gradient", category: "Heroes", desc: "Blue→navy gradient, tall", blocks: [heroGradient("Grow with confidence", "Everything you need to succeed, in one place.", "New", "#2563eb", "#0f172a", 135)] },
  { id: "hero-grad-violet", name: "Hero — Violet Gradient", category: "Heroes", desc: "Purple→blue gradient", blocks: [heroGradient("Learn. Certify. Advance.", "Modern qualifications for modern professionals.", "Ababeel", "#7c3aed", "#2563eb", 130)] },
  { id: "hero-grad-sunset", name: "Hero — Sunset Gradient", category: "Heroes", desc: "Orange→pink gradient", blocks: [heroGradient("Make an impact today", "Bold, warm and impossible to ignore.", "Featured", "#f97316", "#db2777", 135)] },
  { id: "hero-grad-emerald", name: "Hero — Emerald Gradient", category: "Heroes", desc: "Green gradient", blocks: [heroGradient("Sustainable, safe, certified", "Qualifications aligned with a safer future.", "Green", "#10b981", "#065f46", 135)] },
  { id: "hero-left", name: "Hero — Left Aligned", category: "Heroes", desc: "Left aligned dark hero", blocks: [b("hero", { eyebrow: "Ababeel", title: "Safety qualifications that mean something", subtitle: "Assess competence and strengthen credibility with accredited programs.", align: "left", bgType: "solid", bgColor: "#0b1220", textColor: "#ffffff", minHeight: "520", primaryCta: { label: "Explore Programs", href: "/qualification" }, secondaryCta: { label: "Contact", href: "/contact-us" }, image: "" })] },
  { id: "hero-image", name: "Hero — Image Background", category: "Heroes", desc: "Photo background with overlay (add image)", blocks: [b("hero", { eyebrow: "", title: "Make an impact", subtitle: "Add a background image in the Content tab to complete this hero.", align: "center", bgColor: "#000000", textColor: "#ffffff", image: "", overlay: "55", minHeight: "600", primaryCta: { label: "Get Started", href: "/contact-us" }, secondaryCta: { label: "", href: "" } })] },
  { id: "hero-image-soft", name: "Hero — Image (soft overlay)", category: "Heroes", desc: "Photo bg, light overlay, left aligned", blocks: [b("hero", { eyebrow: "Featured", title: "Where competence meets confidence", subtitle: "Add a background image to finish this hero.", align: "left", bgColor: "#111827", textColor: "#ffffff", image: "", overlay: "35", minHeight: "620", primaryCta: { label: "Get Started", href: "/contact-us" }, secondaryCta: { label: "Learn More", href: "/about-us" } })] },
  { id: "hero-light", name: "Hero — Light", category: "Heroes", desc: "Light hero with dark text", blocks: [b("hero", { eyebrow: "Introducing", title: "A cleaner way to learn", subtitle: "Bright, modern and welcoming.", align: "center", bgType: "solid", bgColor: "#f8fafc", textColor: "#0f172a", primaryCta: { label: "Start Now", href: "/contact-us" }, secondaryCta: { label: "Learn More", href: "/about-us" }, image: "" })] },
  { id: "hero-glass", name: "Hero — Glass (Tailwind)", category: "Heroes", desc: "Gradient + glass card, fully editable HTML", blocks: [b("customCode", { tailwind: true, html: '<section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white">\n  <div class="max-w-5xl mx-auto px-6 py-28 text-center">\n    <div class="inline-block rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 px-8 py-12 shadow-2xl">\n      <span class="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/15">Premium</span>\n      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight">A hero that stands out</h1>\n      <p class="mt-5 text-lg text-blue-100 max-w-2xl mx-auto">Glassmorphism card over a rich gradient. Edit every class to taste.</p>\n      <a href="/contact-us" class="inline-block mt-8 px-8 py-3.5 rounded-xl bg-white text-indigo-700 font-semibold shadow-lg hover:scale-105 transition">Get Started</a>\n    </div>\n  </div>\n</section>' })] },

  /* ===== SLIDERS ===== */
  { id: "slider-fade", name: "Slider — Fade", category: "Sliders", desc: "Smooth cross-fade, 3 slides", blocks: [b("carousel", { height: "460", variant: "fade", contentAlign: "bottom", autoplay: true, interval: "4", showArrows: true, showDots: true, rounded: true, slides: [slide("Slide One", "Add your caption"), slide("Slide Two", "Add your caption"), slide("Slide Three", "Add your caption")] })] },
  { id: "slider-slide", name: "Slider — Horizontal Slide", category: "Sliders", desc: "Slides move left/right", blocks: [b("carousel", { height: "460", variant: "slide", contentAlign: "bottom", autoplay: true, interval: "4", showArrows: true, showDots: true, rounded: true, slides: [slide("First", "Sliding transition"), slide("Second", "Sliding transition"), slide("Third", "Sliding transition")] })] },
  { id: "slider-zoom", name: "Slider — Zoom", category: "Sliders", desc: "Zoom-in transition + Ken Burns", blocks: [b("carousel", { height: "480", variant: "zoom", contentAlign: "center", overlay: "45", kenBurns: true, autoplay: true, interval: "5", showArrows: true, showDots: true, rounded: true, slides: [slide("Cinematic", "Zoom + slow pan"), slide("Immersive", "Great for photos"), slide("Bold", "Center captions")] })] },
  { id: "slider-full", name: "Slider — Full-Bleed Hero", category: "Sliders", desc: "Edge-to-edge, center captions", blocks: [b("carousel", { height: "620", variant: "fade", contentAlign: "center", overlay: "50", fullWidth: true, kenBurns: true, autoplay: true, interval: "5", showArrows: true, showDots: true, rounded: false, slides: [slide("Big Statement", "Full-width hero slider", "/qualification", "Explore"), slide("Second Statement", "Center-aligned overlay text", "/about-us", "Learn more")] })] },
  { id: "slider-up", name: "Slider — Slide Up", category: "Sliders", desc: "Vertical slide-up transition", blocks: [b("carousel", { height: "440", variant: "slide-up", contentAlign: "left", overlay: "40", autoplay: true, interval: "4", showArrows: false, showDots: true, rounded: true, slides: [slide("Rise", "Slides move upward"), slide("Shine", "Left-aligned captions"), slide("Repeat", "Clean and modern")] })] },
  { id: "slider-cards", name: "Slider + Feature cards", category: "Sliders", desc: "Carousel above a 3-card row", blocks: [ b("carousel", { height: "420", variant: "fade", autoplay: true, interval: "4", showArrows: true, showDots: true, rounded: true, slides: [slide("Highlight", "Feature something"), slide("Highlight", "Feature something")] }), cards3("Highlights", [ { icon: "⭐", title: "Point one", text: "Short description.", image: "", href: "" }, { icon: "⭐", title: "Point two", text: "Short description.", image: "", href: "" }, { icon: "⭐", title: "Point three", text: "Short description.", image: "", href: "" } ], up) ] },

  /* ===== FEATURES ===== */
  { id: "feat-3", name: "Features — 3 Columns", category: "Features", desc: "Three icon cards, animated", blocks: [cards3("Our Services", [ { icon: "🎯", title: "Feature one", text: "Describe this feature.", image: "", href: "" }, { icon: "⚡", title: "Feature two", text: "Describe this feature.", image: "", href: "" }, { icon: "🛡️", title: "Feature three", text: "Describe this feature.", image: "", href: "" } ], up)] },
  { id: "feat-4", name: "Features — 4 Columns", category: "Features", desc: "Four compact cards", blocks: [b("cardGrid", { title: "What we offer", subtitle: "", columns: "4", items: [ { icon: "📚", title: "Courses", text: "Structured learning.", image: "", href: "" }, { icon: "🏅", title: "Certificates", text: "Recognized proof.", image: "", href: "" }, { icon: "🧭", title: "Guidance", text: "Expert mentoring.", image: "", href: "" }, { icon: "🌐", title: "Community", text: "Global network.", image: "", href: "" } ] }, up)] },
  { id: "feat-2", name: "Features — 2 Columns", category: "Features", desc: "Two large cards", blocks: [b("cardGrid", { title: "Two pillars", subtitle: "", columns: "2", items: [ { icon: "🔒", title: "Safety First", text: "Everything is built around real workplace safety.", image: "", href: "" }, { icon: "📈", title: "Career Growth", text: "Qualifications that move your career forward.", image: "", href: "" } ] }, up)] },
  { id: "feat-img", name: "Features — Image cards", category: "Features", desc: "Cards with images", blocks: [b("cardGrid", { title: "Explore Programs", subtitle: "Add an image to each card", columns: "3", items: [ { icon: "", title: "Program A", text: "Short description.", image: "", href: "/qualification" }, { icon: "", title: "Program B", text: "Short description.", image: "", href: "/qualification" }, { icon: "", title: "Program C", text: "Short description.", image: "", href: "/qualification" } ] }, up)] },
  { id: "feat-grad", name: "Features — Gradient Cards (Tailwind)", category: "Features", desc: "Colorful gradient feature cards", blocks: [b("customCode", { tailwind: true, html: '<section class="max-w-6xl mx-auto px-6 py-16">\n  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">\n    <div class="rounded-2xl p-6 text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg hover:-translate-y-1 transition">\n      <div class="text-3xl">⚡</div>\n      <h3 class="mt-4 text-lg font-bold">Fast</h3>\n      <p class="mt-2 text-sm text-blue-50">Describe this feature in a sentence.</p>\n    </div>\n    <div class="rounded-2xl p-6 text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg hover:-translate-y-1 transition">\n      <div class="text-3xl">🛡️</div>\n      <h3 class="mt-4 text-lg font-bold">Secure</h3>\n      <p class="mt-2 text-sm text-emerald-50">Describe this feature in a sentence.</p>\n    </div>\n    <div class="rounded-2xl p-6 text-white bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg hover:-translate-y-1 transition">\n      <div class="text-3xl">🎯</div>\n      <h3 class="mt-4 text-lg font-bold">Focused</h3>\n      <p class="mt-2 text-sm text-fuchsia-50">Describe this feature in a sentence.</p>\n    </div>\n  </div>\n</section>' })] },

  /* ===== STATS ===== */
  { id: "stats-light", name: "Stats — Light", category: "Stats", desc: "Four numbers on light bg", blocks: [b("stats", { title: "", bgColor: "#f1f5f9", items: [ { value: "500+", label: "Professionals" }, { value: "25+", label: "Countries" }, { value: "98%", label: "Pass rate" }, { value: "10+", label: "Years" } ] }, up)] },
  { id: "stats-dark", name: "Stats — Dark", category: "Stats", desc: "Numbers on dark bg", blocks: [b("stats", { title: "Our Impact", bgColor: "#0f172a", items: [ { value: "1M+", label: "Hours delivered" }, { value: "40+", label: "Programs" }, { value: "4.9", label: "Avg rating" } ] }, { textColor: "#ffffff", animation: "fade-up" })] },
  { id: "stats-grad", name: "Stats — Gradient", category: "Stats", desc: "Numbers on a gradient band", blocks: [b("stats", { title: "By the numbers", items: [ { value: "12", label: "Accreditations" }, { value: "300+", label: "Courses run" }, { value: "95%", label: "Would recommend" }, { value: "24/7", label: "Support" } ] }, { bgType: "gradient", gradFrom: "#2563eb", gradTo: "#7c3aed", textColor: "#ffffff", animation: "zoom-in" })] },

  /* ===== TESTIMONIALS ===== */
  { id: "test-slider", name: "Testimonials — Slider", category: "Testimonials", desc: "Rotating quotes", blocks: [b("testimonials", { title: "What people say", layout: "slider", items: [ { quote: "Outstanding experience from start to finish.", name: "Jane Doe", role: "Safety Officer", avatar: "", rating: "5" }, { quote: "Truly professional and globally recognized.", name: "John Smith", role: "Manager", avatar: "", rating: "5" }, { quote: "Helped me get promoted within months.", name: "Aisha K.", role: "HSE Lead", avatar: "", rating: "5" } ] })] },
  { id: "test-grid", name: "Testimonials — Grid", category: "Testimonials", desc: "All quotes as cards", blocks: [b("testimonials", { title: "Loved by professionals", layout: "grid", items: [ { quote: "Outstanding experience from start to finish.", name: "Jane Doe", role: "Safety Officer", avatar: "", rating: "5" }, { quote: "Truly professional and globally recognized.", name: "John Smith", role: "Manager", avatar: "", rating: "5" }, { quote: "Helped me get promoted within months.", name: "Aisha K.", role: "HSE Lead", avatar: "", rating: "5" } ] }, up)] },
  { id: "test-grad", name: "Testimonials — Grid on Gradient", category: "Testimonials", desc: "Cards over a gradient band", blocks: [b("testimonials", { title: "Trusted worldwide", layout: "grid", items: [ { quote: "The best certification decision I ever made.", name: "M. Ali", role: "Operations Director", avatar: "", rating: "5" }, { quote: "Structured, credible and globally respected.", name: "R. Farooq", role: "Safety Manager", avatar: "", rating: "5" }, { quote: "Our team certified quickly and confidently.", name: "S. Malik", role: "HR Lead", avatar: "", rating: "5" } ] }, { bgType: "gradient", gradFrom: "#eef2ff", gradTo: "#e0f2fe", animation: "fade-up" })] },
  { id: "test-single", name: "Testimonial — Single", category: "Testimonials", desc: "One featured quote", blocks: [b("testimonials", { title: "", layout: "slider", items: [ { quote: "The best certification decision I ever made.", name: "M. Ali", role: "Operations Director", avatar: "", rating: "5" } ] })] },

  /* ===== PRICING ===== */
  { id: "price-3", name: "Pricing — 3 Tiers", category: "Pricing", desc: "Basic / Pro / Enterprise", blocks: [b("pricing", { title: "Simple pricing", subtitle: "Choose the plan that fits you", tiers: [ { name: "Basic", price: "£99", period: "/course", features: "Course access\nDigital certificate\nEmail support", cta: { label: "Choose", href: "/contact-us" }, highlighted: false }, { name: "Pro", price: "£199", period: "/course", features: "Everything in Basic\nPriority assessment\nPrinted certificate", cta: { label: "Choose", href: "/contact-us" }, highlighted: true }, { name: "Enterprise", price: "Custom", period: "", features: "Team onboarding\nBulk pricing\nDedicated manager", cta: { label: "Contact", href: "/contact-us" }, highlighted: false } ] }, up)] },
  { id: "price-2", name: "Pricing — 2 Tiers", category: "Pricing", desc: "Monthly / Annual style", blocks: [b("pricing", { title: "Plans", subtitle: "", tiers: [ { name: "Standard", price: "£149", period: "", features: "Full course\nCertificate\nSupport", cta: { label: "Get Standard", href: "/contact-us" }, highlighted: false }, { name: "Premium", price: "£249", period: "", features: "Everything in Standard\nMentoring\nCPD hours", cta: { label: "Get Premium", href: "/contact-us" }, highlighted: true } ] }, up)] },
  { id: "price-grad", name: "Pricing — on Gradient", category: "Pricing", desc: "Pricing over a soft gradient", blocks: [b("pricing", { title: "Membership plans", subtitle: "Cancel anytime", tiers: [ { name: "Starter", price: "£0", period: "", features: "Browse courses\nCommunity access", cta: { label: "Start free", href: "/contact-us" }, highlighted: false }, { name: "Pro", price: "£29", period: "/mo", features: "All courses\nCertificates\nPriority support", cta: { label: "Go Pro", href: "/contact-us" }, highlighted: true }, { name: "Team", price: "£99", period: "/mo", features: "Everything in Pro\n5 seats\nAdmin dashboard", cta: { label: "Contact", href: "/contact-us" }, highlighted: false } ] }, { bgType: "gradient", gradFrom: "#f8fafc", gradTo: "#eef2ff", animation: "fade-up" })] },

  /* ===== TEAM ===== */
  { id: "team-3", name: "Team — 3 Members", category: "Team", desc: "Three member cards", blocks: [b("team", { title: "Meet the team", columns: "3", members: [ { photo: "", name: "Full Name", role: "Role", bio: "" }, { photo: "", name: "Full Name", role: "Role", bio: "" }, { photo: "", name: "Full Name", role: "Role", bio: "" } ] }, up)] },
  { id: "team-4", name: "Team — 4 Members", category: "Team", desc: "Four member cards", blocks: [b("team", { title: "Our people", columns: "4", members: [ { photo: "", name: "Full Name", role: "Role", bio: "" }, { photo: "", name: "Full Name", role: "Role", bio: "" }, { photo: "", name: "Full Name", role: "Role", bio: "" }, { photo: "", name: "Full Name", role: "Role", bio: "" } ] }, up)] },

  /* ===== GALLERY ===== */
  { id: "gal-3", name: "Gallery — 3 Columns", category: "Gallery", desc: "Image grid", blocks: [b("gallery", { columns: "3", gap: "12", rounded: true, images: [ { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" } ] }, up)] },
  { id: "gal-4", name: "Gallery — 4 Columns", category: "Gallery", desc: "Tight image grid", blocks: [b("gallery", { columns: "4", gap: "8", rounded: true, images: [ { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" }, { src: "", alt: "" } ] }, up)] },

  /* ===== LOGOS ===== */
  { id: "logos-row", name: "Logo Cloud", category: "Logos", desc: "Row of partner logos", blocks: [b("logos", { title: "Trusted by leading organizations", items: [ { image: "", alt: "" }, { image: "", alt: "" }, { image: "", alt: "" }, { image: "", alt: "" }, { image: "", alt: "" } ] }, up)] },

  /* ===== CONTENT ===== */
  { id: "content-heading", name: "Section Heading", category: "Content", desc: "Centered heading + subtitle", blocks: [b("heading", { text: "A clear section title", subtitle: "A short supporting sentence beneath it.", level: "2", align: "center" }, up)] },
  { id: "content-rich", name: "Rich Text Block", category: "Content", desc: "Editable prose", blocks: [b("richText", { html: "<h2>About this section</h2><p>Write your content here. You can use <strong>bold</strong>, <em>italic</em>, lists and links.</p><ul><li>Point one</li><li>Point two</li></ul>", maxWidth: "prose", align: "left" })] },
  { id: "content-columns", name: "Two Columns", category: "Content", desc: "Side-by-side text", blocks: [b("columns", { columns: [ { html: "<h3>Column one</h3><p>Describe the first idea here.</p>" }, { html: "<h3>Column two</h3><p>Describe the second idea here.</p>" } ] }, up)] },
  { id: "content-image-text", name: "Image + Heading + Text", category: "Content", desc: "Image with intro", blocks: [ b("image", { src: "", alt: "", caption: "", rounded: true, maxWidth: "900" }), b("heading", { text: "Supporting headline", subtitle: "Add context under the image.", level: "2", align: "center" }) ] },

  /* ===== FAQ ===== */
  { id: "faq-basic", name: "FAQ Accordion", category: "FAQ", desc: "Expandable Q&A", blocks: [b("faq", { title: "Frequently Asked Questions", items: [ { q: "How do I get started?", a: "Reach out via the contact page and our team will guide you." }, { q: "Are certificates recognized?", a: "Yes, our qualifications align with international standards." }, { q: "How long does it take?", a: "Most courses take 4–8 weeks depending on the level." } ] })] },

  /* ===== CTA ===== */
  { id: "cta-blue", name: "CTA — Blue", category: "Call To Action", desc: "Blue call to action", blocks: [b("cta", { title: "Ready to get started?", text: "Join hundreds of professionals today.", button: { label: "Contact Us", href: "/contact-us" }, bgColor: "#2563eb", textColor: "#ffffff" })] },
  { id: "cta-dark", name: "CTA — Dark", category: "Call To Action", desc: "Dark call to action", blocks: [b("cta", { title: "Take the next step", text: "Speak to our team about your goals.", button: { label: "Get in Touch", href: "/contact-us" }, bgColor: "#0f172a", textColor: "#ffffff" })] },
  { id: "cta-grad", name: "CTA — Gradient", category: "Call To Action", desc: "Gradient CTA that zooms in", blocks: [b("cta", { title: "Ready to advance your career?", text: "Get certified with globally recognized qualifications.", button: { label: "Enroll Now", href: "/contact-us" } }, { bgType: "gradient", gradFrom: "#2563eb", gradTo: "#7c3aed", textColor: "#ffffff", animation: "zoom-in" })] },
  { id: "cta-banner", name: "Announcement Banner", category: "Call To Action", desc: "Thin strip", blocks: [b("banner", { text: "🎉 New programs available — enroll today!", href: "/qualification", bgColor: "#111827", textColor: "#ffffff" })] },

  /* ===== VIDEO ===== */
  { id: "video-embed", name: "Video Embed", category: "Video", desc: "YouTube/Vimeo player", blocks: [b("video", { url: "", title: "Add a YouTube or Vimeo URL", maxWidth: "900" }, up)] },
  { id: "video-cta", name: "Video + CTA", category: "Video", desc: "Video followed by CTA", blocks: [ b("video", { url: "", title: "", maxWidth: "900" }), b("cta", { title: "Like what you see?", text: "Get in touch to learn more.", button: { label: "Contact Us", href: "/contact-us" }, bgColor: "#2563eb", textColor: "#ffffff" }) ] },

  /* ===== CUSTOM / TAILWIND ===== */
  { id: "tw-hero", name: "Tailwind — Gradient Hero", category: "Custom / Tailwind", desc: "Editable Tailwind HTML hero", blocks: [b("customCode", { tailwind: true, html: '<section class="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">\n  <div class="max-w-5xl mx-auto px-6 py-24 text-center">\n    <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight">Build with Tailwind</h1>\n    <p class="mt-5 text-lg text-blue-50 max-w-2xl mx-auto">Fully editable HTML using any Tailwind utility class.</p>\n    <a href="/contact-us" class="inline-block mt-8 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold shadow-lg hover:scale-105 transition">Get Started</a>\n  </div>\n</section>' })] },
  { id: "tw-cards", name: "Tailwind — Feature Cards", category: "Custom / Tailwind", desc: "3 cards in raw Tailwind", blocks: [b("customCode", { tailwind: true, html: '<section class="max-w-6xl mx-auto px-6 py-16">\n  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">\n    <div class="rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition">\n      <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">⚡</div>\n      <h3 class="mt-4 font-semibold text-gray-900">Fast</h3>\n      <p class="mt-2 text-sm text-gray-600">Describe this feature in a sentence.</p>\n    </div>\n    <div class="rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition">\n      <div class="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">🛡️</div>\n      <h3 class="mt-4 font-semibold text-gray-900">Secure</h3>\n      <p class="mt-2 text-sm text-gray-600">Describe this feature in a sentence.</p>\n    </div>\n    <div class="rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition">\n      <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">🎯</div>\n      <h3 class="mt-4 font-semibold text-gray-900">Focused</h3>\n      <p class="mt-2 text-sm text-gray-600">Describe this feature in a sentence.</p>\n    </div>\n  </div>\n</section>' })] },
  { id: "tw-split", name: "Tailwind — Split CTA", category: "Custom / Tailwind", desc: "Two-column CTA", blocks: [b("customCode", { tailwind: true, html: '<section class="max-w-6xl mx-auto px-6 py-16">\n  <div class="rounded-3xl bg-gray-900 text-white grid md:grid-cols-2 gap-8 items-center p-10">\n    <div>\n      <h2 class="text-3xl font-bold">Let\'s work together</h2>\n      <p class="mt-3 text-gray-300">A short persuasive paragraph goes right here.</p>\n    </div>\n    <div class="md:text-right">\n      <a href="/contact-us" class="inline-block px-8 py-3.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-400 transition">Contact Us</a>\n    </div>\n  </div>\n</section>' })] },
  { id: "tw-stats", name: "Tailwind — Gradient Stats", category: "Custom / Tailwind", desc: "Stat band with gradient", blocks: [b("customCode", { tailwind: true, html: '<section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">\n  <div class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">\n    <div><div class="text-4xl font-extrabold">500+</div><div class="mt-1 text-blue-100 text-sm">Professionals</div></div>\n    <div><div class="text-4xl font-extrabold">25+</div><div class="mt-1 text-blue-100 text-sm">Countries</div></div>\n    <div><div class="text-4xl font-extrabold">98%</div><div class="mt-1 text-blue-100 text-sm">Pass rate</div></div>\n    <div><div class="text-4xl font-extrabold">4.9</div><div class="mt-1 text-blue-100 text-sm">Avg rating</div></div>\n  </div>\n</section>' })] },

  /* ===== MORE HEROES ===== */
  { id: "hero-split", name: "Hero — Split (image + text)", category: "Heroes", desc: "Two-column hero, add an image", blocks: [b("customCode", { tailwind: true, html: '<section class="max-w-6xl mx-auto px-6 py-16 md:py-24">\n  <div class="grid md:grid-cols-2 gap-10 items-center">\n    <div>\n      <span class="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">Ababeel</span>\n      <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Qualifications that move careers forward</h1>\n      <p class="mt-5 text-lg text-gray-600">A short supporting paragraph that explains the value in one or two sentences.</p>\n      <div class="mt-8 flex flex-wrap gap-4">\n        <a href="/contact-us" class="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition">Get Started</a>\n        <a href="/about-us" class="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Learn More</a>\n      </div>\n    </div>\n    <div class="rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 h-72 md:h-96 shadow-2xl"></div>\n  </div>\n</section>' })] },

  /* ===== MORE CONTENT ===== */
  { id: "content-split-lr", name: "Content — Two Columns (slide in)", category: "Content", desc: "Columns that slide in from sides", blocks: [ b("columns", { columns: [ { html: "<h3>Column one</h3><p>This column slides in from the left as you scroll.</p>" } ] }, { animation: "fade-right" }), ] },
  { id: "content-steps", name: "Content — Numbered Steps", category: "Content", desc: "3-step process (Tailwind)", blocks: [b("customCode", { tailwind: true, html: '<section class="max-w-5xl mx-auto px-6 py-16">\n  <h2 class="text-3xl font-bold text-center text-gray-900">How it works</h2>\n  <div class="mt-10 grid md:grid-cols-3 gap-6">\n    <div class="rounded-2xl border border-gray-100 shadow-sm p-6">\n      <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>\n      <h3 class="mt-4 font-semibold text-gray-900">Enroll</h3>\n      <p class="mt-2 text-sm text-gray-600">Choose your program and sign up in minutes.</p>\n    </div>\n    <div class="rounded-2xl border border-gray-100 shadow-sm p-6">\n      <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>\n      <h3 class="mt-4 font-semibold text-gray-900">Learn</h3>\n      <p class="mt-2 text-sm text-gray-600">Complete structured modules at your pace.</p>\n    </div>\n    <div class="rounded-2xl border border-gray-100 shadow-sm p-6">\n      <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>\n      <h3 class="mt-4 font-semibold text-gray-900">Get Certified</h3>\n      <p class="mt-2 text-sm text-gray-600">Pass the assessment and receive your certificate.</p>\n    </div>\n  </div>\n</section>' })] },

  /* ===== MORE FAQ ===== */
  { id: "faq-grad", name: "FAQ — on Gradient", category: "FAQ", desc: "Accordion over a soft gradient", blocks: [b("faq", { title: "Frequently Asked Questions", items: [ { q: "How do I get started?", a: "Reach out via the contact page and our team will guide you." }, { q: "Are certificates recognized?", a: "Yes, our qualifications align with international standards." }, { q: "How long does it take?", a: "Most courses take 4–8 weeks depending on the level." } ] }, { bgType: "gradient", gradFrom: "#eef2ff", gradTo: "#f0f9ff", animation: "fade-up" })] },

  /* ===== MORE CTA ===== */
  { id: "cta-newsletter", name: "CTA — Newsletter (Tailwind)", category: "Call To Action", desc: "Email capture band", blocks: [b("customCode", { tailwind: true, html: '<section class="bg-gradient-to-br from-slate-900 to-indigo-900 text-white">\n  <div class="max-w-3xl mx-auto px-6 py-16 text-center">\n    <h2 class="text-3xl font-bold">Stay in the loop</h2>\n    <p class="mt-3 text-slate-300">Get updates on new qualifications and offers.</p>\n    <form class="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">\n      <input type="email" placeholder="you@email.com" class="flex-1 px-4 py-3 rounded-xl text-gray-900 outline-none" />\n      <button type="button" class="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 font-semibold transition">Subscribe</button>\n    </form>\n  </div>\n</section>' })] },
];

// Turn a template's block specs into real, editable blocks.
export function createBlocksFromTemplate(template) {
  return (template.blocks || []).map((spec) => ({
    id: newId(),
    type: spec.type,
    props: structuredClone(spec.props || {}),
    _style: { ...defaultStyle(), ...(spec.style || {}) },
  }));
}
