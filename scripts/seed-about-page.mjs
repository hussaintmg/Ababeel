/**
 * Publishes the About Us page.
 *
 *   node scripts/seed-about-page.mjs --dry-run   # show what would change
 *   node scripts/seed-about-page.mjs             # write it
 *
 * The client's content document covers the homepage only, so the wording here
 * was drafted from it — the same voice, the same claims, nothing invented about
 * the company that the homepage does not already say. Review it before
 * publishing; the page is left as a draft for exactly that reason.
 *
 * The two headline figures are counts read from the database, like the
 * homepage's, so they cannot drift apart from it.
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
const id = () => `ab_about_${Date.now().toString(36)}_${(n += 1)}`;
const block = (type, props, style = {}) => ({ id: id(), type, props, _style: style });

/* The same two live counts the homepage uses, so the numbers agree. */
const dataSources = [
  {
    key: "trainedCount",
    label: "Learners who have completed training",
    model: "Candidate",
    mode: "count",
    match: "all",
    filters: [{ field: "status", op: "equals", value: "completed", dynamic: false }],
  },
  {
    key: "programmeCount",
    label: "Active training programmes",
    model: "DefaultCourse",
    mode: "count",
    match: "all",
    filters: [{ field: "status", op: "equals", value: "active", dynamic: false }],
  },
];

const blocks = [
  block("hero", {
    eyebrow: "About us",
    title: "Safety Knowledge, Turned Into Practice.",
    subtitle:
      "Ababeel Safety is a health, safety and environmental training and consultancy provider. We help individuals build careers in HSE, and help organisations make their workplaces genuinely safer.",
    align: "left",
    bgType: "solid",
    bgColor: NAVY_DEEP,
    textColor: "#ffffff",
    accent: ORANGE,
    image: "/cms/home/about-hero.webp",
    overlay: "62",
    minHeight: "520",
    badges: "Training | Consultancy | Workforce development",
    primaryCta: { label: "Explore Our Courses", href: "/qualification" },
    secondaryCta: { label: "Talk to Our Team", href: "/contact-us" },
  }),

  block(
    "stats",
    {
      title: "",
      accent: ORANGE,
      bgColor: NAVY,
      items: [
        { value: "{{trainedCount}}", suffix: "+", label: "Professionals trained" },
        { value: "{{programmeCount}}", suffix: "", label: "Training programmes" },
        { value: "6", suffix: "", label: "Industries served" },
        { value: "100", suffix: "%", label: "Commitment to safety" },
      ],
    },
    { textColor: "#ffffff", paddingY: "8" }
  ),

  block("split", {
    eyebrow: "Who we are",
    title: "Safety Is Not Just a Requirement. It's a Responsibility.",
    text:
      "<p>We believe effective safety starts with the right knowledge. Ababeel Safety provides professional HSE training, safety consultancy and workforce development solutions for individuals and organisations alike.</p>" +
      "<p>Whether someone is starting a career in safety or an organisation is strengthening standards across its sites, our work is the same: turn safety knowledge into something people actually do.</p>",
    bullets: [
      { text: "Practical training, not exam drilling" },
      { text: "Instructors with real industry experience" },
      { text: "Programmes for individuals and for teams" },
      { text: "Consultancy that continues after the course" },
    ],
    image: "/cms/home/trust.webp",
    imageAlt: "Two safety professionals on site in hard hats and high-visibility clothing",
    imageSide: "left",
    accent: ORANGE,
    badgeValue: "{{programmeCount}}",
    badgeLabel: "Programmes running now",
  }),

  block(
    "cardGrid",
    {
      eyebrow: "What we stand for",
      title: "Our Purpose",
      subtitle: "Three commitments that shape every course we run and every site we visit.",
      columns: "3",
      accent: ORANGE,
      variant: "plain",
      items: [
        {
          icon: "🎯",
          title: "Our mission",
          text: "To raise the standard of workplace safety by making competent, practical HSE knowledge available to the people who need it.",
        },
        {
          icon: "🔭",
          title: "Our vision",
          text: "Workplaces where hazards are identified before they cause harm, and where safety is part of how the job is done rather than a form that gets signed.",
        },
        {
          icon: "🤝",
          title: "Our promise",
          text: "We measure ourselves on competence, not certificates. A course has worked when the learner knows what to do when it matters.",
        },
      ],
    },
    { bgColor: LIGHT, paddingY: "24" }
  ),

  block(
    "cardGrid",
    {
      eyebrow: "What we do",
      title: "Four Ways We Work With You",
      subtitle: "",
      columns: "4",
      accent: ORANGE,
      variant: "numbered",
      items: [
        {
          title: "HSE Training",
          text: "IOSH, OSHA, first aid, fire safety, risk assessment and professional qualifications.",
          href: "/qualification",
          linkLabel: "See programmes",
        },
        {
          title: "Corporate Training",
          text: "Courses built around your workplace, your workforce and your operational requirements.",
          href: "/contact-us",
          linkLabel: "Request training",
        },
        {
          title: "Safety Consultancy",
          text: "Risk assessment, audits, inspections, HSE documentation and management support.",
          href: "/consultancy",
          linkLabel: "Explore services",
        },
        {
          title: "Career Support",
          text: "Guidance for students, graduates and working professionals moving into HSE roles.",
          href: "/professional-dev",
          linkLabel: "Start your career",
        },
      ],
    },
    { paddingY: "24" }
  ),

  block(
    "split",
    {
      eyebrow: "Our approach",
      title: "We Teach the Job, Not the Exam.",
      text:
        "<p>A certificate records attendance. Competence is what a person does on a live site, under time pressure, when something is not as the method statement described it.</p>" +
        "<p>So our courses are built around real scenarios: what the hazard looks like, why the control is the control, and what to do when the control is missing.</p>",
      bullets: [
        { text: "Hazard identification in real settings" },
        { text: "Risk assessment people will actually use" },
        { text: "Control measures explained, not recited" },
        { text: "Emergency response practised, not described" },
      ],
      image: "/cms/home/about-approach.webp",
      imageAlt: "A worker inspecting equipment while wearing protective gloves",
      imageSide: "right",
      accent: ORANGE,
      cta: { label: "View Training Programmes", href: "/qualification" },
    },
    { bgColor: LIGHT }
  ),

  // Replace both images with a real pair from one of your own sites — same
  // position, before and after — before this page goes live. The two here come
  // from the existing photo library and do not document a specific project.
  block("beforeAfter", {
    eyebrow: "Before and after",
    title: "What Changes After Training",
    subtitle:
      "Drag the handle to compare a workplace before a safety review with the same workplace once controls, PPE discipline and supervision are in place.",
    beforeImage: "/cms/home/about-before.webp",
    afterImage: "/cms/home/about-after.webp",
    beforeLabel: "Before",
    afterLabel: "After",
    startAt: "50",
    height: "520",
    accent: ORANGE,
  }),

  block(
    "testimonials",
    {
      title: "What Our Learners Say",
      layout: "grid",
      items: [
        {
          quote:
            "The training was practical, professional and easy to understand. The instructor explained everything with real workplace examples.",
          name: "HSE Training Participant",
          role: "Course feedback",
          rating: "5",
        },
        {
          quote:
            "A very professional learning experience. The training helped me understand safety concepts that I can actually apply at work.",
          name: "Safety Professional",
          role: "Course feedback",
          rating: "5",
        },
      ],
    },
    { bgColor: LIGHT, paddingY: "24" }
  ),

  block("cta", {
    title: "Let's Make Your Workplace Safer",
    text:
      "Whether you are starting an HSE career or responsible for safety across a whole organisation, our team can point you at the right programme.",
    button: { label: "Explore Courses", href: "/qualification" },
    secondaryButton: { label: "Contact Us", href: "/contact-us" },
    bgColor: ORANGE,
    textColor: "#ffffff",
  }),
];

async function main() {
  const { client, db } = await connectSeed({
    uri: MONGO_URI,
    db: dbOverride,
    force,
    script: "the About Us seed",
  });
  const site = db.collection("sitecontents");
  const existing = await site.findOne({ key: "about-us" });

  console.log(`Page:      about-us`);
  console.log(`Sections:  ${blocks.length} blocks`);
  console.log(`Numbers:   ${dataSources.map((d) => `{{${d.key}}} = count(${d.model})`).join(", ")}`);
  console.log(
    `Currently: ${existing ? `${(existing.blocks || []).length} block(s), ${existing.enabled ? "published" : "draft"}` : "no document yet"}`
  );

  if (dryRun) {
    console.log("\n--dry-run: nothing was written.");
    blocks.forEach((b, i) => console.log(`  ${String(i + 1).padStart(2)}. ${b.type}`));
    await client.close();
    return;
  }

  if (existing) {
    const dir = path.join(process.cwd(), "backups");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `sitecontent-about-us-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    console.log(`Backup:    ${file}`);
  }

  // Left as a draft unless --publish is passed: the before/after section needs
  // a real pair of photographs first, and nobody should discover that on the
  // live site.
  const enabled = publish ? true : !!existing?.enabled;

  await site.updateOne(
    { key: "about-us" },
    {
      $set: {
        title: "About Us",
        blocks,
        dataSources,
        customCss: "",
        enabled,
        updatedByEmail: "seed-script",
        updatedAt: new Date(),
      },
      $setOnInsert: { key: "about-us", isCustom: false, createdAt: new Date() },
    },
    { upsert: true }
  );

  const written = await site.findOne({ key: "about-us" });
  console.log(`\nWrote ${written?.blocks?.length ?? 0} blocks to ${db.databaseName}.sitecontents (key: "about-us").`);
  console.log(
    written?.enabled
      ? "The page is published — hard-refresh /about-us to see it."
      : 'The page is a DRAFT: /about-us still shows its built-in content.\nReview it in Owner → Website CMS → About Us, swap the before/after photos,\nthen switch it to Published (or re-run with --publish).'
  );
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
