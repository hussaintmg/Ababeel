// LOCAL DESIGN HARNESS — never shipped. Renders the seeded CMS designs with
// mock catalogue data so the block UI can be seen and polished without a
// database. Guarded out of production builds.
import { notFound } from "next/navigation";
import BlockRenderer from "@/Components/cms/BlockRenderer";
import { homePageBlocks, trainingPageDocs, whyAbabeelDoc } from "@/scripts/lib/seed-data.mjs";

export const dynamic = "force-dynamic";

const img = (n) => `/${n}.png`;

const COURSES = [
  { _id: "c1", name: "Fire Safety Awareness — Level 2", slug: "fire-safety-2", code: "FS-201", shortDescription: "Practical fire prevention, risk spotting and emergency response for every workplace role.", duration: "2 days", durationDays: 2, featuredImage: "/2.png", level: { name: "Intermediate", color: "#6366f1", icon: "📘" }, awardingBody: { name: "SafeCert International", logo: "/ababeel-icon.svg" }, status: "published" },
  { _id: "c2", name: "Working at Height — Competent Person", slug: "working-at-height", code: "WH-310", shortDescription: "Harness systems, rescue planning and inspection duties for supervisors on live sites.", duration: "3 days", durationDays: 3, featuredImage: "/bannerv2.webp", level: { name: "Advanced", color: "#f26722", icon: "🎯" }, awardingBody: { name: "IWSH Global", logo: "/ababeel-icon.svg" }, status: "published" },
  { _id: "c3", name: "Risk Assessment in Practice", slug: "risk-assessment", code: "RA-105", shortDescription: "Write assessments people actually follow — hazards, likelihood, controls, review.", duration: "1 day", durationDays: 1, featuredImage: img(3), level: { name: "Beginner", color: "#0ea5e9", icon: "🌱" }, awardingBody: { name: "SafeCert International", logo: "/ababeel-icon.svg" }, status: "published" },
  { _id: "c4", name: "Occupational Health & Safety Management", slug: "ohs-management", code: "OM-540", shortDescription: "The full management-system cycle for senior safety professionals.", duration: "5 days", durationDays: 5, featuredImage: img(5), level: { name: "Professional", color: "#0f766e", icon: "🏅" }, awardingBody: { name: "IWSH Global", logo: "/ababeel-icon.svg" }, status: "published" },
  { _id: "c5", name: "Manual Handling Train-the-Trainer", slug: "manual-handling-ttt", code: "MH-220", shortDescription: "Deliver compliant manual-handling training inside your own organisation.", duration: "2 days", durationDays: 2, featuredImage: img(7), level: { name: "Intermediate", color: "#6366f1", icon: "📘" }, awardingBody: { name: "SafeCert International", logo: "/ababeel-icon.svg" }, status: "published" },
  { _id: "c6", name: "Confined Space Entry & Rescue", slug: "confined-space", code: "CS-410", shortDescription: "Atmosphere testing, permits and rescue drills, run in a live training rig.", duration: "3 days", durationDays: 3, featuredImage: img(9), level: { name: "Advanced", color: "#f26722", icon: "🎯" }, awardingBody: { name: "IWSH Global", logo: "/ababeel-icon.svg" }, status: "published" },
];

const days = (n) => new Date(Date.now() + n * 864e5).toISOString();
const SESSIONS = [
  { _id: "s1", referenceName: "Fire Safety — September intake", referenceCode: "FS-SEP", startDate: days(12), endDate: days(13), deliveryMode: "in_person", location: "Peterborough Training Centre", status: "open", course: { name: "Fire Safety Awareness — Level 2", slug: "fire-safety-2" } },
  { _id: "s2", referenceName: "Working at Height — October intake", referenceCode: "WH-OCT", startDate: days(33), endDate: days(35), deliveryMode: "blended", location: "Manchester Rig", examDate: days(36), status: "open", course: { name: "Working at Height — Competent Person", slug: "working-at-height" } },
  { _id: "s3", referenceName: "Risk Assessment — online cohort", referenceCode: "RA-ON", startDate: days(20), endDate: days(20), deliveryMode: "online", location: "", status: "open", course: { name: "Risk Assessment in Practice", slug: "risk-assessment" } },
];

const BODIES = [
  { _id: "b1", name: "SafeCert International", slug: "safecert", logo: "/ababeel-icon.svg", description: "Global awarding organisation for workplace safety qualifications." },
  { _id: "b2", name: "IWSH Global", slug: "iwsh", logo: "/ababeel-icon.svg", description: "Institute for work-at-height and industrial safety standards." },
  { _id: "b3", name: "NQFS Board", slug: "nqfs", logo: "/ababeel-icon.svg", description: "National qualification framework for safety practice." },
  { _id: "b4", name: "OSH Council", slug: "osh", logo: "/ababeel-icon.svg", description: "Occupational safety and health council." },
  { _id: "b5", name: "CPD Alliance", slug: "cpd", logo: "/ababeel-icon.svg", description: "Continuing professional development accreditor." },
];

const PEOPLE = [
  { _id: "p1", name: "Ayesha Khan", position: "Lead Trainer — Fire Safety", profileImage: img(1), bio: "Nineteen years across petrochemical and manufacturing sites before moving into training.", leadership: true },
  { _id: "p2", name: "Daniyal Ahmed", position: "Assessor — Work at Height", profileImage: img(2), bio: "Rope-access supervisor turned assessor; still climbs every month.", leadership: false },
  { _id: "p3", name: "Sarah Mitchell", position: "Head of Quality", profileImage: img(4), bio: "Keeps every course aligned with its awarding body's standard.", leadership: true },
  { _id: "p4", name: "Omar Farooq", position: "Consultant — Process Safety", profileImage: img(6), bio: "Investigates incidents so the next course teaches what actually goes wrong.", leadership: false },
];

const CONSULTANTS = [
  { _id: "k1", name: "Dr. Imran Siddiqui", position: "Principal Consultant, Process Safety", expertise: "HAZOP · Incident investigation · Safety cases", profileImage: img(8), bio: "Led safety-case work for energy operators on three continents. Teaches the advanced risk modules.", experience: "22 years", qualifications: ["PhD Chemical Engineering", "CMIOSH"], certifications: [] },
  { _id: "k2", name: "Helen Carter", position: "Senior Consultant, Construction", expertise: "CDM · Temporary works · Site auditing", profileImage: img(10), bio: "Audits major infrastructure sites and brings the findings straight into the classroom.", experience: "17 years", qualifications: ["MSc Construction Safety"], certifications: [] },
  { _id: "k3", name: "Bilal Hussain", position: "Consultant, Occupational Health", expertise: "Noise · Vibration · Occupational hygiene", profileImage: img(11), bio: "Occupational hygienist helping factories measure what they cannot see.", experience: "12 years", qualifications: ["LFOH"], certifications: [] },
];

const REVIEWS = [
  { _id: "t1", name: "James O'Neill", company: "Kier Group", reviewText: "The trainer had clearly worked at height for years — every question got a real answer, not a slide. Passed the assessment and used the rescue drill for real a month later.", rating: 5, source: "google", featured: true },
  { _id: "t2", name: "Fatima Zahra", company: "Descon Engineering", reviewText: "Booked twelve of our supervisors on the risk assessment course. Confirmation same day, certificates verified online by our client the week after.", rating: 5, source: "google", featured: false },
  { _id: "t3", name: "Mark Stevens", company: "Balfour Beatty", reviewText: "Proper qualification, proper awarding body, proper training rig. Worth every day away from site.", rating: 4, source: "google", featured: false },
];

const ACCREDITATIONS = BODIES.map((b, i) => ({ ...b, _id: `a${i}` }));

function inject(blocks) {
  return blocks.map((blk) => {
    const p = { ...blk.props };
    const lim = (n) => Math.max(1, parseInt(p.limit, 10) || n);
    switch (blk.type) {
      case "courseGrid": p._items = COURSES.slice(0, lim(6)); break;
      case "scheduleList": p._items = SESSIONS.slice(0, lim(3)); break;
      case "awardingBodyLogos": p._items = BODIES; break;
      case "accreditationLogos": p._items = ACCREDITATIONS; break;
      case "consultantList": p._items = CONSULTANTS.slice(0, lim(3)); break;
      case "teamGrid": p._items = PEOPLE; break;
      case "reviewWall": p._items = REVIEWS.slice(0, lim(3)); break;
      default: break;
    }
    return { ...blk, props: p };
  });
}

const PAGES = () => {
  const map = { home: homePageBlocks() };
  for (const p of trainingPageDocs()) map[p.key] = p.blocks;
  map["why-ababeel"] = whyAbabeelDoc().blocks;
  return map;
};

export default async function CmsPreview({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { page = "home" } = (await searchParams) || {};
  const pages = PAGES();
  const blocks = pages[page];
  if (!blocks) notFound();
  return (
    <div className="cms-fade-in">
      <BlockRenderer blocks={inject(blocks)} />
    </div>
  );
}
