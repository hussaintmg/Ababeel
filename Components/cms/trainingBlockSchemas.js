/**
 * Page-builder blocks that read the live training catalogue.
 *
 * Kept in their own file and merged into `BLOCK_TYPES` so blockSchemas.js does
 * not grow another thousand lines, and so the catalogue blocks can be read as
 * one group.
 *
 * What these do *not* have is an "items" list. Every other card block asks the
 * author to type its content; these read published courses, sessions and people
 * from the database, which is the whole point — a course published in the
 * dashboard appears on the home page without anyone editing the home page.
 * `_items` is filled in on the server by `lib/cms/trainingBlocks.js`.
 *
 * Client-safe: no database, no model imports.
 */

const CARD_TEMPLATE_OPTIONS = ["standard", "editorial", "minimal", "featured", "horizontal"];

/** Shown on every catalogue block: nothing published yet is a real state. */
const HEADER_FIELDS = [
  { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
  { key: "title", type: "text", label: "Title" },
  { key: "subtitle", type: "textarea", label: "Subtitle" },
  {
    key: "align",
    type: "select",
    label: "Heading alignment",
    options: ["left", "center"],
  },
];

const CTA_FIELDS = [
  { key: "ctaLabel", type: "text", label: "Button label" },
  { key: "ctaHref", type: "text", label: "Button link" },
];

export const TRAINING_BLOCK_TYPES = {
  courseGrid: {
    label: "Courses (live)",
    icon: "GraduationCap",
    description: "Course cards pulled from your published catalogue",
    defaults: {
      eyebrow: "",
      title: "Featured courses",
      subtitle: "",
      align: "left",
      source: "featured",
      level: "",
      awardingBody: "",
      category: "",
      sort: "recommended",
      limit: "6",
      columns: "3",
      cardTemplate: "standard",
      ctaLabel: "View all courses",
      ctaHref: "/courses",
      emptyMessage: "Courses will appear here once they are published.",
    },
    fields: [
      ...HEADER_FIELDS,
      {
        key: "source",
        type: "select",
        label: "Which courses",
        options: ["featured", "filtered"],
        help: '"featured" shows the courses flagged as featured, newest first. "filtered" uses the three filters below.',
      },
      {
        key: "level",
        type: "text",
        label: "Level slug",
        help: "Filtered mode only. e.g. professional",
      },
      { key: "awardingBody", type: "text", label: "Awarding body slug", help: "Filtered mode only." },
      { key: "category", type: "text", label: "Category", help: "Filtered mode only." },
      {
        key: "sort",
        type: "select",
        label: "Order",
        options: ["recommended", "newest", "name", "duration"],
      },
      { key: "limit", type: "text", label: "How many (max 24)" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      {
        key: "cardTemplate",
        type: "select",
        label: "Card design",
        options: CARD_TEMPLATE_OPTIONS,
      },
      ...CTA_FIELDS,
      { key: "emptyMessage", type: "text", label: "Message when there is nothing to show" },
    ],
  },

  scheduleList: {
    label: "Schedule (live)",
    icon: "CalendarDays",
    description: "Upcoming session dates from your course references",
    defaults: {
      eyebrow: "",
      title: "Upcoming sessions",
      subtitle: "",
      align: "left",
      mode: "",
      months: "3",
      limit: "4",
      showCourseName: true,
      ctaLabel: "See the full schedule",
      ctaHref: "/schedule",
      emptyMessage: "No training sessions are currently scheduled.",
    },
    fields: [
      ...HEADER_FIELDS,
      {
        key: "mode",
        type: "select",
        label: "Delivery mode",
        options: ["", "online", "physical", "hybrid", "other"],
        help: "Leave blank for all modes.",
      },
      {
        key: "months",
        type: "text",
        label: "Look ahead this many months",
        help: "Keeps the section filled near the end of a month.",
      },
      { key: "limit", type: "text", label: "How many (max 24)" },
      { key: "showCourseName", type: "boolean", label: "Show the course name on each card" },
      ...CTA_FIELDS,
      { key: "emptyMessage", type: "text", label: "Message when there is nothing to show" },
    ],
  },

  awardingBodyLogos: {
    label: "Awarding bodies (live)",
    icon: "Award",
    description: "Logo strip or grid of your published awarding bodies",
    defaults: {
      eyebrow: "",
      title: "Our awarding bodies",
      subtitle: "",
      align: "center",
      layout: "strip",
      grayscale: true,
      linkToBody: true,
      ctaLabel: "",
      ctaHref: "/awarding-bodies",
    },
    fields: [
      ...HEADER_FIELDS,
      { key: "layout", type: "select", label: "Layout", options: ["strip", "grid", "cards"] },
      {
        key: "grayscale",
        type: "boolean",
        label: "Grey out logos until hovered",
        help: "Reads as a trust strip rather than a set of adverts. Some marks are unreadable desaturated — turn this off if yours are.",
      },
      { key: "linkToBody", type: "boolean", label: "Link each logo to its page" },
      ...CTA_FIELDS,
    ],
  },

  accreditationLogos: {
    label: "Accreditations (live)",
    icon: "ShieldCheck",
    description: "The approvals and memberships you hold",
    defaults: {
      eyebrow: "",
      title: "Accredited and approved",
      subtitle: "",
      align: "center",
      trustStripOnly: true,
      layout: "strip",
      grayscale: true,
      ctaLabel: "",
      ctaHref: "/about/accreditations",
    },
    fields: [
      ...HEADER_FIELDS,
      {
        key: "trustStripOnly",
        type: "boolean",
        label: "Only those marked for the trust strip",
      },
      { key: "layout", type: "select", label: "Layout", options: ["strip", "grid"] },
      { key: "grayscale", type: "boolean", label: "Grey out logos until hovered" },
      ...CTA_FIELDS,
    ],
  },

  consultantList: {
    label: "Consultants (live)",
    icon: "UserCog",
    description: "Consultant profiles, in the layout each one is set to",
    defaults: {
      eyebrow: "",
      title: "Our consultants",
      subtitle: "",
      align: "left",
      limit: "3",
      display: "profiles",
      columns: "3",
      ctaLabel: "Meet the full team",
      ctaHref: "/about/consultants",
      emptyMessage: "Consultant profiles are on their way.",
    },
    fields: [
      ...HEADER_FIELDS,
      {
        key: "display",
        type: "select",
        label: "Display",
        options: ["profiles", "cards"],
        help: '"profiles" uses each consultant\'s own editorial layout; "cards" shows a uniform grid.',
      },
      { key: "limit", type: "text", label: "How many (max 24)" },
      { key: "columns", type: "select", label: "Columns (cards only)", options: ["2", "3", "4"] },
      ...CTA_FIELDS,
      { key: "emptyMessage", type: "text", label: "Message when there is nothing to show" },
    ],
  },

  teamGrid: {
    label: "Team (live)",
    icon: "Users",
    description: "Your published team members",
    defaults: {
      eyebrow: "",
      title: "Meet the team",
      subtitle: "",
      align: "center",
      limit: "8",
      columns: "4",
      leadershipOnly: false,
      showBio: true,
      ctaLabel: "",
      ctaHref: "/about/team",
      emptyMessage: "Team profiles are on their way.",
    },
    fields: [
      ...HEADER_FIELDS,
      { key: "leadershipOnly", type: "boolean", label: "Leadership only" },
      { key: "showBio", type: "boolean", label: "Show a short bio on each card" },
      { key: "limit", type: "text", label: "How many (max 24)" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      ...CTA_FIELDS,
      { key: "emptyMessage", type: "text", label: "Message when there is nothing to show" },
    ],
  },

  reviewWall: {
    label: "Reviews (live)",
    icon: "MessageSquareQuote",
    description: "Testimonials you have entered in the dashboard",
    defaults: {
      eyebrow: "",
      title: "What our learners say",
      subtitle: "",
      align: "center",
      layout: "google",
      limit: "6",
      columns: "3",
      featuredOnly: false,
      emptyMessage: "Reviews will appear here once they are published.",
    },
    fields: [
      ...HEADER_FIELDS,
      {
        key: "layout",
        type: "select",
        label: "Layout",
        options: ["google", "grid", "carousel", "featured", "editorial"],
        help: 'These are entered by hand in the dashboard — no reviews service is connected. "Google" only means the card style.',
      },
      { key: "featuredOnly", type: "boolean", label: "Featured reviews only" },
      { key: "limit", type: "text", label: "How many (max 24)" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      { key: "emptyMessage", type: "text", label: "Message when there is nothing to show" },
    ],
  },
};

export default TRAINING_BLOCK_TYPES;
