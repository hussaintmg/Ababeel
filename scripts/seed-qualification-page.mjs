/**
 * Publishes the Qualifications page.
 *
 *   node scripts/seed-qualification-page.mjs --dry-run
 *   node scripts/seed-qualification-page.mjs --publish
 *
 * The course grid is not a list typed into the CMS. It is a Repeat over a data
 * source, so every active course in the database appears with its own name,
 * description and price, and a course added tomorrow appears without anyone
 * touching this page.
 *
 * Safety: the current document is backed up to JSON first, and --dry-run
 * changes nothing.
 */
import fs from "fs";
import path from "path";
import { connectSeed } from "./lib/connect.mjs";

const MONGO_URI = process.env.MONGO_URI;
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const publish = args.has("--publish");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "--db=").split("=")[1];

const NAVY = "#0b2a4a";
const NAVY_DEEP = "#081f38";
const ORANGE = "#f26722";
const LIGHT = "#f6f8fb";

let n = 0;
const id = () => `ab_q_${Date.now().toString(36)}_${(n += 1)}`;
const block = (type, props, style = {}, children) => {
  const b = { id: id(), type, props, _style: style };
  if (children) b.children = children;
  return b;
};

/* ------------------------------------------------------------------ *
 * Data sources — the page reads the course catalogue, it does not
 * restate it. `courses` drives the grid; the two counts drive the band.
 * ------------------------------------------------------------------ */
const dataSources = [
  {
    key: "courses",
    label: "Active courses",
    model: "DefaultCourse",
    mode: "list",
    match: "all",
    filters: [{ field: "status", op: "equals", value: "active", dynamic: false }],
    sortField: "name",
    sortDir: "asc",
    limit: 48,
  },
  {
    key: "programmeCount",
    label: "Active training programmes",
    model: "DefaultCourse",
    mode: "count",
    match: "all",
    filters: [{ field: "status", op: "equals", value: "active", dynamic: false }],
  },
  {
    key: "trainedCount",
    label: "Learners who have completed training",
    model: "Candidate",
    mode: "count",
    match: "all",
    filters: [{ field: "status", op: "equals", value: "completed", dynamic: false }],
  },
];

const blocks = [
  block("hero", {
    eyebrow: "Our qualifications",
    title: "Training That Holds Up on Site.",
    subtitle:
      "Every programme below is one we currently run. Prices, titles and descriptions come straight from our course catalogue, so what you see here is what is available today.",
    align: "left",
    bgType: "solid",
    bgColor: NAVY_DEEP,
    textColor: "#ffffff",
    accent: ORANGE,
    image: "/cms/home/consultancy.webp",
    overlay: "64",
    minHeight: "480",
    badges: "Practical assessment | Experienced instructors | Individual & corporate",
    primaryCta: { label: "Talk to Our Team", href: "/contact-us" },
    secondaryCta: { label: "", href: "" },
  }),

  block(
    "stats",
    {
      title: "",
      accent: ORANGE,
      bgColor: NAVY,
      items: [
        { value: "{{programmeCount}}", suffix: "", label: "Programmes running now" },
        { value: "{{trainedCount}}", suffix: "+", label: "Professionals trained" },
        { value: "6", suffix: "", label: "Industries served" },
        { value: "100", suffix: "%", label: "Commitment to safety" },
      ],
    },
    // No vertical padding of its own: the band sits tight under the hero.
    { textColor: "#ffffff", paddingY: "0" }
  ),

  block("heading", {
    level: "2",
    text: "Courses Currently Available",
    subtitle:
      "{{programmeCount}} programmes, listed from the live course catalogue. Contact us for upcoming dates and group rates.",
    align: "center",
  }),

  /* The grid itself: one card per record in `courses`. */
  block(
    "repeater",
    {
      source: "courses",
      item: "course",
      layout: "grid",
      columns: "3",
      gap: "24",
      limit: "",
      offset: "",
      emptyText: "No courses are published yet. Add one under Default Courses.",
      showEmpty: true,
    },
    { paddingY: "0" },
    [
      block("card", {
        variant: "elevated",
        image: "",
        icon: "🛡️",
        badge: "",
        eyebrow: "{{course.country}}",
        title: "{{course.name}}",
        text: "{{course.description}}",
        meta: [],
        price: "{{course.currencySymbol}}{{course.price | formatNumber:0}}",
        priceNote: "per person",
        href: "/contact-us",
        linkLabel: "Enquire about this course",
        buttonStyle: "solid",
        accent: ORANGE,
      }),
    ]
  ),

  block(
    "split",
    {
      eyebrow: "How it works",
      title: "From Enquiry to Certificate",
      text:
        "<p>Tell us the course, the number of people and whether you would rather come to us or have us come to you. We confirm dates, prepare the materials for your workplace, and issue certification once the assessment is complete.</p>",
      bullets: [
        { text: "Choose a programme and tell us your numbers" },
        { text: "We confirm dates and location" },
        { text: "Training delivered around your operation" },
        { text: "Assessment, then certification" },
      ],
      image: "/cms/home/corporate.webp",
      imageAlt: "An operator working safely with plant machinery",
      imageSide: "left",
      accent: ORANGE,
      cta: { label: "Request Corporate Training", href: "/contact-us" },
    },
    { bgColor: LIGHT }
  ),

  block("faq", {
    title: "Before You Enrol",
    subtitle: "The questions we are asked most often about our programmes.",
    columns: "2",
    accent: ORANGE,
    items: [
      {
        q: "Are these courses suitable for beginners?",
        a: "Yes. We run programmes for people starting an HSE career as well as for experienced practitioners extending what they already know.",
      },
      {
        q: "Can you train our whole team?",
        a: "Yes. Corporate training is built around your workplace and your operational requirements — contact us with your numbers and we will confirm dates.",
      },
      {
        q: "Where does the training take place?",
        a: "At our centre or on site at your workplace, depending on the programme and the number of people attending.",
      },
      {
        q: "What do the prices include?",
        a: "Course delivery, materials and assessment. Get in touch for group rates and for anything that needs arranging around your shift patterns.",
      },
      {
        q: "How do I enrol?",
        a: "Use the enquiry button on any course above, or contact our team directly and we will guide you through it.",
      },
      {
        q: "Do you issue certificates?",
        a: "Yes, on successful completion of the assessment. Certificates can be verified from the Certificate Verification page.",
      },
    ],
  }),

  block("cta", {
    title: "Not Sure Which Course You Need?",
    text:
      "Tell us the work your people do and we will tell you which programme fits — and which one does not.",
    button: { label: "Talk to Our Training Team", href: "/contact-us" },
    secondaryButton: { label: "About Ababeel Safety", href: "/about-us" },
    bgColor: ORANGE,
    textColor: "#ffffff",
  }),
];

async function main() {
  const { client, db } = await connectSeed({
    uri: MONGO_URI,
    db: dbOverride,
    force,
    script: "the Qualifications seed",
  });
  const site = db.collection("sitecontents");
  const existing = await site.findOne({ key: "qualification" });
  const liveCourses = await db.collection("defaultcourses").countDocuments({ status: "active" });

  console.log(`Page:      qualification`);
  console.log(`Sections:  ${blocks.length} blocks`);
  console.log(`Data:      {{courses}} = ${liveCourses} active course(s), repeated as cards`);
  console.log(
    `Currently: ${existing ? `${(existing.blocks || []).length} block(s), ${existing.enabled ? "published" : "draft"}` : "no document yet"}`
  );

  if (dryRun) {
    console.log("\n--dry-run: nothing was written.");
    blocks.forEach((b, i) => console.log(`  ${String(i + 1).padStart(2)}. ${b.type}${b.children ? ` → ${b.children[0].type}` : ""}`));
    await client.close();
    return;
  }

  if (existing) {
    const dir = path.join(process.cwd(), "backups");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `sitecontent-qualification-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    console.log(`Backup:    ${file}`);
  }

  const enabled = publish ? true : !!existing?.enabled;
  await site.updateOne(
    { key: "qualification" },
    {
      $set: {
        title: "Qualifications",
        blocks,
        dataSources,
        customCss: "",
        enabled,
        updatedByEmail: "seed-script",
        updatedAt: new Date(),
      },
      $setOnInsert: { key: "qualification", isCustom: false, createdAt: new Date() },
    },
    { upsert: true }
  );

  const written = await site.findOne({ key: "qualification" });
  console.log(`\nWrote ${written?.blocks?.length ?? 0} blocks to ${db.databaseName}.sitecontents (key: "qualification").`);
  console.log(
    written?.enabled
      ? "Published — hard-refresh /qualification. The grid follows the course catalogue from now on."
      : 'A DRAFT: /qualification still shows its built-in content. Review it in the CMS,\nthen switch it to Published (or re-run with --publish).'
  );
  if (!liveCourses) {
    console.log("\nNote: no active courses in this database, so the grid will show its empty state.");
  }
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
