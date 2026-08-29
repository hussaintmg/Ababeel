/**
 * The data the seed scripts write, in one place.
 *
 * Three scripts needed the same registration fields, the same levels and the
 * same home-page blocks. Kept inline in each, they drift: a field added to one
 * and not the others produces a site that is set up differently depending on
 * which command someone happened to run.
 *
 * These mirror the application's own defaults —
 * `lib/training/defaultFields.js` and `lib/cmsDefaults.js` — and
 * `__tests__/training/seedData.test.js` asserts they stay in step. They are
 * duplicated as plain data rather than imported because the seed scripts run
 * in plain node, outside Next's `@/` module resolution.
 */

/* ------------------------------------------------------- registration form */

export const REGISTRATION_FIELDS = [
  { key: "firstName", label: "First Name", type: "text", placeholder: "e.g. Ayesha", required: true, width: "half", bindTo: "firstName", system: true, maxLength: 100 },
  { key: "lastName", label: "Last Name", type: "text", placeholder: "e.g. Khan", required: true, width: "half", bindTo: "lastName", system: true, maxLength: 100 },
  { key: "email", label: "Email Address", type: "email", placeholder: "you@company.com", required: true, width: "half", bindTo: "email", system: true, maxLength: 200 },
  { key: "phone", label: "Phone Number", type: "phone", placeholder: "+92 300 0000000", required: true, width: "half", bindTo: "phone", system: true, maxLength: 40 },
  { key: "company", label: "Company / Organisation", type: "text", placeholder: "Where you work", required: false, width: "half", bindTo: "company", maxLength: 200 },
  { key: "jobTitle", label: "Job Title", type: "text", placeholder: "Your role", required: false, width: "half", maxLength: 200 },
  { key: "country", label: "Country", type: "country", required: true, width: "half", bindTo: "country", maxLength: 100 },
  { key: "city", label: "City", type: "text", required: false, width: "half", maxLength: 100 },
  { key: "address", label: "Address", type: "textarea", placeholder: "Street address", required: false, width: "full", maxLength: 500 },
  {
    key: "additionalInformation",
    label: "Additional Information",
    type: "textarea",
    placeholder: "Anything we should know before the session?",
    helpText: "Accessibility requirements, prior qualifications, invoicing contact…",
    required: false,
    width: "full",
    maxLength: 2000,
  },
];

/** A full RegistrationField document, ready to insert. */
export function registrationFieldDoc(field, index) {
  const now = new Date();
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder || "",
    helpText: field.helpText || "",
    required: !!field.required,
    enabled: true,
    width: field.width || "full",
    options: [],
    minLength: 0,
    maxLength: field.maxLength || 0,
    pattern: "",
    patternMessage: "",
    bindTo: field.bindTo || "",
    system: !!field.system,
    displayOrder: index,
    createdAt: now,
    updatedAt: now,
  };
}

/* ---------------------------------------------------------------- levels */

export const LEVELS = [
  { name: "Beginner", slug: "beginner", description: "No prior safety qualification needed.", icon: "🌱", color: "#0ea5e9" },
  { name: "Intermediate", slug: "intermediate", description: "Builds on a foundation-level qualification or equivalent experience.", icon: "📘", color: "#6366f1" },
  { name: "Advanced", slug: "advanced", description: "For practitioners already working in a safety role.", icon: "🎯", color: "#f26722" },
  { name: "Professional", slug: "professional", description: "Senior and chartered-track qualifications.", icon: "🏅", color: "#0f766e" },
];

export function levelDoc(level, index) {
  const now = new Date();
  return {
    name: level.name,
    slug: level.slug,
    description: level.description,
    icon: level.icon,
    image: "",
    color: level.color,
    status: "published",
    displayOrder: index,
    createdAt: now,
    updatedAt: now,
  };
}

/* ------------------------------------------------------------ navigation */

/**
 * A link with a `dropdown` array renders as a menu in the header and as an
 * expandable item in the mobile drawer.
 */
export const NAV_LINKS = [
  { name: "Home", url: "/" },
  {
    name: "About",
    url: "/about-us",
    dropdown: [
      { name: "About Us", url: "/about-us" },
      { name: "Our Team", url: "/about/team" },
      { name: "Our Consultants", url: "/about/consultants" },
      { name: "Accreditations & Certifications", url: "/about/accreditations" },
      { name: "Why Ababeel", url: "/why-ababeel" },
    ],
  },
  { name: "Courses", url: "/courses" },
  { name: "Awarding Bodies", url: "/awarding-bodies" },
  { name: "Schedule", url: "/schedule" },
  { name: "Resources", url: "/resources" },
  { name: "Contact Us", url: "/contact-us" },
  { name: "Register Now", url: "/registration" },
];

export const FOOTER_COLUMNS = [
  {
    title: "Training",
    links: [
      { name: "All Courses", href: "/courses" },
      { name: "Training Schedule", href: "/schedule" },
      { name: "Awarding Bodies", href: "/awarding-bodies" },
      { name: "Resources", href: "/resources" },
    ],
  },
  {
    title: "About",
    links: [
      { name: "About Us", href: "/about-us" },
      { name: "Our Team", href: "/about/team" },
      { name: "Our Consultants", href: "/about/consultants" },
      { name: "Accreditations", href: "/about/accreditations" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Contact Us", href: "/contact-us" },
      { name: "Certificate Verification", href: "/verify-certificate" },
      { name: "Glossary of Terms", href: "/glossary-of-terms" },
      { name: "FAQs", href: "/FAQs" },
    ],
  },
];

/* ------------------------------------------------------------- home page */

const INK = "#0b1526";
const INK_MIST = "#f5f7fa";
const BRAND = "#f26722";

/** The Design-tab style bag every block carries. */
const STYLE = {
  bgType: "solid", bgColor: "", gradFrom: "", gradTo: "", gradAngle: "135",
  bgImage: "", bgOverlay: "", textColor: "", css: "", decorBefore: "", decorAfter: "",
  paddingY: "", paddingX: "", paddingTop: "", paddingRight: "", paddingBottom: "",
  paddingLeft: "", marginTop: "", marginBottom: "", maxWidth: "", minHeight: "",
  radius: "", shadow: "none", borderWidth: "", borderColor: "", align: "",
  animation: "", animDuration: "", animDelay: "", hover: "", className: "", anchorId: "",
};

/**
 * The home page blocks.
 *
 * Mirrors the "Ababeel — home" template in
 * `Components/cms/trainingTemplates.js`. The catalogue sections fill
 * themselves from the database, so publishing a course puts it on the home
 * page without anyone editing the home page again.
 *
 * The prose panels carry placeholder copy on purpose: they are the client's
 * words to write, and inventing claims about a safety company is how invented
 * claims get published.
 */
function blockFactory(prefix) {
  let n = 0;
  const stamp = Date.now().toString(36);
  return (type, props, style = {}) => ({
    id: `seed_${prefix}_${stamp}_${(n += 1)}`,
    type,
    props,
    _style: { ...STYLE, ...style },
  });
}

const UP = { animation: "fade-up" };

export function homePageBlocks() {
  const block = blockFactory("home");
  const up = UP;

  return [
    block("hero", {
      eyebrow: "Accredited safety training",
      title: "Competence you can evidence",
      subtitle:
        "Internationally recognised qualifications, delivered by practitioners who have done the work.",
      align: "left", bgType: "solid", bgColor: INK, textColor: "#ffffff",
      minHeight: "560", accent: BRAND, image: "",
      primaryCta: { label: "Browse courses", href: "/courses" },
      secondaryCta: { label: "See the schedule", href: "/schedule" },
    }),

    block("accreditationLogos", {
      eyebrow: "", title: "Accredited and approved", subtitle: "", align: "center",
      trustStripOnly: true, layout: "strip", grayscale: true,
      ctaLabel: "", ctaHref: "/about/accreditations",
    }, { bgColor: INK_MIST, animation: "fade" }),

    block("split", {
      eyebrow: "Who we are",
      title: "About Ababeel",
      text:
        "<p>Replace this paragraph with your own account of who Ababeel is and what you do. Two or three sentences is plenty — the detail belongs on the About page.</p>",
      bullets: [
        { text: "Accredited by recognised awarding bodies" },
        { text: "Delivered by working practitioners" },
        { text: "Online, in person or blended" },
      ],
      image: "", imageAlt: "", imageSide: "right", accent: BRAND,
      cta: { label: "More about us", href: "/about-us" },
    }, { animation: "fade-right" }),

    block("courseGrid", {
      eyebrow: "Training", title: "Featured courses",
      subtitle: "A selection of the programmes we run most often.",
      align: "left", source: "featured", level: "", awardingBody: "", category: "",
      sort: "recommended", limit: "6", columns: "3", cardTemplate: "standard",
      ctaLabel: "View all courses", ctaHref: "/courses",
      emptyMessage: "Courses will appear here once they are published.",
    }, up),

    block("cardGrid", {
      title: "Why Ababeel", subtitle: "", columns: "4",
      items: [
        { icon: "🎓", title: "Accredited", text: "Qualifications awarded by recognised bodies, not certificates of attendance.", image: "", href: "/about/accreditations" },
        { icon: "🛠️", title: "Practitioner-led", text: "Taught by people who have managed the risks they are teaching about.", image: "", href: "" },
        { icon: "🌍", title: "Delivered anywhere", text: "Online, in person or blended, scheduled around your operation.", image: "", href: "/schedule" },
        { icon: "🤝", title: "Supported throughout", text: "A named contact from enquiry to certificate.", image: "", href: "/contact-us" },
      ],
    }, up),

    block("awardingBodyLogos", {
      eyebrow: "Accreditation", title: "Who awards our qualifications", subtitle: "",
      align: "center", layout: "strip", grayscale: true, linkToBody: true,
      ctaLabel: "All awarding bodies", ctaHref: "/awarding-bodies",
    }, up),

    block("scheduleList", {
      eyebrow: "Dates", title: "Upcoming sessions", subtitle: "", align: "left",
      mode: "", months: "3", limit: "3", showCourseName: true,
      ctaLabel: "See the full schedule", ctaHref: "/schedule",
      emptyMessage: "No training sessions are currently scheduled.",
    }, up),

    block("consultantList", {
      eyebrow: "Expertise", title: "Our consultants", subtitle: "", align: "center",
      display: "cards", limit: "3", columns: "3",
      ctaLabel: "Meet the team", ctaHref: "/about/consultants",
      emptyMessage: "Consultant profiles are on their way.",
    }, up),

    block("reviewWall", {
      eyebrow: "Reviews", title: "What our learners say", subtitle: "", align: "center",
      layout: "google", limit: "3", columns: "3", featuredOnly: false,
      emptyMessage: "Reviews will appear here once they are published.",
    }, { bgColor: INK_MIST, animation: "fade-up" }),

    block("cta", {
      title: "Ready to get your team qualified?",
      text: "Tell us what you need and we will put together a training plan that fits.",
      button: { label: "Start a conversation", href: "/contact-us" },
      secondaryButton: { label: "Browse courses", href: "/courses" },
      bgColor: INK, textColor: "#ffffff",
    }, up),
  ];
}

/* -------------------------------------------------- training page seeds */

/** A dark hero matching each page's built-in top region. */
function pageHero(block, eyebrow, title, subtitle) {
  return block("hero", {
    eyebrow,
    title,
    subtitle,
    align: "left",
    bgType: "solid",
    bgColor: INK,
    textColor: "#ffffff",
    minHeight: "",
    accent: BRAND,
    image: "",
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
  });
}

/**
 * Initial CMS sections for every training page.
 *
 * These are what the owner sees the first time they open the page in Website
 * CMS: real, editable sections rather than an empty shell. Each doc ships
 * DISABLED, so the built-in page keeps rendering until the owner reviews and
 * enables it — the same safety the home page seed has.
 *
 * The hero-only pages (courses, schedule, registration, resources) keep their
 * working tool below the CMS slot, so their seed is the hero; the content
 * pages get their full section stack, built from the live catalogue blocks.
 */
export function trainingPageDocs() {
  const pages = [];
  const add = (key, title, route, blocks) => pages.push({ key, title, route, blocks });

  {
    const b = blockFactory("courses");
    add("courses", "Courses", "/courses", [
      pageHero(b, "Training catalogue", "Accredited safety training, built around competence",
        "Browse our full catalogue by level, awarding body or duration, and register for an upcoming session."),
    ]);
  }
  {
    const b = blockFactory("schedule");
    add("schedule", "Schedule", "/schedule", [
      pageHero(b, "Upcoming dates", "Training Schedule",
        "Upcoming sessions across all of our accredited programmes."),
    ]);
  }
  {
    const b = blockFactory("registration");
    add("registration", "Registration", "/registration", [
      pageHero(b, "Enrolment", "Register For Training",
        "Complete the form below and a member of our training team will confirm your place."),
    ]);
  }
  {
    const b = blockFactory("resources");
    add("resources", "Resources", "/resources", [
      pageHero(b, "Knowledge", "Resources",
        "Guides, articles and downloads from our training and consultancy work."),
    ]);
  }
  {
    const b = blockFactory("bodies");
    add("awarding-bodies", "Awarding Bodies", "/awarding-bodies", [
      pageHero(b, "Accreditation", "Our awarding bodies",
        "Every qualification we deliver is awarded by a recognised organisation. Here is who stands behind each one."),
      b("awardingBodyLogos", {
        eyebrow: "", title: "", subtitle: "", align: "left",
        layout: "cards", grayscale: false, linkToBody: true,
        ctaLabel: "", ctaHref: "/awarding-bodies",
      }, UP),
      b("cta", {
        title: "Not sure which qualification you need?",
        text: "Our training team will talk it through and recommend the right course and awarding body.",
        button: { label: "Get advice", href: "/contact-us" },
        secondaryButton: { label: "", href: "" },
        bgColor: INK, textColor: "#ffffff",
      }, UP),
    ]);
  }
  {
    const b = blockFactory("team");
    add("our-team", "Our Team", "/about/team", [
      pageHero(b, "People", "Our team",
        "Practitioners, trainers and assessors who have done the work they teach."),
      b("teamGrid", {
        eyebrow: "", title: "", subtitle: "", align: "center",
        limit: "12", columns: "4", leadershipOnly: false, showBio: true,
        ctaLabel: "", ctaHref: "/about/team",
        emptyMessage: "Team profiles are on their way.",
      }, UP),
    ]);
  }
  {
    const b = blockFactory("consultants");
    add("our-consultants", "Our Consultants", "/about/consultants", [
      pageHero(b, "Expertise", "Our consultants",
        "Subject-matter specialists who advise, audit and train across industry."),
      b("consultantList", {
        eyebrow: "", title: "", subtitle: "", align: "left",
        display: "profiles", limit: "12", columns: "3",
        ctaLabel: "", ctaHref: "/about/consultants",
        emptyMessage: "Consultant profiles are on their way.",
      }, UP),
    ]);
  }
  {
    const b = blockFactory("accreditations");
    add("accreditations", "Accreditations & Certifications", "/about/accreditations", [
      pageHero(b, "Credentials", "Accreditations & certifications",
        "The approvals and memberships that stand behind the training we deliver."),
      b("accreditationLogos", {
        eyebrow: "", title: "", subtitle: "", align: "center",
        trustStripOnly: false, layout: "grid", grayscale: false,
        ctaLabel: "", ctaHref: "/about/accreditations",
      }, UP),
      b("awardingBodyLogos", {
        eyebrow: "Qualifications", title: "Who awards our qualifications", subtitle: "",
        align: "center", layout: "strip", grayscale: true, linkToBody: true,
        ctaLabel: "All awarding bodies", ctaHref: "/awarding-bodies",
      }, UP),
    ]);
  }

  return pages;
}

/**
 * The "Why Ababeel" page — a custom CMS page served by the /[slug] route, so
 * it is created, owned and edited entirely inside the CMS with no code route
 * behind it. Ships ENABLED, because unlike the pages above it has no built-in
 * fallback to stand behind.
 */
export function whyAbabeelDoc() {
  const b = blockFactory("why");
  return {
    key: "why-ababeel",
    title: "Why Ababeel",
    route: "/why-ababeel",
    blocks: [
      pageHero(b, "Why Ababeel", "Training that holds up where it matters",
        "What working with Ababeel actually gets you — replace this line with your own words in the CMS."),
      b("cardGrid", {
        title: "Why Ababeel", subtitle: "", columns: "4",
        items: [
          { icon: "🎓", title: "Accredited", text: "Qualifications awarded by recognised bodies, not certificates of attendance.", image: "", href: "/about/accreditations" },
          { icon: "🛠️", title: "Practitioner-led", text: "Taught by people who have managed the risks they are teaching about.", image: "", href: "" },
          { icon: "🌍", title: "Delivered anywhere", text: "Online, in person or blended, scheduled around your operation.", image: "", href: "/schedule" },
          { icon: "🤝", title: "Supported throughout", text: "A named contact from enquiry to certificate.", image: "", href: "/contact-us" },
        ],
      }, UP),
      b("reviewWall", {
        eyebrow: "Reviews", title: "What our learners say", subtitle: "", align: "center",
        layout: "google", limit: "3", columns: "3", featuredOnly: false,
        emptyMessage: "Reviews will appear here once they are published.",
      }, { bgColor: INK_MIST, animation: "fade-up" }),
      b("cta", {
        title: "Ready to get your team qualified?",
        text: "Tell us what you need and we will put together a training plan that fits.",
        button: { label: "Start a conversation", href: "/contact-us" },
        secondaryButton: { label: "Browse courses", href: "/courses" },
        bgColor: INK, textColor: "#ffffff",
      }, UP),
    ],
  };
}
