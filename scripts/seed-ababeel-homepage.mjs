/**
 * Publishes the Ababeel Safety homepage from the client's content document.
 *
 *   node scripts/seed-ababeel-homepage.mjs --dry-run    # show what would change
 *   node scripts/seed-ababeel-homepage.mjs             # write it
 *
 * Every section of the supplied content doc is mapped onto CMS blocks, so the
 * page stays fully editable in Owner → Website CMS afterwards — this script is
 * a starting point, not a replacement for the editor.
 *
 * The two headline figures in the stats bar are counts read from the database
 * rather than numbers typed into the page, so they stay true on their own. The
 * page's images come from public/cms/home (see build-home-images.mjs) and the
 * scroll-driven section from a frame sequence (see build-scroll-sequence.mjs);
 * if no sequence exists that section is simply left out.
 *
 * Safety: the current `home` document is written to a timestamped JSON backup
 * before anything is overwritten, and --dry-run changes nothing.
 */
import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import { connectSeed } from "./lib/connect.mjs";

const MONGO_URI = process.env.MONGO_URI;
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const pageKey = (process.argv.find((a) => a.startsWith("--page=")) || "--page=home").split("=")[1];
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "--db=").split("=")[1];

/* ---- brand palette, taken from the approved design ---- */
const NAVY = "#0b2a4a";
const NAVY_DEEP = "#081f38";
const ORANGE = "#f26722";
const LIGHT = "#f6f8fb";

let n = 0;
const id = () => `ab_${Date.now().toString(36)}_${(n += 1)}`;
const block = (type, props, style = {}) => ({ id: id(), type, props, _style: style });

/* ------------------------------------------------------------------ *
 * Data sources — the numbers on this page are read from the database.
 *
 * "Professionals trained" and "Training programmes" are counts, not figures
 * typed into the page, so they stay true as courses are added and learners
 * complete their training. The other two stats are claims from the client's
 * content document and are written as text, because no collection holds them.
 * ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ *
 * 1. HERO
 * ------------------------------------------------------------------ */
const hero = block("hero", {
  eyebrow: "Health, Safety & Environment",
  title: "Building Safer Workplaces. Developing Safety Professionals.",
  subtitle:
    "Professional HSE training and consultancy. Equip your workforce with the knowledge, skills and confidence to identify hazards, prevent incidents, and build a stronger culture of safety.",
  align: "left",
  bgType: "solid",
  bgColor: NAVY_DEEP,
  textColor: "#ffffff",
  accent: ORANGE,
  image: "/cms/home/hero.webp",
  overlay: "62",
  minHeight: "660",
  badges: "Professional Training | Practical Learning | Workplace Safety | Career Growth",
  primaryCta: { label: "Explore Our Courses", href: "/qualification" },
  secondaryCta: { label: "Talk to a Safety Expert", href: "/contact-us" },
});

/* ------------------------------------------------------------------ *
 * 2. STATS BAR  (client section 11, placed where the design shows it)
 * ------------------------------------------------------------------ */
const statsBar = block(
  "stats",
  {
    title: "",
    accent: ORANGE,
    bgColor: NAVY,
    items: [
      // Live counts — see dataSources above.
      { value: "{{trainedCount}}", suffix: "+", label: "Professionals trained" },
      { value: "{{programmeCount}}", suffix: "", label: "Training programmes" },
      // Authored: these come from the content document, not a collection.
      { value: "6", suffix: "", label: "Industries served" },
      { value: "100", suffix: "%", label: "Commitment to safety" },
    ],
  },
  { textColor: "#ffffff", paddingY: "8" }
);

/* ------------------------------------------------------------------ *
 * 3. TRUST / INTRODUCTION
 * ------------------------------------------------------------------ */
const intro = block("split", {
  eyebrow: "Who we are",
  title: "Safety Is Not Just a Requirement. It's a Responsibility.",
  text:
    "<p>At Ababeel Safety, we believe effective safety starts with the right knowledge. We provide professional HSE training, safety consultancy and workforce development solutions designed to help individuals and organisations build safer, more compliant and more productive workplaces.</p>" +
    "<p>Whether you are starting your career in safety or strengthening standards across your organisation, our programmes are designed to turn safety knowledge into practical action.</p>",
  bullets: [
    { text: "Learn — build real HSE knowledge" },
    { text: "Apply — use it on the workplace floor" },
    { text: "Prevent — stop incidents before they happen" },
    { text: "Protect — keep people and operations safe" },
  ],
  image: "/cms/home/trust.webp",
  imageAlt: "Three safety professionals on site wearing hard hats and high-visibility clothing",
  imageSide: "left",
  accent: ORANGE,
  badgeValue: "{{programmeCount}}",
  badgeLabel: "Programmes running now",
  cta: { label: "About Ababeel Safety", href: "/about-us" },
});

/* ------------------------------------------------------------------ *
 * 4. WHY CHOOSE ABABEEL SAFETY
 * ------------------------------------------------------------------ */
const whyChoose = block(
  "cardGrid",
  {
    eyebrow: "Why choose us",
    title: "Your Safety. Our Expertise.",
    subtitle: "Choosing the right safety training partner can make a real difference.",
    columns: "3",
    accent: ORANGE,
    variant: "numbered",
    items: [
      {
        title: "Industry-Focused Training",
        text: "Practical safety concepts you can apply in real workplace environments, not just in an exam hall.",
      },
      {
        title: "Professional Instructors",
        text: "Learn from experienced safety professionals with genuine industry knowledge behind them.",
      },
      {
        title: "Career Development",
        text: "Build valuable HSE knowledge and internationally recognised qualifications to support your career.",
      },
      {
        title: "Practical Approach",
        text: "We focus on understanding hazards, controlling risks and applying safety principles day to day.",
      },
      {
        title: "Training for Organisations",
        text: "Customised safety training solutions for companies, teams and whole organisations.",
      },
      {
        title: "Safety Beyond the Classroom",
        text: "Our goal is safety-conscious professionals and workplaces — not simply issuing certificates.",
      },
    ],
  },
  { bgColor: LIGHT, paddingY: "24" }
);

/* ------------------------------------------------------------------ *
 * 5. OUR HSE TRAINING PROGRAMMES
 * ------------------------------------------------------------------ */
const programmes = block(
  "cardGrid",
  {
    eyebrow: "Our programmes",
    title: "Build Your Safety Career With the Right Training",
    subtitle: "Take the next step toward becoming a confident and competent safety professional.",
    columns: "3",
    accent: ORANGE,
    variant: "plain",
    items: [
      {
        icon: "🛡️",
        title: "IOSH Managing Safely",
        text: "A practical safety management course for managers, supervisors and professionals responsible for workplace safety.",
        href: "/qualification",
        linkLabel: "Learn more",
      },
      {
        icon: "🦺",
        title: "OSHA Safety Training",
        text: "Essential knowledge of workplace hazards, safety practices, risk control and occupational health.",
        href: "/qualification",
        linkLabel: "Learn more",
      },
      {
        icon: "🚑",
        title: "First Aid Training",
        text: "Respond effectively to workplace injuries and emergencies with essential first-aid knowledge and practical skills.",
        href: "/qualification",
        linkLabel: "Learn more",
      },
      {
        icon: "🔥",
        title: "Fire Safety Training",
        text: "Fire hazards, prevention measures, emergency procedures, evacuation and effective response.",
        href: "/qualification",
        linkLabel: "Learn more",
      },
      {
        icon: "📋",
        title: "Risk Assessment Training",
        text: "Identify workplace hazards, assess risks and put appropriate control measures in place.",
        href: "/qualification",
        linkLabel: "Learn more",
      },
      {
        icon: "🎓",
        title: "Professional & Advanced Qualifications",
        text: "Development pathways for people looking to advance their career in health and safety.",
        href: "/qualification",
        linkLabel: "Explore programmes",
      },
    ],
  },
  { paddingY: "24" }
);

/* ------------------------------------------------------------------ *
 * 6. CAREER SECTION
 * ------------------------------------------------------------------ */
const career = block(
  "split",
  {
    eyebrow: "Your career",
    title: "Start Your Journey Toward a Career in HSE",
    text:
      "<p>The demand for qualified safety professionals continues to grow across construction, manufacturing, oil &amp; gas, engineering, logistics and other industries.</p>" +
      "<p>Whether you're a student, a fresh graduate, a working professional, a supervisor, a manager or an experienced HSE practitioner, the right training can help you move forward.</p>" +
      "<p><strong>Learn the skills. Earn the qualification. Build your career.</strong></p>",
    bullets: [],
    image: "/cms/home/career.webp",
    imageAlt: "A safety officer on site carrying survey equipment",
    imageSide: "right",
    accent: ORANGE,
    cta: { label: "View Training Programmes", href: "/qualification" },
  },
  { bgColor: NAVY, textColor: "#ffffff" }
);

/* ------------------------------------------------------------------ *
 * 7. CORPORATE TRAINING
 * ------------------------------------------------------------------ */
const corporate = block("split", {
  eyebrow: "For organisations",
  title: "Safer Employees. Safer Operations. Stronger Businesses.",
  text:
    "<p>Your workforce is your most valuable asset. Ababeel Safety provides practical HSE training solutions designed around your workplace, your workforce and your operational requirements.</p>",
  bullets: [
    { text: "Improve employee safety awareness" },
    { text: "Identify and control workplace hazards" },
    { text: "Reduce workplace incidents" },
    { text: "Strengthen safety culture" },
    { text: "Improve emergency preparedness" },
    { text: "Develop competent safety personnel" },
    { text: "Support workplace compliance" },
  ],
  image: "/cms/home/corporate.webp",
  imageAlt: "An operator working safely with plant machinery",
  imageSide: "left",
  accent: ORANGE,
  cta: { label: "Request Corporate Training", href: "/contact-us" },
});

/* ------------------------------------------------------------------ *
 * 8. SAFETY CONSULTANCY
 * ------------------------------------------------------------------ */
const consultancy = block(
  "split",
  {
    eyebrow: "Consultancy",
    title: "From Compliance to a Stronger Safety Culture",
    text:
      "<p>Training is only one part of workplace safety. Our consultancy services help organisations identify risks, improve safety procedures and develop practical systems for safer operations.</p>",
    bullets: [
      { text: "HSE policy & procedure development" },
      { text: "Workplace safety inspections" },
      { text: "Risk assessment & hazard identification" },
      { text: "Safety audits" },
      { text: "Emergency preparedness" },
      { text: "Fire safety assessment" },
      { text: "Safety documentation" },
      { text: "HSE management support" },
    ],
    image: "/cms/home/consultancy.webp",
    imageAlt: "Engineers inspecting pipework during a safety audit",
    imageSide: "right",
    accent: ORANGE,
    cta: { label: "Explore Consultancy Services", href: "/consultancy" },
  },
  { bgColor: LIGHT }
);

/* ------------------------------------------------------------------ *
 * 9. PRACTICAL SAFETY — the scroll-driven section
 *
 * The frame sequence is built by scripts/build-scroll-sequence.mjs and passed
 * in with --animation=<id>. Without one the section is left out entirely
 * rather than published pointing at frames that do not exist.
 * ------------------------------------------------------------------ */
const practical = (animation) =>
  block("scrollVideo", {
    renderMode: "frames",
    frames: animation.frames,
    frameCount: String(animation.frames.length),
    frameExt: "webp",
    animationId: animation.id,
    // The scenes below carry the words now. Left empty so the single caption
    // does not sit on top of them.
    title: "",
    subtitle: "",
    textColor: "#ffffff",
    textAlign: "center",
    fadeText: false,
    // Enough of a wash that the overlay stays readable over the brightest
    // frames in the sequence, not so much that the photography is lost.
    overlay: "28",
    bgColor: NAVY_DEEP,
    // Empty scroll distance lets the section size its own track from the frame
    // count, so every frame gets scrolled through.
    height: "",
    pxPerFrame: "14",
    stageHeight: "100vh",
    sticky: true,
    fit: "cover",
    mode: "scrub",
    startOffset: "0",
    endOffset: "100",
    speed: "1",
    smoothing: "0.18",
    showProgress: true,
    // A visitor with "reduce motion" on still gets the frames, just without the
    // eased catch-up and the scroll hold. A single still frame — what this used
    // to fall back to — is indistinguishable from a broken section.
    reducedMotion: "scrub",
    scrollStart: "top top",
    scrollEnd: "bottom bottom",
    accent: ORANGE,
    // On a phone the frames still play, but the stage is sized in svh: 100vh
    // there is the height with the address bar hidden, so a 100vh stage starts
    // taller than the screen and the section opens cut in half.
    mobileMode: "same",
    mobileStageHeight: "100svh",
    // Three beats over the one sequence, rather than one caption held for the
    // whole thing. Each owns a slice of the scroll and hands over to the next;
    // the ranges leave a two-point gap so they cross over rather than overlap.
    scenes: [
      {
        start: "0", end: "32",
        eyebrow: "Step one", heading: "Spot the hazard",
        text: "Training starts with seeing what everyone else walks past.",
        animation: "fade-up", ease: "power2.out", distance: "40",
        position: "center", align: "center", headingLevel: "h2",
        visibility: "both", textColor: "#ffffff",
      },
      {
        start: "34", end: "66",
        eyebrow: "Step two", heading: "Assess the risk",
        text: "Who is exposed, how badly, and how often.",
        animation: "fade-right", ease: "power2.out", distance: "60",
        position: "left", align: "left", headingLevel: "h2",
        visibility: "both", textColor: "#ffffff",
      },
      {
        start: "68", end: "100",
        eyebrow: "Step three", heading: "Put the controls in place",
        text: "Then prove the control works, and keep proving it.",
        animation: "zoom-in", ease: "power3.out", distance: "40",
        position: "center", align: "center", headingLevel: "h2",
        visibility: "both", textColor: "#ffffff",
        ctaLabel: "See our programmes", ctaHref: "/qualification",
      },
    ],
  });

/* ------------------------------------------------------------------ *
 * 10. INDUSTRIES WE SERVE
 * ------------------------------------------------------------------ */
const industries = block("imageTiles", {
  eyebrow: "Industries",
  title: "Safety Solutions Across Industries",
  subtitle:
    "Our training and consultancy solutions support organisations and professionals across a wide range of sectors.",
  columns: "3",
  accent: ORANGE,
  items: [
    {
      image: "/cms/home/industry-construction.webp",
      title: "Construction",
      text: "Building safer construction sites and developing competent site personnel.",
    },
    {
      image: "/cms/home/industry-oil-gas.webp",
      title: "Oil & Gas",
      text: "Strengthening safety awareness and risk management in high-risk environments.",
    },
    {
      image: "/cms/home/industry-manufacturing.webp",
      title: "Manufacturing",
      text: "Reducing workplace hazards and improving operational safety.",
    },
    {
      image: "/cms/home/industry-engineering.webp",
      title: "Engineering",
      text: "Supporting safer engineering operations and workplace practices.",
    },
    {
      image: "/cms/home/industry-logistics.webp",
      title: "Logistics & Warehousing",
      text: "Improving workplace safety, hazard awareness and emergency preparedness.",
    },
    {
      image: "/cms/home/industry-facilities.webp",
      title: "Facilities & Services",
      text: "Developing safer workplaces through effective safety systems and training.",
    },
  ],
});

/* ------------------------------------------------------------------ *
 * 11. TESTIMONIALS
 * ------------------------------------------------------------------ */
const testimonials = block(
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
);

/* ------------------------------------------------------------------ *
 * 12. FAQ
 * ------------------------------------------------------------------ */
const faq = block("faq", {
  title: "Frequently Asked Questions",
  subtitle: "The questions we are asked most often about training, enrolment and consultancy.",
  columns: "2",
  accent: ORANGE,
  items: [
    {
      q: "Who can enrol in Ababeel Safety courses?",
      a: "Our programmes suit students, graduates, working professionals, supervisors, managers and anyone looking to build or advance an HSE career.",
    },
    {
      q: "Do you provide corporate safety training?",
      a: "Yes. We provide customised HSE training solutions for organisations and teams, built around their workplace requirements.",
    },
    {
      q: "Are your courses suitable for beginners?",
      a: "Yes. We offer training for people starting their safety careers as well as professionals looking to extend existing knowledge.",
    },
    {
      q: "Do you provide HSE consultancy services?",
      a: "Yes. Our consultancy covers risk assessment, safety audits, workplace inspections, HSE documentation, fire safety and safety management support.",
    },
    {
      q: "How can I enrol in a course?",
      a: "Contact our team to discuss your preferred course, upcoming batches, fees and the enrolment process.",
    },
    {
      q: "Where does the training take place?",
      a: "Training runs at our centre and on site at your workplace, depending on the programme and the number of people attending.",
    },
  ],
});

/* ------------------------------------------------------------------ *
 * 13. FINAL CTA
 * ------------------------------------------------------------------ */
const finalCta = block("cta", {
  title: "Ready to Take the Next Step in Safety?",
  text:
    "Whether you're starting your HSE career, upgrading your professional skills or making your workplace safer, Ababeel Safety is here to help. Learn today. Work safer tomorrow.",
  button: { label: "Explore Courses", href: "/qualification" },
  secondaryButton: { label: "Talk to Our Training Team", href: "/contact-us" },
  bgColor: ORANGE,
  textColor: "#ffffff",
});

/* ------------------------------------------------------------------ *
 * the page
 * ------------------------------------------------------------------ */
function buildBlocks(animation) {
  return [
    hero,
    statsBar,
    intro,
    whyChoose,
    programmes,
    career,
    corporate,
    consultancy,
    ...(animation ? [practical(animation)] : []),
    industries,
    testimonials,
    faq,
    finalCta,
  ];
}

/* ------------------------------------------------------------------ *
 * run
 * ------------------------------------------------------------------ */
async function main() {
  const { client, db } = await connectSeed({
    uri: MONGO_URI,
    db: dbOverride,
    force,
    script: "the homepage seed",
  });
  const site = db.collection("sitecontents");

  // The scroll-driven section needs real frames. Prefer one named with
  // --animation=<id>, otherwise the most recent ready sequence, otherwise
  // publish the page without that section rather than with a broken one.
  const wanted = (process.argv.find((a) => a.startsWith("--animation=")) || "--animation=").split("=")[1];
  const seqQuery = wanted ? { _id: new ObjectId(wanted) } : { status: "READY" };
  const seq = await db.collection("cmsframesequences").findOne(seqQuery, { sort: { createdAt: -1 } });
  const animation =
    seq && seq.status === "READY" && Array.isArray(seq.frames) && seq.frames.length > 1
      ? { id: seq._id.toHexString(), name: seq.name, frames: seq.frames }
      : null;

  const blocks = buildBlocks(animation);
  const existing = await site.findOne({ key: pageKey });

  console.log(`Page:      ${pageKey}`);
  console.log(`Sections:  ${blocks.length} blocks from the content document`);
  console.log(`Numbers:   ${dataSources.map((d) => `{{${d.key}}} = count(${d.model})`).join(", ")}`);
  console.log(
    `Animation: ${animation ? `"${animation.name}" (${animation.frames.length} frames)` : "none found — the scroll section is left out"}`
  );
  console.log(
    `Currently: ${existing ? `${(existing.blocks || []).length} block(s), ${existing.enabled ? "published" : "draft"}` : "no document yet"}`
  );

  if (dryRun) {
    console.log("\n--dry-run: nothing was written.");
    console.log("Blocks that would be published:");
    blocks.forEach((b, i) => console.log(`  ${String(i + 1).padStart(2)}. ${b.type}`));
    await client.close();
    return;
  }

  if (existing) {
    const dir = path.join(process.cwd(), "backups");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `sitecontent-${pageKey}-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    console.log(`Backup:    ${file}`);
  }

  await site.updateOne(
    { key: pageKey },
    {
      $set: {
        title: "Home",
        blocks,
        dataSources,
        customCss: "",
        enabled: true,
        updatedByEmail: "seed-script",
        updatedAt: new Date(),
      },
      $setOnInsert: { key: pageKey, isCustom: false, createdAt: new Date() },
    },
    { upsert: true }
  );

  const written = await site.findOne({ key: pageKey });
  console.log(
    `\nWrote ${written?.blocks?.length ?? 0} blocks to ${db.databaseName}.sitecontents (key: "${pageKey}", enabled: ${written?.enabled}).`
  );
  console.log("");
  console.log("The homepage reads this on every request, so the content is live now — hard-refresh to see it.");
  console.log("If you also pulled new code, that still needs `npm run build` and a restart of the app.");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
