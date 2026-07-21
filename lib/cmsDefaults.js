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
  { key: "home", title: "Home Page", route: "/", group: "Main Pages", kind: "page", icon: "home" },
  { key: "about-us", title: "About Us", route: "/about-us", group: "Main Pages", kind: "page", icon: "info" },
  { key: "contact-us", title: "Contact Us", route: "/contact-us", group: "Main Pages", kind: "page", icon: "mail" },
  { key: "qualification", title: "Qualifications", route: "/qualification", group: "Main Pages", kind: "page", icon: "award" },
  { key: "professional-dev", title: "Professional Development", route: "/professional-dev", group: "Main Pages", kind: "page", icon: "briefcase" },
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
    topbar: webData?.assets?.logos?.mark || "/logo.png",
    footer: webData?.assets?.logos?.secondary || "/logo-2.png",
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
    navLinks: [
      { name: "Home", url: "/" },
      { name: "About Us", url: "/about-us" },
      { name: "Our Qualifications", url: "/qualification" },
      { name: "Professional Dev", url: "/professional-dev" },
      { name: "Certificate Verification", url: "/verify-certificate" },
      { name: "Contact Us", url: "/contact-us" },
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
        title: "Quick Links",
        links: [
          { name: "About Us", href: "/about-us" },
          { name: "Qualifications", href: "/qualification" },
          { name: "Professional Development", href: "/professional-dev" },
        ],
      },
      {
        title: "Support",
        links: [
          { name: "Logo Use", href: "/logo-use" },
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
  return {
    key: page.key,
    title: page.title,
    blocks: starterBlocks(page),
    settings: {},
    customCss: "",
    enabled: false,
  };
}
