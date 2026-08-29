/**
 * Section templates in the Ababeel design language.
 *
 * Two kinds live here:
 *
 *  - Arrangements of the existing blocks (hero, stats, CTA, split…) styled with
 *    the ink/brand palette, so a page assembled from several of them reads as
 *    one design rather than a sampler of the older blue-and-violet patterns.
 *  - Sections built on the live catalogue blocks — a course grid or schedule
 *    strip that fills itself from the database, so inserting one is the whole
 *    job rather than the start of it.
 *
 * Client-safe: no database, no model imports.
 */
import { newId, defaultStyle } from "@/Components/cms/blockSchemas";

const b = (type, props = {}, style = {}) => ({ type, props, style });

// The palette the design system defines in app/globals.css.
const INK = "#0b1526";
const INK_DEEP = "#060d18";
const INK_MIST = "#f5f7fa";
const BRAND = "#f26722";

const up = { animation: "fade-up" };
const right = { animation: "fade-right" };
const left = { animation: "fade-left" };

/**
 * Categories these templates need that the library did not already have.
 *
 * Everything else goes into an existing category — an ABA hero belongs in
 * "Heroes" beside the others, not in a parallel "ABA — Heroes" list, which is
 * what makes a shared registry read as two separate libraries. Only section
 * kinds the library genuinely lacked are added, and they are named for what
 * they are rather than for the brand.
 */
export const TRAINING_TEMPLATE_CATEGORIES = ["Courses", "Schedule"];

/* ------------------------------------------------------------------ pieces */

const heroDarkLeft = (eyebrow, title, subtitle, primary, secondary) =>
  b("hero", {
    eyebrow,
    title,
    subtitle,
    align: "left",
    bgType: "solid",
    bgColor: INK,
    textColor: "#ffffff",
    minHeight: "560",
    accent: BRAND,
    image: "",
    primaryCta: primary,
    secondaryCta: secondary,
  });

const courseSection = (title, props = {}, style = up) =>
  b(
    "courseGrid",
    {
      eyebrow: "Training",
      title,
      subtitle: "",
      align: "left",
      source: "featured",
      limit: "6",
      columns: "3",
      cardTemplate: "standard",
      ctaLabel: "View all courses",
      ctaHref: "/courses",
      emptyMessage: "Courses will appear here once they are published.",
      ...props,
    },
    style,
  );

// The cta block names its own colours in props (not in the Design tab), and its
// buttons are `button` / `secondaryButton` — getting these wrong renders an
// empty band, which is what the template test caught.
const ctaDark = (title, text, primary, secondary) =>
  b(
    "cta",
    {
      title,
      text,
      button: primary,
      secondaryButton: secondary || { label: "", href: "" },
      bgColor: INK,
      textColor: "#ffffff",
    },
    up,
  );

/* --------------------------------------------------------------- templates */

export const TRAINING_TEMPLATES = [
  /* ===== HEROES (6) ===== */
  {
    id: "aba-hero-statement",
    name: "Ababeel — Hero, large statement",
    category: "Heroes",
    desc: "Big typography on ink, two actions",
    blocks: [
      heroDarkLeft(
        "Accredited safety training",
        "Competence you can evidence",
        "Internationally recognised qualifications, delivered by practitioners who have done the work.",
        { label: "Browse courses", href: "/courses" },
        { label: "See the schedule", href: "/schedule" },
      ),
    ],
  },
  {
    id: "aba-hero-editorial",
    name: "Ababeel — Hero, editorial image",
    category: "Heroes",
    desc: "Photo background, soft overlay, left aligned",
    blocks: [
      b("hero", {
        eyebrow: "Ababeel",
        title: "Training that holds up on site",
        subtitle: "Add a background image in the Content tab to finish this hero.",
        align: "left",
        bgColor: INK,
        textColor: "#ffffff",
        image: "",
        overlay: "55",
        minHeight: "620",
        accent: BRAND,
        primaryCta: { label: "Explore training", href: "/courses" },
        secondaryCta: { label: "Talk to us", href: "/contact-us" },
      }),
    ],
  },
  {
    id: "aba-hero-split",
    name: "Ababeel — Hero, split screen",
    category: "Heroes",
    desc: "Statement beside a supporting panel",
    blocks: [
      heroDarkLeft(
        "",
        "Safety qualifications, professionally delivered",
        "From foundation awards to professional practice, with sessions running throughout the year.",
        { label: "View the catalogue", href: "/courses" },
        { label: "Upcoming dates", href: "/schedule" },
      ),
      b(
        "stats",
        {
          title: "",
          accent: BRAND,
          bgColor: INK_DEEP,
          items: [
            { value: "12+", label: "Accredited programmes" },
            { value: "4", label: "Awarding bodies" },
            { value: "100%", label: "Practitioner-led" },
          ],
        },
        { textColor: "#ffffff", animation: "fade-up" },
      ),
    ],
  },
  {
    id: "aba-hero-full",
    name: "Ababeel — Hero, full-bleed visual",
    category: "Heroes",
    desc: "Edge-to-edge image, centred text",
    blocks: [
      b("hero", {
        eyebrow: "",
        title: "Build a safer operation",
        subtitle: "Add a wide background image to complete this hero.",
        align: "center",
        bgColor: INK_DEEP,
        textColor: "#ffffff",
        image: "",
        overlay: "60",
        minHeight: "660",
        accent: BRAND,
        primaryCta: { label: "Find your course", href: "/courses" },
        secondaryCta: { label: "", href: "" },
      }),
    ],
  },
  {
    id: "aba-hero-corporate",
    name: "Ababeel — Hero, dark corporate",
    category: "Heroes",
    desc: "Restrained, centred, with claims underneath",
    blocks: [
      b("hero", {
        eyebrow: "For organisations",
        title: "Workforce competence, managed properly",
        subtitle: "Training programmes designed around the risks your teams actually face.",
        align: "center",
        bgType: "solid",
        bgColor: INK,
        textColor: "#ffffff",
        minHeight: "520",
        accent: BRAND,
        badges: "Accredited\nPractitioner-led\nDelivered worldwide",
        image: "",
        primaryCta: { label: "Discuss your requirements", href: "/contact-us" },
        secondaryCta: { label: "Browse courses", href: "/courses" },
      }),
    ],
  },
  {
    id: "aba-hero-course",
    name: "Ababeel — Hero, course focused",
    category: "Heroes",
    desc: "Hero with the next available sessions underneath",
    blocks: [
      heroDarkLeft(
        "Next intakes",
        "Book onto an upcoming session",
        "Dates across all of our accredited programmes, with places confirmed by our training team.",
        { label: "See the full schedule", href: "/schedule" },
        { label: "Browse courses", href: "/courses" },
      ),
      b(
        "scheduleList",
        {
          eyebrow: "",
          title: "",
          subtitle: "",
          align: "left",
          mode: "",
          months: "3",
          limit: "3",
          showCourseName: true,
          ctaLabel: "",
          ctaHref: "/schedule",
          emptyMessage: "No training sessions are currently scheduled.",
        },
        up,
      ),
    ],
  },

  /* ===== COURSES ===== */
  {
    id: "aba-courses-featured",
    name: "Ababeel — Courses, featured grid",
    category: "Courses",
    desc: "Three featured courses, pulled live",
    blocks: [courseSection("Featured courses")],
  },
  {
    id: "aba-courses-editorial",
    name: "Ababeel — Courses, editorial cards",
    category: "Courses",
    desc: "Larger cards with generous typography",
    blocks: [
      courseSection("Our programmes", {
        cardTemplate: "editorial",
        columns: "3",
        subtitle: "Accredited training across occupational safety, environment and professional practice.",
      }),
    ],
  },
  {
    id: "aba-courses-minimal",
    name: "Ababeel — Courses, minimal list",
    category: "Courses",
    desc: "Typographic cards, no images needed",
    blocks: [
      courseSection("Every course we run", {
        cardTemplate: "minimal",
        columns: "2",
        source: "filtered",
        limit: "8",
      }),
    ],
  },
  {
    id: "aba-courses-spotlight",
    name: "Ababeel — Courses, spotlight",
    category: "Courses",
    desc: "One dark featured card beside two standard ones",
    blocks: [
      courseSection("Start here", { cardTemplate: "featured", columns: "3", limit: "3" }),
    ],
  },
  {
    id: "aba-courses-by-level",
    name: "Ababeel — Courses, by level",
    category: "Courses",
    desc: "Filtered to one level (set the slug in Content)",
    blocks: [
      courseSection("Professional level", {
        source: "filtered",
        level: "professional",
        cardTemplate: "horizontal",
        columns: "2",
        eyebrow: "By level",
      }),
    ],
  },

  /* ===== SCHEDULE ===== */
  {
    id: "aba-schedule-upcoming",
    name: "Ababeel — Schedule, upcoming sessions",
    category: "Schedule",
    desc: "The next few dates, pulled live",
    blocks: [
      b(
        "scheduleList",
        {
          eyebrow: "Dates",
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
        up,
      ),
    ],
  },
  {
    id: "aba-schedule-online",
    name: "Ababeel — Schedule, online only",
    category: "Schedule",
    desc: "Filtered to online delivery",
    blocks: [
      b(
        "scheduleList",
        {
          eyebrow: "Online",
          title: "Join from anywhere",
          subtitle: "Live, instructor-led sessions delivered online.",
          align: "center",
          mode: "online",
          months: "6",
          limit: "5",
          showCourseName: true,
          ctaLabel: "All upcoming dates",
          ctaHref: "/schedule",
          emptyMessage: "No online sessions are currently scheduled.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-schedule-cta",
    name: "Ababeel — Schedule, dates then CTA",
    category: "Schedule",
    desc: "Session list followed by a dark call to action",
    blocks: [
      b(
        "scheduleList",
        {
          eyebrow: "Dates",
          title: "Next available sessions",
          subtitle: "",
          align: "left",
          mode: "",
          months: "3",
          limit: "3",
          showCourseName: true,
          ctaLabel: "",
          ctaHref: "/schedule",
          emptyMessage: "No training sessions are currently scheduled.",
        },
        up,
      ),
      ctaDark(
        "Cannot find a date that works?",
        "Tell us what you need and we will let you know as soon as a suitable session opens.",
        { label: "Contact the team", href: "/contact-us" },
      ),
    ],
  },

  /* ===== REVIEWS (5) ===== */
  {
    id: "aba-reviews-google",
    name: "Ababeel — Reviews, review cards",
    category: "Testimonials",
    desc: "Star ratings and source marks, entered in the dashboard",
    blocks: [
      b(
        "reviewWall",
        {
          eyebrow: "Reviews",
          title: "What our learners say",
          subtitle: "",
          align: "center",
          layout: "google",
          limit: "6",
          columns: "3",
          featuredOnly: false,
          emptyMessage: "Reviews will appear here once they are published.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-reviews-carousel",
    name: "Ababeel — Reviews, swipeable row",
    category: "Testimonials",
    desc: "Horizontal scroller with snap",
    blocks: [
      b(
        "reviewWall",
        {
          eyebrow: "Reviews",
          title: "Trusted by professionals",
          subtitle: "",
          align: "center",
          layout: "carousel",
          limit: "8",
          columns: "3",
          featuredOnly: false,
          emptyMessage: "Reviews will appear here once they are published.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-reviews-grid",
    name: "Ababeel — Reviews, grid on mist",
    category: "Testimonials",
    desc: "Four-column grid on a light band",
    blocks: [
      b(
        "reviewWall",
        {
          eyebrow: "",
          title: "In their words",
          subtitle: "",
          align: "center",
          layout: "grid",
          limit: "8",
          columns: "4",
          featuredOnly: false,
          emptyMessage: "Reviews will appear here once they are published.",
        },
        { bgColor: INK_MIST, animation: "fade-up" },
      ),
    ],
  },
  {
    id: "aba-reviews-featured",
    name: "Ababeel — Reviews, single featured",
    category: "Testimonials",
    desc: "One large quote",
    blocks: [
      b(
        "reviewWall",
        {
          eyebrow: "",
          title: "",
          subtitle: "",
          align: "center",
          layout: "featured",
          limit: "1",
          columns: "3",
          featuredOnly: true,
          emptyMessage: "Feature a review in the dashboard to show it here.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-reviews-editorial",
    name: "Ababeel — Reviews, featured plus grid",
    category: "Testimonials",
    desc: "One large quote above a supporting grid",
    blocks: [
      b(
        "reviewWall",
        {
          eyebrow: "Reviews",
          title: "What our learners say",
          subtitle: "",
          align: "center",
          layout: "editorial",
          limit: "7",
          columns: "3",
          featuredOnly: false,
          emptyMessage: "Reviews will appear here once they are published.",
        },
        up,
      ),
    ],
  },

  /* ===== PEOPLE ===== */
  {
    id: "aba-team-grid",
    name: "Ababeel — Team, grid",
    category: "Team",
    desc: "Published team members, four across",
    blocks: [
      b(
        "teamGrid",
        {
          eyebrow: "People",
          title: "Meet the team",
          subtitle: "",
          align: "center",
          limit: "8",
          columns: "4",
          leadershipOnly: false,
          showBio: false,
          ctaLabel: "Meet everyone",
          ctaHref: "/about/team",
          emptyMessage: "Team profiles are on their way.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-team-leadership",
    name: "Ababeel — Team, leadership",
    category: "Team",
    desc: "Leadership only, with short bios",
    blocks: [
      b(
        "teamGrid",
        {
          eyebrow: "Leadership",
          title: "Who leads the work",
          subtitle: "",
          align: "left",
          limit: "3",
          columns: "3",
          leadershipOnly: true,
          showBio: true,
          ctaLabel: "",
          ctaHref: "/about/team",
          emptyMessage: "Leadership profiles are on their way.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-consultants-profiles",
    name: "Ababeel — Consultants, editorial profiles",
    category: "Team",
    desc: "Each profile in the layout it is set to",
    blocks: [
      b(
        "consultantList",
        {
          eyebrow: "Expertise",
          title: "Our consultants",
          subtitle: "",
          align: "left",
          display: "profiles",
          limit: "3",
          columns: "3",
          ctaLabel: "Meet the full team",
          ctaHref: "/about/consultants",
          emptyMessage: "Consultant profiles are on their way.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-consultants-cards",
    name: "Ababeel — Consultants, card grid",
    category: "Team",
    desc: "A uniform grid rather than editorial layouts",
    blocks: [
      b(
        "consultantList",
        {
          eyebrow: "",
          title: "Specialists you will work with",
          subtitle: "",
          align: "center",
          display: "cards",
          limit: "6",
          columns: "3",
          ctaLabel: "All consultants",
          ctaHref: "/about/consultants",
          emptyMessage: "Consultant profiles are on their way.",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-consultants-featured",
    name: "Ababeel — Consultants, single featured",
    category: "Team",
    desc: "One profile, in its own layout",
    blocks: [
      b(
        "consultantList",
        {
          eyebrow: "In focus",
          title: "",
          subtitle: "",
          align: "left",
          display: "profiles",
          limit: "1",
          columns: "3",
          ctaLabel: "Meet the team",
          ctaHref: "/about/consultants",
          emptyMessage: "Consultant profiles are on their way.",
        },
        left,
      ),
    ],
  },

  /* ===== ACCREDITATION ===== */
  {
    id: "aba-trust-strip",
    name: "Ababeel — Accreditation, trust strip",
    category: "Logos",
    desc: "Quiet logo row for near the top of a page",
    blocks: [
      b(
        "accreditationLogos",
        {
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
        { bgColor: INK_MIST, animation: "fade" },
      ),
    ],
  },
  {
    id: "aba-bodies-strip",
    name: "Ababeel — Awarding bodies, logo strip",
    category: "Logos",
    desc: "Logos linked to each body's page",
    blocks: [
      b(
        "awardingBodyLogos",
        {
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
        up,
      ),
    ],
  },
  {
    id: "aba-bodies-cards",
    name: "Ababeel — Awarding bodies, cards",
    category: "Logos",
    desc: "Logo, description and a link to the courses",
    blocks: [
      b(
        "awardingBodyLogos",
        {
          eyebrow: "Accreditation",
          title: "Who awards our qualifications",
          subtitle: "Every qualification we deliver is awarded by a recognised organisation.",
          align: "left",
          layout: "cards",
          grayscale: false,
          linkToBody: true,
          ctaLabel: "All awarding bodies",
          ctaHref: "/awarding-bodies",
        },
        up,
      ),
    ],
  },

  /* ===== CALL TO ACTION (6) ===== */
  {
    id: "aba-cta-dark",
    name: "Ababeel — CTA, dark band",
    category: "Call To Action",
    desc: "Ink background, one action",
    blocks: [
      ctaDark(
        "Ready to get your team qualified?",
        "Tell us what you need and we will put together a training plan that fits.",
        { label: "Start a conversation", href: "/contact-us" },
      ),
    ],
  },
  {
    id: "aba-cta-two",
    name: "Ababeel — CTA, two actions",
    category: "Call To Action",
    desc: "Primary and secondary side by side",
    blocks: [
      ctaDark(
        "Find the right course",
        "Browse the catalogue, or check which sessions are running in the next few months.",
        { label: "Browse courses", href: "/courses" },
        { label: "See the schedule", href: "/schedule" },
      ),
    ],
  },
  {
    id: "aba-cta-registration",
    name: "Ababeel — CTA, register now",
    category: "Call To Action",
    desc: "Points at the schedule, where a session can be chosen",
    blocks: [
      b(
        "cta",
        {
          title: "Secure your place",
          text:
            "Pick a session from the schedule and register in a couple of minutes. No payment is taken online — our team confirms every place personally.",
          button: { label: "Choose a date", href: "/schedule" },
          secondaryButton: { label: "Ask a question", href: "/contact-us" },
          bgColor: BRAND,
          textColor: "#ffffff",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-cta-light",
    name: "Ababeel — CTA, light band",
    category: "Call To Action",
    desc: "Mist background, restrained",
    blocks: [
      b(
        "cta",
        {
          title: "Not sure which course you need?",
          text: "Our training team will talk it through and recommend the right level.",
          button: { label: "Get advice", href: "/contact-us" },
          secondaryButton: { label: "", href: "" },
          bgColor: INK_MIST,
          textColor: INK,
        },
        up,
      ),
    ],
  },
  {
    id: "aba-cta-statement",
    name: "Ababeel — CTA, large typography",
    category: "Call To Action",
    desc: "A single strong line",
    blocks: [
      b(
        "cta",
        {
          title: "Competence is not paperwork. It is what people do at 3am.",
          text: "",
          button: { label: "See how we train", href: "/courses" },
          secondaryButton: { label: "", href: "" },
          bgColor: INK_DEEP,
          textColor: "#ffffff",
        },
        up,
      ),
    ],
  },
  {
    id: "aba-cta-corporate",
    name: "Ababeel — CTA, corporate enquiry",
    category: "Call To Action",
    desc: "For organisations booking a group",
    blocks: [
      ctaDark(
        "Training a whole team?",
        "We run closed courses at your site or online, scheduled around your operation.",
        { label: "Discuss group training", href: "/contact-us" },
        { label: "Browse courses", href: "/courses" },
      ),
    ],
  },

  /* ===== CONTENT ===== */
  {
    id: "aba-why",
    name: "Ababeel — Content, why choose us",
    category: "Features",
    desc: "Four reasons as cards",
    blocks: [
      b(
        "cardGrid",
        {
          title: "Why Ababeel",
          subtitle: "",
          columns: "4",
          items: [
            {
              icon: "🎓",
              title: "Accredited",
              text: "Qualifications awarded by recognised bodies, not certificates of attendance.",
              image: "",
              href: "/about/accreditations",
            },
            {
              icon: "🛠️",
              title: "Practitioner-led",
              text: "Taught by people who have managed the risks they are teaching about.",
              image: "",
              href: "",
            },
            {
              icon: "🌍",
              title: "Delivered anywhere",
              text: "Online, in person or blended, scheduled around your operation.",
              image: "",
              href: "/schedule",
            },
            {
              icon: "🤝",
              title: "Supported throughout",
              text: "A named contact from enquiry to certificate.",
              image: "",
              href: "/contact-us",
            },
          ],
        },
        up,
      ),
    ],
  },
  {
    id: "aba-about-split",
    name: "Ababeel — Content, about with image",
    category: "Content",
    desc: "Text beside an image",
    blocks: [
      b(
        "split",
        {
          eyebrow: "Who we are",
          title: "About Ababeel",
          text: "<p>Replace this with a short account of who you are and what you do. Two or three paragraphs is plenty — the detail belongs on the About page.</p>",
          bullets: [
            { text: "Accredited by recognised awarding bodies" },
            { text: "Delivered by working practitioners" },
            { text: "Online, in person or blended" },
          ],
          image: "",
          imageAlt: "",
          imageSide: "right",
          accent: BRAND,
          cta: { label: "More about us", href: "/about-us" },
        },
        right,
      ),
    ],
  },
  {
    id: "aba-stats",
    name: "Ababeel — Content, stats band",
    category: "Stats",
    desc: "Four numbers on ink",
    blocks: [
      b(
        "stats",
        {
          title: "",
          accent: BRAND,
          bgColor: INK,
          items: [
            { value: "12+", label: "Accredited programmes" },
            { value: "4", label: "Awarding bodies" },
            { value: "20+", label: "Years in practice" },
            { value: "98%", label: "Would recommend" },
          ],
        },
        { textColor: "#ffffff", animation: "fade-up" },
      ),
    ],
  },
  {
    id: "aba-faq",
    name: "Ababeel — Content, fAQ",
    category: "FAQ",
    desc: "Common questions about enrolling",
    blocks: [
      b(
        "faq",
        {
          title: "Frequently asked questions",
          items: [
            {
              q: "How do I register for a course?",
              a: "Choose a session from the schedule and complete the registration form. Our team confirms your place and answers any questions.",
            },
            {
              q: "Do I pay when I register?",
              a: "No. Registration collects your details only — no payment is taken online. Our team will contact you to confirm the arrangements.",
            },
            {
              q: "What certificate will I receive?",
              a: "Each course names its awarding body on its own page, along with the certificate issued on successful completion.",
            },
            {
              q: "Can you run a course for our team?",
              a: "Yes. We run closed courses at your site or online — get in touch with what you need.",
            },
          ],
        },
        up,
      ),
    ],
  },

  /* ===== FULL PAGE ===== */
  {
    id: "aba-page-home",
    name: "Ababeel — Full page, aBA Safety home",
    category: "Full Pages",
    desc: "Hero, trust strip, about, courses, why, bodies, schedule, reviews, CTA",
    blocks: [
      heroDarkLeft(
        "Accredited safety training",
        "Competence you can evidence",
        "Internationally recognised qualifications, delivered by practitioners who have done the work.",
        { label: "Browse courses", href: "/courses" },
        { label: "See the schedule", href: "/schedule" },
      ),
      b(
        "accreditationLogos",
        {
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
        { bgColor: INK_MIST, animation: "fade" },
      ),
      b(
        "split",
        {
          eyebrow: "Who we are",
          title: "About Ababeel",
          text: "<p>Replace this with a short account of who you are and what you do.</p>",
          bullets: [
            { text: "Accredited by recognised awarding bodies" },
            { text: "Delivered by working practitioners" },
            { text: "Online, in person or blended" },
          ],
          image: "",
          imageAlt: "",
          imageSide: "right",
          accent: BRAND,
          cta: { label: "More about us", href: "/about-us" },
        },
        right,
      ),
      courseSection("Featured courses", {
        subtitle: "A selection of the programmes we run most often.",
      }),
      b(
        "cardGrid",
        {
          title: "Why Ababeel",
          subtitle: "",
          columns: "4",
          items: [
            { icon: "🎓", title: "Accredited", text: "Qualifications awarded by recognised bodies.", image: "", href: "/about/accreditations" },
            { icon: "🛠️", title: "Practitioner-led", text: "Taught by people who have done the work.", image: "", href: "" },
            { icon: "🌍", title: "Delivered anywhere", text: "Online, in person or blended.", image: "", href: "/schedule" },
            { icon: "🤝", title: "Supported throughout", text: "A named contact from enquiry to certificate.", image: "", href: "/contact-us" },
          ],
        },
        up,
      ),
      b(
        "awardingBodyLogos",
        {
          eyebrow: "Accreditation",
          title: "Who awards our qualifications",
          subtitle: "",
          align: "center",
          layout: "strip",
          grayscale: true,
          linkToBody: true,
          ctaLabel: "All awarding bodies",
          ctaHref: "/awarding-bodies",
        },
        up,
      ),
      b(
        "scheduleList",
        {
          eyebrow: "Dates",
          title: "Upcoming sessions",
          subtitle: "",
          align: "left",
          mode: "",
          months: "3",
          limit: "3",
          showCourseName: true,
          ctaLabel: "See the full schedule",
          ctaHref: "/schedule",
          emptyMessage: "No training sessions are currently scheduled.",
        },
        up,
      ),
      b(
        "consultantList",
        {
          eyebrow: "Expertise",
          title: "Our consultants",
          subtitle: "",
          align: "center",
          display: "cards",
          limit: "3",
          columns: "3",
          ctaLabel: "Meet the team",
          ctaHref: "/about/consultants",
          emptyMessage: "Consultant profiles are on their way.",
        },
        up,
      ),
      b(
        "reviewWall",
        {
          eyebrow: "Reviews",
          title: "What our learners say",
          subtitle: "",
          align: "center",
          layout: "google",
          limit: "3",
          columns: "3",
          featuredOnly: false,
          emptyMessage: "Reviews will appear here once they are published.",
        },
        { bgColor: INK_MIST, animation: "fade-up" },
      ),
      ctaDark(
        "Ready to get your team qualified?",
        "Tell us what you need and we will put together a training plan that fits.",
        { label: "Start a conversation", href: "/contact-us" },
        { label: "Browse courses", href: "/courses" },
      ),
    ],
  },
];

/** Same shape as `createBlocksFromTemplate` produces, for the seed script. */
export function trainingTemplateBlocks(id) {
  const template = TRAINING_TEMPLATES.find((t) => t.id === id);
  if (!template) return [];
  return template.blocks.map((spec) => ({
    id: newId(),
    type: spec.type,
    props: structuredClone(spec.props || {}),
    _style: { ...defaultStyle(), ...(spec.style || {}) },
  }));
}

export default TRAINING_TEMPLATES;
