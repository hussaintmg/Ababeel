/**
 * Seeds a working, dynamic CMS page so the data engine can be seen end to end.
 *
 *   node scripts/seed-demo-page.mjs                 # pages only
 *   node scripts/seed-demo-page.mjs --with-courses  # + sample DefaultCourse records
 *
 * It creates two published custom pages:
 *
 *   /courses          a listing driven by a live `courses` data source
 *   /course/<id>      a detail template rendered once per record
 *
 * Documents are written in exactly the shape the CMS API writes, so the pages
 * open normally in Owner → Website CMS afterwards. Re-running is safe: pages
 * are upserted by key.
 */
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import { connectSeed } from "./lib/connect.mjs";

const MONGO_URI = process.env.MONGO_URI;
const args = new Set(process.argv.slice(2));
const withCourses = args.has("--with-courses");
const force = args.has("--force");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "--db=").split("=")[1];
const VIDEO = "/uploads/cms/demo-scroll.mp4";
const POSTER = "/uploads/cms/demo-scroll-poster.jpg";

let uid = 0;
const id = (prefix) => `${prefix}_${(uid += 1)}`;

/* ------------------------------------------------------------------ *
 * sample records (only used with --with-courses)
 * ------------------------------------------------------------------ */

const SAMPLE_COURSES = [
  { name: "Working at Height — Level 2", description: "Practical, assessed training on fall prevention, harness inspection and rescue planning for elevated work.", price: 495, country: "United Kingdom" },
  { name: "Fire Warden Essentials", description: "Evacuation procedure, extinguisher selection and fire risk assessment for appointed wardens.", price: 245, country: "United Kingdom" },
  { name: "Confined Space Entry — Medium Risk", description: "Atmospheric testing, permit-to-work controls and emergency retrieval for medium-risk confined spaces.", price: 780, country: "United Arab Emirates" },
  { name: "Manual Handling Level 2", description: "Load assessment, safe lifting technique and musculoskeletal injury prevention in the workplace.", price: 165, country: "United Kingdom" },
  { name: "First Aid at Work (3 Day)", description: "The full HSE-aligned syllabus: primary survey, CPR, defibrillation and workplace incident management.", price: 610, country: "Pakistan" },
  { name: "Risk Assessment Fundamentals", description: "Hazard identification, likelihood scoring and building a defensible written assessment.", price: 320, country: "United Kingdom" },
  { name: "Legacy Scaffolding Awareness", description: "Retired programme retained for record purposes only.", price: 90, country: "United Kingdom", status: "inactive" },
];

/* ------------------------------------------------------------------ *
 * the listing page  (/courses)
 * ------------------------------------------------------------------ */

const courseCardHtml = `<article class="h-full flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl">
  <div class="flex items-center gap-2">
    <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{{course.status}}</span>
    <span class="text-[11px] font-medium text-slate-400">{{course.country}}</span>
  </div>
  <h3 class="mt-4 text-lg font-bold leading-snug text-slate-900">{{course.name}}</h3>
  <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{{course.description | truncate:130}}</p>
  <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
    <span class="text-2xl font-bold text-blue-700">{{course.currencySymbol}}{{course.price | formatNumber:0}}</span>
    <a href="/course/{{course._id}}" class="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">View course</a>
  </div>
</article>`;

const listingBlocks = [
  {
    id: id("b"),
    type: "scrollVideo",
    props: {
      src: VIDEO,
      mobileSrc: "",
      poster: POSTER,
      title: "Train with Ababeel",
      subtitle: "{{site.tagline}}",
      textColor: "#ffffff",
      textAlign: "center",
      fadeText: false,
      overlay: "25",
      bgColor: "#0b1220",
      height: "260vh",
      stageHeight: "100vh",
      sticky: true,
      fit: "cover",
      mode: "scrub",
      startOffset: "0",
      endOffset: "100",
      speed: "1",
      loops: "1",
      reverse: false,
      smoothing: "0.18",
      pauseOutside: true,
      preload: "auto",
      showProgress: true,
      reducedMotion: "scrub",
    },
    _style: {},
  },
  {
    id: id("b"),
    type: "heading",
    props: {
      text: "Our Courses",
      // A formula over the live collection — proves the expression engine.
      subtitle: "{{= length(courses) }} programmes currently open for enrolment.",
      level: "2",
      align: "center",
    },
    _style: { paddingTop: "56", paddingBottom: "8" },
  },
  {
    id: id("b"),
    type: "repeater",
    props: {
      source: "courses",
      item: "course",
      layout: "grid",
      columns: "3",
      gap: "24",
      limit: "",
      offset: "",
      emptyText: "No published courses yet — add one under Owner → Default Course.",
      showEmpty: true,
    },
    _style: { paddingBottom: "24" },
    children: [
      {
        id: id("c"),
        type: "customCode",
        props: { html: courseCardHtml, tailwind: true },
        _style: {},
        // Belt and braces alongside the data source's own filter.
        _conditions: {
          enabled: true,
          match: "all",
          rules: [{ left: "course.status", op: "==", right: "active", rightIsVariable: false }],
        },
      },
    ],
  },
  {
    id: id("b"),
    type: "stats",
    props: {
      title: "",
      bgColor: "#f8fafc",
      items: [
        { value: "{{= length(courses) }}", label: "Live programmes" },
        { value: "{{= currency(min(courses[0].price, courses[1].price), \"GBP\") }}", label: "From" },
        { value: "{{site.phone | default:—}}", label: "Talk to us" },
        { value: "{{= uppercase(site.name) }}", label: "Awarding body" },
      ],
    },
    _style: { marginTop: "24" },
  },
  {
    id: id("b"),
    type: "cta",
    props: {
      title: "Not sure which course fits?",
      text: "Tell us about your site and we will map the right programme to your risk profile.",
      button: { label: "Contact {{site.name}}", href: "/contact-us" },
      bgColor: "#0f172a",
      textColor: "#ffffff",
    },
    _style: {},
  },
];

const listingDataSources = [
  {
    key: "courses",
    label: "Published courses",
    model: "DefaultCourse",
    mode: "list",
    match: "all",
    filters: [{ field: "status", op: "equals", value: "active", dynamic: false }],
    sortField: "price",
    sortDir: "asc",
    limit: 12,
    skip: 0,
    paginate: false,
    populate: [],
  },
];

/* ------------------------------------------------------------------ *
 * the detail template  (/course/<id>)
 * ------------------------------------------------------------------ */

const detailBlocks = [
  {
    id: id("d"),
    type: "hero",
    props: {
      eyebrow: "{{course.country}}",
      title: "{{course.name}}",
      subtitle: "{{course.description}}",
      align: "left",
      bgType: "gradient",
      gradFrom: "#1d4ed8",
      gradTo: "#0b1220",
      gradAngle: "135",
      textColor: "#ffffff",
      image: "",
      overlay: "55",
      minHeight: "420",
      rounded: false,
      primaryCta: { label: "Enrol on this course", href: "/contact-us" },
      secondaryCta: { label: "Back to all courses", href: "/courses" },
    },
    _style: {},
  },
  {
    id: id("d"),
    type: "stats",
    props: {
      title: "",
      bgColor: "#f8fafc",
      items: [
        { value: "{{course.currencySymbol}}{{course.price | formatNumber:0}}", label: "Course fee" },
        { value: "{{course.currency}}", label: "Billed in" },
        { value: "{{course.country}}", label: "Delivered in" },
        { value: "{{course.createdAt | formatDate:medium}}", label: "Published" },
      ],
    },
    _style: {},
  },
  {
    id: id("d"),
    type: "richText",
    props: {
      html: "<h2>About this programme</h2><p>{{course.description}}</p><p>Assessment is continuous and certification is issued by {{site.name}} on successful completion.</p>",
      maxWidth: "prose",
      align: "left",
    },
    _style: { paddingTop: "24" },
  },
  {
    id: id("d"),
    type: "cta",
    props: {
      title: "Enrol on {{course.name}}",
      text: "Places are confirmed once your organisation account is approved.",
      button: { label: "Request a place", href: "/contact-us" },
      bgColor: "#2563eb",
      textColor: "#ffffff",
    },
    _style: {},
    // Only offer enrolment on a course that is actually open.
    _conditions: {
      enabled: true,
      match: "all",
      rules: [{ left: "course.status", op: "==", right: "active", rightIsVariable: false }],
    },
  },
];

/* ------------------------------------------------------------------ *
 * run
 * ------------------------------------------------------------------ */

function pageDoc(over) {
  const now = new Date();
  return {
    title: "",
    blocks: [],
    settings: {},
    customCss: "",
    enabled: true,
    isCustom: true,
    navLabel: "",
    showInNav: false,
    dataSources: [],
    dynamicRoute: null,
    updatedByEmail: "seed-script",
    updatedAt: now,
    ...over,
  };
}

async function main() {
  const { client, db } = await connectSeed({
    uri: MONGO_URI,
    db: dbOverride,
    force,
    script: "the demo page seed",
  });

  if (withCourses) {
    const courses = db.collection("defaultcourses");
    const existing = await courses.countDocuments({});
    if (existing > 0) {
      console.log(`• defaultcourses already has ${existing} record(s) — leaving them alone.`);
    } else {
      const now = new Date();
      await courses.insertMany(
        SAMPLE_COURSES.map((c, i) => ({
          _id: new ObjectId(),
          name: c.name,
          description: c.description,
          price: c.price,
          currency: "GBP",
          currencySymbol: "£",
          currencyCode: "GBP",
          country: c.country,
          isDefaultCourse: true,
          status: c.status || "active",
          createdAt: new Date(now.getTime() - i * 86400000),
          updatedAt: now,
          __v: 0,
        }))
      );
      console.log(`• inserted ${SAMPLE_COURSES.length} sample courses`);
    }
  }

  const site = db.collection("sitecontents");

  await site.updateOne(
    { key: "courses" },
    {
      $set: pageDoc({
        title: "Our Courses",
        route: "/courses",
        navLabel: "Courses",
        showInNav: true,
        blocks: listingBlocks,
        dataSources: listingDataSources,
        dynamicRoute: null,
      }),
      $setOnInsert: { key: "courses", createdAt: new Date() },
    },
    { upsert: true }
  );
  console.log("• /courses      listing page (live `courses` data source, Repeat + conditions)");

  await site.updateOne(
    { key: "course" },
    {
      $set: pageDoc({
        title: "{{course.name}}",
        route: "/course",
        blocks: detailBlocks,
        dataSources: [],
        dynamicRoute: {
          enabled: true,
          model: "DefaultCourse",
          lookupField: "_id",
          paramName: "id",
          itemKey: "course",
        },
      }),
      $setOnInsert: { key: "course", createdAt: new Date() },
    },
    { upsert: true }
  );
  console.log("• /course/<id>  detail template (one page per record)");

  const first = await db.collection("defaultcourses").findOne({ status: "active" });
  console.log("\nOpen:");
  console.log("  /courses");
  if (first) console.log(`  /course/${first._id}`);

  const videoPath = path.join(process.cwd(), "public", VIDEO.replace(/^\//, ""));
  if (!fs.existsSync(videoPath)) {
    console.log(`\nNote: ${VIDEO} is not present, so the Scroll Video section will render its\n"select a video" placeholder. Upload a video in the block's settings to replace it.`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
