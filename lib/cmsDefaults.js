// Shared, client-safe CMS defaults. No DB / mongoose imports here so this file
// can be imported by both the owner editor (client) and server helpers.
import webData from "@/constants";

// The pages/sections the owner can manage from the CMS dashboard.
// kind: "global" -> settings editor, "page" -> block page-builder.
export const MANAGED_PAGES = [
  {
    key: "global",
    title: "Global Site Settings",
    route: "/",
    group: "Global",
    kind: "global",
    description:
      "Logos, favicon, site title, brand, contact, topbar navigation & footer.",
    icon: "settings",
  },
  {
    key: "auth-pages",
    title: "Authentication Pages",
    route: "/login",
    group: "Global",
    kind: "auth",
    description: "Design Login, Forgot Password, OTP and Reset Password independently.",
    icon: "key",
  },
  { key: "home", title: "Home Page", route: "/", group: "Main Pages", kind: "page", icon: "home" },
  { key: "about-us", title: "About Us", route: "/about-us", group: "Main Pages", kind: "page", icon: "info" },
  { key: "contact-us", title: "Contact Us", route: "/contact-us", group: "Main Pages", kind: "page", icon: "mail" },
  { key: "qualification", title: "Qualifications", route: "/qualification", group: "Main Pages", kind: "page", icon: "award" },
  { key: "professional-dev", title: "Professional Development", route: "/professional-dev", group: "Main Pages", kind: "page", icon: "briefcase" },
  // ----- Training platform pages -----
  // Registered here so each appears in Owner Dashboard → Website CMS and can be
  // edited, sectioned and published like any other page. For the pages with a
  // working tool below the fold (course browser, schedule, registration form,
  // resource library) the CMS blocks replace the page's top region and the tool
  // stays; for the people/accreditation pages the blocks replace the whole page.
  { key: "courses", title: "Courses", route: "/courses", group: "Training Pages", kind: "page", icon: "book" },
  { key: "schedule", title: "Schedule", route: "/schedule", group: "Training Pages", kind: "page", icon: "award" },
  { key: "registration", title: "Registration", route: "/registration", group: "Training Pages", kind: "page", icon: "file" },
  { key: "awarding-bodies", title: "Awarding Bodies", route: "/awarding-bodies", group: "Training Pages", kind: "page", icon: "award" },
  { key: "our-team", title: "Our Team", route: "/about/team", group: "Training Pages", kind: "page", icon: "info" },
  { key: "our-consultants", title: "Our Consultants", route: "/about/consultants", group: "Training Pages", kind: "page", icon: "info" },
  { key: "accreditations", title: "Accreditations & Certifications", route: "/about/accreditations", group: "Training Pages", kind: "page", icon: "shield" },
  { key: "faqs", title: "FAQs", route: "/FAQs", group: "Inner Pages", kind: "page", icon: "help" },
  { key: "glossary-of-terms", title: "Glossary of Terms", route: "/glossary-of-terms", group: "Inner Pages", kind: "page", icon: "book" },
  { key: "logo-use", title: "Logo Use Policy", route: "/logo-use", group: "Inner Pages", kind: "page", icon: "image" },
  { key: "privacy-policy", title: "Privacy Policy", route: "/privacy-policy", group: "Legal Pages", kind: "page", icon: "shield" },
  { key: "refund-policy", title: "Refund Policy", route: "/refund-policy", group: "Legal Pages", kind: "page", icon: "receipt" },
  { key: "terms-of-services", title: "Terms of Service", route: "/terms-of-services", group: "Legal Pages", kind: "page", icon: "file" },
];

export const PAGE_KEYS = MANAGED_PAGES.filter((p) => p.kind === "page").map((p) => p.key);

// Slugs that a custom page may NOT use — existing top-level routes + built-in
// managed page keys + framework words. Keeps the /[slug] route from shadowing
// or being shadowed by real app routes.
export const RESERVED_SLUGS = new Set([
  ...MANAGED_PAGES.map((p) => p.key),
  "faqs", "about-us", "activate-account", "admin", "api", "application-form",
  "contact-us", "dashboard", "data", "favicon", "forgot-password", "globals",
  "glossary-of-terms", "login", "logo-use", "owner", "partner", "privacy-policy",
  "professional-dev", "profile", "qualification", "refund-policy", "reset-password",
  "send-email", "sign-up", "terms-of-services", "verify-certificate", "verify-email",
  "home", "global", "_next", "public", "uploads", "cms",
  // Training platform routes. A custom CMS page with one of these slugs would
  // be shadowed by the real route and appear broken to its author.
  "courses", "schedule", "registration", "awarding-bodies", "about", "consultants",
  "resources",
  // Owner CMS sub-routes — a custom page with one of these keys would shadow
  // its own editor URL (/owner/cms/<key>).
  "variables", "data",
]);

// Convert a title/label to a URL-safe slug.
export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// A slug is valid if it is a clean kebab-case token and not reserved.
export function validateSlug(slug) {
  const s = slugify(slug);
  if (!s) return { ok: false, error: "Please enter a page name." };
  if (s.length < 2) return { ok: false, error: "Page name is too short." };
  if (RESERVED_SLUGS.has(s)) return { ok: false, error: `"${s}" is reserved — choose another name.` };
  return { ok: true, slug: s };
}

// Default document for a freshly-created custom page.
export function getCustomDefaultDoc(slug, title) {
  return {
    key: slug,
    title: title || slug,
    blocks: [
      {
        id: "seed-hero",
        type: "hero",
        props: {
          eyebrow: "New Page",
          title: title || slug,
          subtitle: "Start building this page with templates and blocks, then Publish it.",
          align: "center",
          bgType: "gradient",
          gradFrom: "#2563eb",
          gradTo: "#0f172a",
          gradAngle: "135",
          textColor: "#ffffff",
          minHeight: "480",
          primaryCta: { label: "Get in touch", href: "/contact-us" },
          secondaryCta: { label: "", href: "" },
          image: "",
        },
      },
    ],
    settings: {},
    customCss: "",
    enabled: false,
    isCustom: true,
    route: `/${slug}`,
    navLabel: title || slug,
    showInNav: false,
  };
}

// Default global settings, seeded from the static webdata.json so the CMS shows
// the site's current identity on first load.
export const DEFAULT_GLOBAL_SETTINGS = {
  brand: {
    name: webData?.brand?.name || "Ababeel",
    shortName: webData?.brand?.shortName || "Ababeel",
    legalName: webData?.brand?.legalName || "Ababeel",
    tagline: webData?.brand?.tagline || "Your safety technology partner",
    description: webData?.brand?.description || "",
  },
  contact: {
    supportEmail: webData?.contact?.supportEmail || "",
    infoEmail: webData?.contact?.infoEmail || "",
    phone: webData?.contact?.phone || "",
    whatsapp: webData?.contact?.whatsapp || "",
    address: webData?.contact?.address || "",
    country: webData?.contact?.country || "",
  },
  seo: {
    titleTemplate: "%s | Ababeel",
    defaultTitle: webData?.seo?.defaultTitle || "Ababeel",
    defaultDescription: webData?.seo?.defaultDescription || "Your safety technology partner",
  },
  logos: {
    topbar: webData?.assets?.logos?.mark || "/ababeel-logo.svg",
    footer: webData?.assets?.logos?.secondary || "/ababeel-logo-light.svg",
    favicon: webData?.assets?.logos?.favicon || "/favicon.ico",
  },
  topbar: {
    showLogin: true,
    style: {
      // bar
      bg: "",
      borderColor: "",
      shadow: true,
      sticky: false,
      height: "",        // px
      container: "wide",  // wide | normal | full
      navAlign: "center", // left | center | right
      logoHeight: "",     // px
      // links
      text: "",
      hover: "",
      hoverBg: "",
      activeText: "",
      activeBg: "",
      // nav dropdown menus
      ddBg: "",
      ddText: "",
      ddHover: "",
      ddHoverBg: "",
      // login / dashboard button
      btnBg: "",
      btnText: "",
      btnHoverBg: "",
      // user dropdown menu
      menuBg: "",
      menuText: "",
      menuHover: "",
    },
    // A parent with a `dropdown` array renders as a menu; Topbar and the mobile
    // Sidebar both already understand this shape, so the CMS only had to gain
    // the ability to author it.
    navLinks: [
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
      { name: "Contact Us", url: "/contact-us" },
      { name: "Register Now", url: "/registration" },
    ],
  },
  footer: {
    style: {
      bg: "",
      text: "",
      heading: "",
      link: "",
      linkHover: "",
      borderColor: "",   // divider lines
      align: "",          // "" | left | center
      columns: "",        // "" (auto) | 2 | 3 | 4 | 5  (link columns per row)
    },
    description:
      "Ababeel is a UK based technical and safety certification platform, committed to advancing workplace safety and technical competence across industries.",
    showEmail: true,
    showAddress: true,
    columns: [
      {
        title: "Training",
        links: [
          { name: "All Courses", href: "/courses" },
          { name: "Training Schedule", href: "/schedule" },
          { name: "Awarding Bodies", href: "/awarding-bodies" },
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
    ],
    bottomLinks: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-services" },
    ],
    copyright: webData?.ui?.copyright || "Ababeel. All rights reserved.",
  },
  social: {
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
  },
  // Maintenance mode. When enabled, everyone except the owner sees the
  // maintenance screen on every page (login page stays reachable so the owner
  // can sign in). Toggled from the owner-only bar in the header or the CMS.
  maintenance: {
    enabled: false,
    title: "We'll be back soon",
    message:
      "Our website is currently undergoing scheduled maintenance. We'll be back online shortly — thank you for your patience.",
  },
  // Appearance of the owner / admin / user dashboards. STYLE ONLY — this never
  // touches dashboard content or the real data shown inside them.
  dashboard: {
    style: {
      bg: "",          // page background
      text: "",        // base text color
      accent: "",      // accent color (remaps the dashboards' blue accent)
      sidebarBg: "",
      sidebarText: "",
      cardBg: "",      // white card backgrounds
      contentWidth: "", // px — constrains the content column
    },
    css: "",           // free scoped CSS (target .cms-dash ...)
  },
  // Appearance of the auth pages: login, forgot-password, OTP verify,
  // reset-password. Full control over background, card, inputs, buttons.
  auth: {
    style: {
      // page background
      bgType: "",        // "" | solid | gradient | image
      bgColor: "",
      gradFrom: "",
      gradTo: "",
      gradAngle: "135",
      bgImage: "",       // full-page background image
      bgOverlay: "",     // 0–100 dark overlay over the bg image
      // card
      cardBg: "",
      cardText: "",
      cardRadius: "",    // px
      cardShadow: "",    // "" | none | sm | md | lg | xl
      cardMaxWidth: "",  // px
      cardBorderColor: "",
      cardAlign: "",     // "" | left | center | right
      // typography
      titleColor: "",
      subtitleColor: "",
      // accent / buttons / links
      accent: "",        // button + focus color
      accentHover: "",
      buttonText: "",
      linkColor: "",
      // inputs
      inputBg: "",
      inputBorder: "",
      inputText: "",
      inputFocus: "",    // focus border / ring color
      // login split image
      loginImage: "",       // override the login left-side image
      loginImageWidth: "",  // % width of the image column (e.g. 60)
      hideLoginImage: false, // hide image → centered card on login too
    },
    css: "",            // free scoped CSS (target .cms-auth ...)
    pages: {
      login: { style: {}, css: "" },
      forgot: { style: {}, css: "" },
      otp: { style: {}, css: "" },
      reset: { style: {}, css: "" },
    },
  },

  // ----- Dynamic CMS feature switches (developer controls) -----
  // Every dynamic feature is opt-out rather than opt-in so upgrading an
  // existing site changes nothing until an author actually binds a variable.
  // Turning one off disables it in the builder *and* in the public renderer.
  features: {
    dynamicCms: true,    // master switch for the whole dynamic layer
    variables: true,     // Variables CMS page + variable picker
    liveData: true,      // Live Database preview / published live data
    repeater: true,      // Repeat (collection) blocks
    conditions: true,    // visibility + conditional properties
    dynamicCss: true,    // variables inside style values
    expressions: true,   // {{= ... }} formulas
    scrollVideo: true,   // Scroll Video section
    dataInspector: true, // developer data inspector in the builder
  },

  // ----- Training platform -----
  // Settings for the public course catalogue, schedule and registration flow.
  // Everything here is content, not code: an owner changes the certificate
  // shown on a course with no custom certificate, or the wording of the
  // registration help panel, without a deploy.
  training: {
    // Shown on a course page when the course itself has no certificate image.
    defaultCertificateImage: "",
    certificateNote: "On successful completion you receive an accredited certificate.",
    // Which course-card design the public /courses grid uses.
    courseCardTemplate: "standard", // standard | editorial | minimal | featured | horizontal
    coursesPerPage: 12,
    // The help panel beside the registration form. Not a payment panel: the
    // registration flow takes no money, so this is contact and reassurance.
    registrationPanel: {
      enabled: true,
      title: "Need Help With Registration?",
      body:
        "Contact our team if you need help selecting a course, understanding the schedule, or completing your registration.",
      // Blank falls back to the site-wide contact details.
      phone: "",
      whatsapp: "",
      email: "",
      hours: "",
      footnote: "",
    },
    registration: {
      introTitle: "Register For Training",
      introText:
        "Complete the form below and a member of our training team will confirm your place.",
      submitLabel: "Submit Registration",
      successTitle: "Registration received",
      successMessage:
        "Thank you. Your registration has been received and our training team will contact you shortly.",
      // Shown under the form so nobody expects a checkout. Payments are off.
      paymentNotice:
        "No payment is taken at this stage. Our team will contact you to confirm your place.",
    },
    // How the course fee is actually settled. Informational only: the site
    // never collects money or anyone's banking credentials. The bank details
    // below are the COMPANY'S OWN account, shown so a registrant can pay by
    // transfer after their place is confirmed.
    payment: {
      showBankDetails: false,
      bankTitle: "Pay by bank transfer",
      bankIntro:
        "Once your place is confirmed, pay the course fee by bank transfer using your registration reference as the payment reference.",
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      sortCode: "",
      swiftBic: "",
      footnote: "",
      // Stored preference for a future Stripe integration. It has NO effect
      // today: lib/payments/provider.js is disabled and every method refuses,
      // so switching this on charges no one and shows no card form.
      stripeEnabled: false,
    },
    schedule: {
      title: "Training Schedule",
      intro: "Upcoming sessions across all of our accredited programmes.",
      emptyMessage: "No training sessions are currently scheduled for this month.",
    },
  },
};

// Light starter blocks so a freshly-seeded page isn't empty in the editor.
function starterBlocks(page) {
  return [
    {
      id: "seed-hero",
      type: "hero",
      props: {
        eyebrow: page.group,
        title: page.title,
        subtitle: `Manage the "${page.title}" page content from here. Toggle "Publish CMS content" to make it live.`,
        align: "center",
        bgColor: "#0f172a",
        textColor: "#ffffff",
        primaryCta: { label: "Get in touch", href: "/contact-us" },
        secondaryCta: { label: "", href: "" },
        image: "",
      },
    },
    {
      id: "seed-rich",
      type: "richText",
      props: {
        html: `<h2>${page.title}</h2><p>Edit this content in the owner dashboard &rarr; Website CMS. You can add headings, images, card grids, FAQs and more using blocks.</p>`,
        maxWidth: "prose",
        align: "left",
      },
    },
  ];
}

// The default document shape used when seeding a missing key.
export function getDefaultDoc(key) {
  const page = MANAGED_PAGES.find((p) => p.key === key);
  if (!page) return null;
  if (page.kind === "global") {
    return {
      key: "global",
      title: page.title,
      blocks: [],
      settings: DEFAULT_GLOBAL_SETTINGS,
      customCss: "",
      enabled: true, // global settings are always active
    };
  }
  if (page.kind === "auth") {
    return {
      key: page.key,
      title: page.title,
      blocks: [],
      settings: {},
      customCss: "",
      enabled: true,
    };
  }
  return {
    key: page.key,
    title: page.title,
    blocks: starterBlocks(page),
    settings: {},
    customCss: "",
    enabled: false,
  };
}
