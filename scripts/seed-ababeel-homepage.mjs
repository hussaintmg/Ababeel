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
 * Safety: the current `home` document is written to a timestamped JSON backup
 * before anything is overwritten, and --dry-run changes nothing.
 */
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Example:\n  MONGO_URI='mongodb+srv://…' node scripts/seed-ababeel-homepage.mjs");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const pageKey = (process.argv.find((a) => a.startsWith("--page=")) || "--page=home").split("=")[1];

/* ---- brand palette, taken from the approved design ---- */
const NAVY = "#0b2a4a";
const NAVY_DEEP = "#081f38";
const ORANGE = "#f26722";
const LIGHT = "#f6f8fb";

let n = 0;
const id = () => `ab_${Date.now().toString(36)}_${(n += 1)}`;
const block = (type, props, style = {}) => ({ id: id(), type, props, _style: style });

/* ------------------------------------------------------------------ *
 * 1. HERO
 * ------------------------------------------------------------------ */
const hero = block(
  "hero",
  {
    eyebrow: "BUILDING A SAFER FUTURE",
    title: "Building Safer Workplaces. Developing Safety Professionals.",
    subtitle:
      "Professional Health, Safety & Environmental (HSE) Training and Consultancy. Equip your workforce with the knowledge, skills, and confidence to identify hazards, prevent incidents, and create a stronger culture of safety.",
    align: "left",
    bgType: "gradient",
    gradFrom: NAVY,
    gradTo: NAVY_DEEP,
    gradAngle: "120",
    textColor: "#ffffff",
    image: "",
    overlay: "55",
    minHeight: "560",
    rounded: false,
    primaryCta: { label: "Explore Our Courses", href: "/qualification" },
    secondaryCta: { label: "Talk to a Safety Expert", href: "/contact-us" },
  }
);

const heroStrip = block(
  "stats",
  {
    title: "",
    bgColor: NAVY_DEEP,
    items: [
      { value: "Professional", label: "Training" },
      { value: "Practical", label: "Learning" },
      { value: "Workplace", label: "Safety" },
      { value: "Career", label: "Growth" },
    ],
  },
  { paddingY: "18", textColor: "#ffffff" }
);

/* ------------------------------------------------------------------ *
 * 2. TRUST / INTRODUCTION
 * ------------------------------------------------------------------ */
const introHeading = block(
  "heading",
  {
    text: "Safety Is Not Just a Requirement. It's a Responsibility.",
    subtitle: "At Ababeel Safety, we believe effective safety starts with the right knowledge.",
    level: "2",
    align: "center",
  },
  { paddingTop: "64", paddingBottom: "8" }
);

const introBody = block(
  "richText",
  {
    html:
      "<p>We provide professional HSE training, safety consultancy, and workforce development solutions designed to help individuals and organizations build safer, more compliant, and more productive workplaces.</p>" +
      "<p>Whether you are starting your career in safety or looking to strengthen safety standards across your organization, our programs are designed to turn safety knowledge into practical action.</p>" +
      `<p style="font-weight:700;color:${ORANGE};font-size:1.15rem;">Learn. Apply. Prevent. Protect.</p>`,
    maxWidth: "prose",
    align: "center",
  },
  { paddingBottom: "56" }
);

/* ------------------------------------------------------------------ *
 * 3. WHY CHOOSE ABABEEL SAFETY?
 * ------------------------------------------------------------------ */
const whyChoose = block(
  "cardGrid",
  {
    title: "Your Safety. Our Expertise.",
    subtitle: "Choosing the right safety training partner can make a real difference.",
    columns: "3",
    items: [
      { icon: "01", image: "", title: "Industry-Focused Training", text: "Learn practical safety concepts that can be applied in real workplace environments.", href: "" },
      { icon: "02", image: "", title: "Professional Instructors", text: "Learn from experienced safety professionals with practical industry knowledge.", href: "" },
      { icon: "03", image: "", title: "Career Development", text: "Build valuable HSE knowledge and internationally recognized qualifications to support your professional journey.", href: "" },
      { icon: "04", image: "", title: "Practical Approach", text: "We focus on understanding hazards, controlling risks, and applying safety principles—not just passing an exam.", href: "" },
      { icon: "05", image: "", title: "Training for Organizations", text: "Customized safety training solutions for companies, teams, and organizations.", href: "" },
      { icon: "06", image: "", title: "Safety Beyond the Classroom", text: "Our goal is to help create safety-conscious professionals and workplaces—not simply issue certificates.", href: "" },
    ],
  },
  { bgColor: LIGHT, paddingY: "64" }
);

/* ------------------------------------------------------------------ *
 * 4. OUR HSE TRAINING PROGRAMS
 * ------------------------------------------------------------------ */
const programs = block(
  "cardGrid",
  {
    title: "Build Your Safety Career With the Right Training",
    subtitle: "Take the next step toward becoming a confident and competent safety professional.",
    columns: "3",
    items: [
      { icon: "🛡️", image: "", title: "IOSH Managing Safely", text: "A practical safety management course designed for managers, supervisors, and professionals responsible for workplace safety.", href: "/qualification" },
      { icon: "🦺", image: "", title: "OSHA Safety Training", text: "Develop essential knowledge of workplace hazards, safety practices, risk control, and occupational health and safety.", href: "/qualification" },
      { icon: "➕", image: "", title: "First Aid Training", text: "Learn how to respond effectively to workplace injuries and emergency situations with essential first-aid knowledge and practical skills.", href: "/qualification" },
      { icon: "🔥", image: "", title: "Fire Safety Training", text: "Understand fire hazards, prevention measures, emergency procedures, evacuation, and effective response.", href: "/qualification" },
      { icon: "📋", image: "", title: "Risk Assessment Training", text: "Learn how to identify workplace hazards, assess risks, and implement appropriate control measures.", href: "/qualification" },
      { icon: "🎓", image: "", title: "Professional & Advanced Qualifications", text: "Explore professional development pathways designed for individuals looking to advance their career in health and safety.", href: "/professional-dev" },
    ],
  },
  { paddingY: "64" }
);

/* ------------------------------------------------------------------ *
 * 5. CAREER SECTION
 * ------------------------------------------------------------------ */
const career = block(
  "cta",
  {
    title: "Start Your Journey Toward a Career in HSE",
    text:
      "The demand for qualified safety professionals continues to grow across construction, manufacturing, oil & gas, engineering, logistics, and other industries. Whether you're a student, fresh graduate, working professional, supervisor, manager, or experienced HSE practitioner, the right training can help you move forward. Learn the Skills. Earn the Qualification. Build Your Career.",
    button: { label: "View Training Programs", href: "/qualification" },
    bgColor: NAVY,
    textColor: "#ffffff",
  }
);

/* ------------------------------------------------------------------ *
 * 6 + 7. CORPORATE TRAINING  &  SAFETY CONSULTANCY (side by side)
 * ------------------------------------------------------------------ */
const li = (items) =>
  `<ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;

const corporateAndConsultancy = block(
  "columns",
  {
    columns: [
      {
        html:
          `<p style="color:${ORANGE};font-weight:700;letter-spacing:.08em;font-size:.75rem;">CORPORATE TRAINING</p>` +
          "<h3>Safer Employees. Safer Operations. Stronger Businesses.</h3>" +
          "<p>Your workforce is your most valuable asset. Ababeel Safety provides organizations with practical HSE training solutions designed around their workplace, workforce, and operational requirements.</p>" +
          "<p><strong>Our corporate training can help your organization:</strong></p>" +
          li([
            "Improve employee safety awareness",
            "Identify and control workplace hazards",
            "Reduce workplace incidents",
            "Strengthen safety culture",
            "Improve emergency preparedness",
            "Develop competent safety personnel",
            "Support workplace compliance",
          ]) +
          `<p><a href="/contact-us">Request Corporate Training →</a></p>`,
      },
      {
        html:
          `<p style="color:${ORANGE};font-weight:700;letter-spacing:.08em;font-size:.75rem;">SAFETY CONSULTANCY</p>` +
          "<h3>From Compliance to a Stronger Safety Culture</h3>" +
          "<p>Training is only one part of workplace safety. Our safety consultancy services help organizations identify risks, improve safety procedures, and develop practical systems for safer operations.</p>" +
          "<p><strong>Our consultancy solutions include:</strong></p>" +
          li([
            "HSE Policy &amp; Procedure Development",
            "Workplace Safety Inspections",
            "Risk Assessment &amp; Hazard Identification",
            "Safety Audits",
            "Emergency Preparedness",
            "Fire Safety Assessment",
            "Safety Documentation",
            "HSE Management Support",
            "Workplace Safety Training",
          ]) +
          `<p><a href="/contact-us">Explore Consultancy Services →</a></p>`,
      },
    ],
  },
  { bgColor: LIGHT, paddingY: "64" }
);

/* ------------------------------------------------------------------ *
 * 8. PRACTICAL SAFETY
 * ------------------------------------------------------------------ */
const practicalHeading = block(
  "heading",
  { text: "Don't Just Learn Safety. Know How to Apply It.", subtitle: "", level: "2", align: "center" },
  { bgColor: NAVY_DEEP, textColor: "#ffffff", paddingTop: "64", paddingBottom: "0" }
);

const practicalBody = block(
  "richText",
  {
    html:
      "<p>A certificate may demonstrate that you completed a course. Competence demonstrates that you know what to do when it matters.</p>" +
      "<p>That's why our training focuses on practical understanding, real-world scenarios, hazard identification, risk control, and workplace application.</p>" +
      "<p><em>Because in safety, knowledge only matters when it can be put into action.</em></p>",
    maxWidth: "prose",
    align: "center",
  },
  { bgColor: NAVY_DEEP, textColor: "#ffffff", paddingBottom: "64" }
);

/* ------------------------------------------------------------------ *
 * 9. INDUSTRIES WE SERVE
 * ------------------------------------------------------------------ */
const industries = block(
  "cardGrid",
  {
    title: "Safety Solutions Across Industries",
    subtitle: "Our training and consultancy solutions can support organizations and professionals across a wide range of sectors.",
    columns: "3",
    items: [
      { icon: "🏗️", image: "", title: "Construction", text: "Building safer construction sites and developing competent site personnel.", href: "" },
      { icon: "⛽", image: "", title: "Oil & Gas", text: "Strengthening safety awareness and risk management in high-risk environments.", href: "" },
      { icon: "🏭", image: "", title: "Manufacturing", text: "Reducing workplace hazards and improving operational safety.", href: "" },
      { icon: "⚙️", image: "", title: "Engineering", text: "Supporting safer engineering operations and workplace practices.", href: "" },
      { icon: "🚚", image: "", title: "Logistics & Warehousing", text: "Improving workplace safety, hazard awareness, and emergency preparedness.", href: "" },
      { icon: "🏢", image: "", title: "Facilities & Services", text: "Developing safer workplaces through effective safety systems and training.", href: "" },
    ],
  },
  { paddingY: "64" }
);

/* ------------------------------------------------------------------ *
 * 10. TESTIMONIALS
 * ------------------------------------------------------------------ */
const testimonials = block(
  "testimonials",
  {
    title: "What Our Learners Say",
    layout: "grid",
    items: [
      {
        quote: "The training was practical, professional, and easy to understand. The instructor explained everything with real workplace examples.",
        name: "HSE Training Participant",
        role: "",
        avatar: "",
        rating: "5",
      },
      {
        quote: "A very professional learning experience. The training helped me understand safety concepts that I can actually apply at work.",
        name: "Safety Professional",
        role: "",
        avatar: "",
        rating: "5",
      },
    ],
  },
  { bgColor: LIGHT, paddingY: "64" }
);

/* ------------------------------------------------------------------ *
 * 11. TRUST BAR
 * ------------------------------------------------------------------ */
const trustBar = block(
  "cardGrid",
  {
    title: "Committed to Building a Safer Future",
    subtitle: "",
    columns: "4",
    items: [
      { icon: "🎯", image: "", title: "Professional Training", text: "Practical & career-focused learning.", href: "" },
      { icon: "👨‍🏫", image: "", title: "Experienced Trainers", text: "Industry knowledge & expertise.", href: "" },
      { icon: "🏢", image: "", title: "Individual & Corporate Training", text: "Solutions for professionals & organizations.", href: "" },
      { icon: "🛠️", image: "", title: "HSE Consultancy", text: "Practical workplace safety support.", href: "" },
    ],
  },
  { paddingY: "56" }
);

/* ------------------------------------------------------------------ *
 * 12. FAQ
 * ------------------------------------------------------------------ */
const faq = block(
  "faq",
  {
    title: "Frequently Asked Questions",
    items: [
      { q: "Who can enroll in Ababeel Safety courses?", a: "Our programs are suitable for students, graduates, working professionals, supervisors, managers, and individuals looking to build or advance their HSE careers." },
      { q: "Do you provide corporate safety training?", a: "Yes. We provide customized HSE training solutions for organizations and teams based on their workplace requirements." },
      { q: "Are your courses suitable for beginners?", a: "Yes. We offer training options for individuals starting their safety careers as well as professionals looking to enhance their existing knowledge." },
      { q: "Do you provide HSE consultancy services?", a: "Yes. Our consultancy services cover areas such as risk assessment, safety audits, workplace inspections, HSE documentation, fire safety, and safety management support." },
      { q: "How can I enroll in a course?", a: "Contact our team to discuss your preferred course, upcoming batches, fees, and enrollment process." },
    ],
  },
  { bgColor: LIGHT, paddingY: "64" }
);

/* ------------------------------------------------------------------ *
 * 13. FINAL CTA
 * ------------------------------------------------------------------ */
const finalCta = block("cta", {
  title: "Ready to Take the Next Step in Safety?",
  text:
    "Whether you're looking to start your HSE career, upgrade your professional skills, or make your workplace safer, Ababeel Safety is here to help. Learn Today. Work Safer Tomorrow.",
  button: { label: "Explore Courses", href: "/qualification" },
  bgColor: ORANGE,
  textColor: "#ffffff",
});

const blocks = [
  hero,
  heroStrip,
  introHeading,
  introBody,
  whyChoose,
  programs,
  career,
  corporateAndConsultancy,
  practicalHeading,
  practicalBody,
  industries,
  testimonials,
  trustBar,
  faq,
  finalCta,
];

/* ------------------------------------------------------------------ *
 * run
 * ------------------------------------------------------------------ */
async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const site = client.db().collection("sitecontents");

  const existing = await site.findOne({ key: pageKey });

  console.log(`Page:      ${pageKey}`);
  console.log(`Sections:  ${blocks.length} blocks from the content document`);
  console.log(`Currently: ${existing ? `${(existing.blocks || []).length} block(s), ${existing.enabled ? "published" : "draft"}` : "no document yet"}`);

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
        customCss: "",
        enabled: true,
        updatedByEmail: "seed-script",
        updatedAt: new Date(),
      },
      $setOnInsert: { key: pageKey, isCustom: false, createdAt: new Date() },
    },
    { upsert: true }
  );

  console.log("\nDone — the homepage is published and fully editable in Owner → Website CMS.");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
