/**
 * Publishes the ABA Safety home page.
 *
 *   node scripts/seed-training-homepage.mjs --dry-run   # show what would change
 *   node scripts/seed-training-homepage.mjs             # write it (as a draft)
 *   node scripts/seed-training-homepage.mjs --publish   # write it and enable it
 *
 * The page is assembled from the "Full page — ABA Safety home" template: a
 * hero, the accreditation trust strip, an about panel, featured courses, why
 * ABA Safety, the awarding bodies, upcoming sessions, consultants, reviews and
 * a closing call to action.
 *
 * The catalogue sections fill themselves from the database — publishing a
 * course puts it on the home page without anyone editing the home page again.
 * The prose panels carry placeholder copy that says so; they are the client's
 * words to write, and inventing claims about a safety company is how invented
 * claims get published.
 *
 * Safety: the existing document is backed up to JSON first, `--dry-run`
 * changes nothing, and the page is left DISABLED unless --publish is passed —
 * so the current home page keeps rendering until someone has looked at this one
 * in the CMS.
 */
import fs from "node:fs";
import path from "node:path";
import { connectSeed } from "./lib/connect.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const publish = args.has("--publish");
const force = args.has("--force");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "").slice(5);

const ROOT = path.resolve(import.meta.dirname, "..");

// Mirrors Components/cms/trainingTemplates.js → "aba-page-home". Kept as data
// because the seed scripts run outside Next's module resolution; the block
// shapes are asserted against the schemas by __tests__/training/blocks.test.js.
const INK = "#0b1526";
const INK_DEEP = "#060d18";
const INK_MIST = "#f5f7fa";
const BRAND = "#f26722";

const STYLE = {
  bgType: "solid", bgColor: "", gradFrom: "", gradTo: "", gradAngle: "135",
  bgImage: "", bgOverlay: "", textColor: "", css: "", decorBefore: "", decorAfter: "",
  paddingY: "", paddingX: "", paddingTop: "", paddingRight: "", paddingBottom: "",
  paddingLeft: "", marginTop: "", marginBottom: "", maxWidth: "", minHeight: "",
  radius: "", shadow: "none", borderWidth: "", borderColor: "", align: "",
  animation: "", animDuration: "", animDelay: "", hover: "", className: "", anchorId: "",
};

let n = 0;
const block = (type, props, style = {}) => ({
  id: `seed_home_${Date.now().toString(36)}_${(n += 1)}`,
  type,
  props,
  _style: { ...STYLE, ...style },
});

const up = { animation: "fade-up" };

const BLOCKS = [
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
    title: "About ABA Safety",
    text:
      "<p>Replace this paragraph with your own account of who ABA Safety is and what you do. Two or three sentences is plenty — the detail belongs on the About page.</p>",
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
    title: "Why ABA Safety", subtitle: "", columns: "4",
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

async function main() {
  const { client, db, name } = await connectSeed({
    uri: "", db: dbOverride, force, script: "the home page seed",
  });

  try {
    const collection = db.collection("sitecontents");
    const existing = await collection.findOne({ key: "home" });

    console.log(`\nHome page: ${existing ? `${existing.blocks?.length || 0} block(s), ${existing.enabled ? "enabled" : "disabled"}` : "not created yet"}`);
    console.log(`Writing:   ${BLOCKS.length} block(s) — ${BLOCKS.map((b) => b.type).join(", ")}`);
    console.log(`Enabled:   ${publish ? "yes (--publish)" : "no — review it in the CMS, then enable it there"}`);

    if (dryRun) {
      console.log("\nDry run complete — nothing written.");
      return;
    }

    // The current home page is somebody's work. Back it up before replacing it.
    if (existing) {
      const backup = path.join(ROOT, `home-backup-${Date.now()}.json`);
      fs.writeFileSync(backup, JSON.stringify(existing, null, 2));
      console.log(`\nBacked up the current home page to ${path.basename(backup)}`);
    }

    const now = new Date();
    await collection.updateOne(
      { key: "home" },
      {
        $set: {
          title: "Home Page",
          blocks: BLOCKS,
          enabled: publish,
          updatedAt: now,
          updatedByEmail: "seed-training-homepage",
        },
        $setOnInsert: {
          key: "home", settings: {}, customCss: "", publicHidden: false,
          isCustom: false, route: "/", navLabel: "", showInNav: false,
          dataSources: [], dynamicRoute: null, createdAt: now,
        },
      },
      { upsert: true },
    );

    console.log(`\nDone — the home page was written to "${name}".`);
    if (!publish) {
      console.log('It is DISABLED, so the site still shows the built-in home page.');
      console.log("Open Website CMS → Home Page, review it, and enable it there.");
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
