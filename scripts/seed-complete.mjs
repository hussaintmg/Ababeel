/**
 * Complete seed script for Ababeel Training & Qualifications.
 * Seeds:
 *  - Awarding Bodies (ProQual, Focus Awards, Qualifi, Highfield, OTHM)
 *  - Course Levels (Level 2 to Level 7)
 *  - Rich Default Courses (Health & Safety, Strategic Management, First Aid, etc.)
 *  - Public Course References & Sessions (showInSchedule: true)
 *  - CMS Registration Form Fields
 *  - Default Training Settings & Bank Details
 *
 * Usage:
 *   node scripts/seed-complete.mjs
 */
import { connectSeed } from "./lib/connect.mjs";
import { ObjectId } from "mongodb";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "").slice(5);

const AWARDING_BODIES = [
  {
    name: "ProQual Awarding Body",
    slug: "proqual",
    description: "UK regulated awarding organisation recognised by Ofqual for vocational and NVQ qualifications.",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    status: "published",
    displayOrder: 1,
  },
  {
    name: "Focus Awards",
    slug: "focus-awards",
    description: "Ofqual regulated awarding organisation providing high quality qualifications across diverse industry sectors.",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    status: "published",
    displayOrder: 2,
  },
  {
    name: "Qualifi",
    slug: "qualifi",
    description: "UK recognised awarding organisation specialising in undergraduate and postgraduate diploma pathways.",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    status: "published",
    displayOrder: 3,
  },
  {
    name: "Highfield Qualifications",
    slug: "highfield",
    description: "Global leader in compliance, work-based learning and apprenticeship qualifications.",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    status: "published",
    displayOrder: 4,
  },
  {
    name: "OTHM Qualifications",
    slug: "othm",
    description: "UK Ofqual regulated awarding body providing management and professional development certificates.",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    status: "published",
    displayOrder: 5,
  },
];

const LEVELS = [
  { name: "Level 2", slug: "level-2", description: "Entry & Foundation Level Qualifications (GCSE Grade A*-C equivalent).", icon: "🌱", color: "#0ea5e9", displayOrder: 1 },
  { name: "Level 3", slug: "level-3", description: "Intermediate / A-Level Equivalent Professional Certificates.", icon: "📘", color: "#6366f1", displayOrder: 2 },
  { name: "Level 4", slug: "level-4", description: "Higher Certificate / First Year Degree Equivalent Qualifications.", icon: "🎯", color: "#f26722", displayOrder: 3 },
  { name: "Level 5", slug: "level-5", description: "Higher Diploma / Foundation Degree Equivalent Qualifications.", icon: "💎", color: "#8b5cf6", displayOrder: 4 },
  { name: "Level 6", slug: "level-6", description: "Bachelor's Degree Equivalent NVQ & Professional Diplomas.", icon: "🏅", color: "#0f766e", displayOrder: 5 },
  { name: "Level 7", slug: "level-7", description: "Postgraduate & Master's Degree Equivalent Diplomas.", icon: "👑", color: "#b45309", displayOrder: 6 },
];

const FIELDS = [
  { key: "firstName", label: "First Name", type: "text", placeholder: "e.g. John", required: true, width: "half", bindTo: "firstName", system: true, maxLength: 100 },
  { key: "lastName", label: "Last Name", type: "text", placeholder: "e.g. Smith", required: true, width: "half", bindTo: "lastName", system: true, maxLength: 100 },
  { key: "email", label: "Email Address", type: "email", placeholder: "john.smith@example.com", required: true, width: "half", bindTo: "email", system: true, maxLength: 200 },
  { key: "phone", label: "Phone Number", type: "phone", placeholder: "+44 7123 456789", required: true, width: "half", bindTo: "phone", system: true, maxLength: 40 },
  { key: "company", label: "Company / Organisation", type: "text", placeholder: "Organisation Name", required: false, width: "half", bindTo: "company", maxLength: 200 },
  { key: "jobTitle", label: "Job Title", type: "text", placeholder: "e.g. Health & Safety Officer", required: false, width: "half", maxLength: 200 },
  { key: "country", label: "Country", type: "country", required: true, width: "half", bindTo: "country", maxLength: 100 },
  { key: "city", label: "City", type: "text", required: false, width: "half", maxLength: 100 },
  { key: "address", label: "Postal Address", type: "textarea", placeholder: "Full Street Address", required: false, width: "full", maxLength: 500 },
  {
    key: "additionalInformation",
    label: "Additional Information & Notes",
    type: "textarea",
    placeholder: "Any special requirements or dietary/accessibility needs?",
    helpText: "Prior qualifications, company billing reference, or questions…",
    required: false,
    width: "full",
    maxLength: 2000,
  },
];

async function main() {
  const { client, db, name } = await connectSeed({
    uri: "",
    db: dbOverride,
    force,
    script: "Ababeel Complete Seeder",
  });

  try {
    console.log(`\nStarting Ababeel seed on database: ${name}`);

    // 1. Seed Awarding Bodies
    const bodyMap = {};
    for (let i = 0; i < AWARDING_BODIES.length; i++) {
      const b = AWARDING_BODIES[i];
      let doc = await db.collection("awardingbodies").findOne({ slug: b.slug });
      if (!doc) {
        const res = await db.collection("awardingbodies").insertOne({
          ...b,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        bodyMap[b.slug] = res.insertedId;
        console.log(`+ Awarding Body inserted: ${b.name}`);
      } else {
        bodyMap[b.slug] = doc._id;
        console.log(`✓ Awarding Body exists: ${b.name}`);
      }
    }

    // 2. Seed Levels
    const levelMap = {};
    for (let i = 0; i < LEVELS.length; i++) {
      const l = LEVELS[i];
      let doc = await db.collection("courselevels").findOne({ slug: l.slug });
      if (!doc) {
        const res = await db.collection("courselevels").insertOne({
          ...l,
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        levelMap[l.slug] = res.insertedId;
        console.log(`+ Level inserted: ${l.name}`);
      } else {
        levelMap[l.slug] = doc._id;
        console.log(`✓ Level exists: ${l.name}`);
      }
    }

    // 3. Seed Registration Fields
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      let doc = await db.collection("registrationfields").findOne({ key: f.key });
      if (!doc) {
        await db.collection("registrationfields").insertOne({
          ...f,
          enabled: true,
          displayOrder: i,
          options: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`+ Registration field inserted: ${f.label}`);
      }
    }

    // 4. Seed Rich Default Courses
    const sampleCourses = [
      {
        name: "NVQ Level 6 Diploma in Occupational Health and Safety Practice",
        slug: "nvq-level-6-diploma-occupational-health-safety-practice",
        code: "PROQUAL-NVQ6-OHSP",
        price: 1450,
        currency: "GBP",
        currencySymbol: "£",
        currencyCode: "GBP",
        country: "United Kingdom",
        level: levelMap["level-6"],
        awardingBody: bodyMap["proqual"],
        category: "Health & Safety",
        duration: "6 - 9 Months (Distance / Portfolio)",
        durationDays: 180,
        shortDescription: "The premier vocational qualification for health and safety practitioners aiming for GradIOSH and CMIOSH chartered status.",
        description: "<p>The ProQual Level 6 NVQ Diploma in Occupational Health and Safety Practice is a competence-based qualification designed for professionals responsible for developing and implementing health and safety policies and procedures in their workplace.</p><p>This course is 100% portfolio-based with no formal written examinations, allowing you to demonstrate your real-world competence while continuing your day-to-day employment.</p>",
        learningOutcomes: "<ul><li>Promote a positive health and safety culture in the workplace</li><li>Develop and implement proactive health and safety policy systems</li><li>Conduct comprehensive risk assessments and incident investigations</li><li>Design continuous monitoring and compliance review mechanisms</li></ul>",
        courseContent: "<h3>Core Mandatory Units:</h3><ol><li>Promote a positive health and safety culture</li><li>Develop and implement the health and safety policy</li><li>Develop and implement effective communication systems for health and safety information</li><li>Identify, assess and control health and safety risks</li><li>Develop and implement reactive monitoring systems</li><li>Develop and implement proactive monitoring systems</li><li>Review health and safety procedures</li></ol>",
        requirements: "<p>Candidates must be currently employed in a role where they have responsibility for health and safety management and can generate authentic work-based evidence.</p>",
        whoShouldAttend: "<p>Health and Safety Advisors, Officers, Managers, and Directors seeking to attain Graduate Membership (GradIOSH) and Chartered Status (CMIOSH).</p>",
        certificationInfo: "Accredited by ProQual and fully regulated by Ofqual. Direct pathway to IOSH Chartered Membership.",
        featured: true,
        displayOrder: 1,
        status: "active",
        faqs: [
          { question: "Is there an exam for this qualification?", answer: "No, this is an NVQ competence-based qualification evaluated through a portfolio of workplace evidence." },
          { question: "Can I achieve GradIOSH with this diploma?", answer: "Yes, the ProQual Level 6 NVQ Diploma is fully accredited by IOSH for Graduate Membership (GradIOSH)." },
        ],
      },
      {
        name: "Level 7 Diploma in Strategic Management and Leadership",
        slug: "level-7-diploma-strategic-management-leadership",
        code: "QUALIFI-L7-SML",
        price: 1850,
        currency: "GBP",
        currencySymbol: "£",
        currencyCode: "GBP",
        country: "United Kingdom",
        level: levelMap["level-7"],
        awardingBody: bodyMap["qualifi"],
        category: "Management & Leadership",
        duration: "6 - 12 Months",
        durationDays: 240,
        shortDescription: "Postgraduate Level 7 diploma designed for senior managers and executives, providing advanced entry to UK MBA Top-Up degrees.",
        description: "<p>The Qualifi Level 7 Diploma in Strategic Management and Leadership provides the strategic skills, executive tools, and critical thinking necessary to lead organisations at director level.</p>",
        learningOutcomes: "<ul><li>Formulate and execute corporate strategic plans</li><li>Lead strategic organizational change and corporate culture</li><li>Manage financial principles and strategic corporate governance</li></ul>",
        courseContent: "<ol><li>Strategic Management</li><li>Strategic Leadership</li><li>Strategic Human Resource Management</li><li>Advanced Business Research Methods</li><li>Strategic Financial Management</li><li>Supply Chain and Operations Management</li></ol>",
        requirements: "<p>A Bachelor's degree in any discipline OR a minimum of 3 years managerial work experience.</p>",
        whoShouldAttend: "<p>Senior executives, directors, department heads, and managers aiming for MBA completion.</p>",
        certificationInfo: "Regulated by Ofqual, awarded by Qualifi UK with 120 postgraduate credits.",
        featured: true,
        displayOrder: 2,
        status: "active",
        faqs: [
          { question: "Can I top up this qualification to a full UK MBA?", answer: "Yes! Holders of this 120-credit Level 7 Diploma are eligible for direct progression to MBA Top-Up dissertation stage with UK universities." },
        ],
      },
      {
        name: "Level 3 Award in Emergency First Aid at Work (RQF)",
        slug: "level-3-award-emergency-first-aid-at-work",
        code: "HIGHFIELD-L3-EFAW",
        price: 175,
        currency: "GBP",
        currencySymbol: "£",
        currencyCode: "GBP",
        country: "United Kingdom",
        level: levelMap["level-3"],
        awardingBody: bodyMap["highfield"],
        category: "Health & Safety",
        duration: "1 Day (6 Hours)",
        durationDays: 1,
        shortDescription: "HSE compliant one-day first aid qualification for appointed workplace first aiders.",
        description: "<p>This regulated qualification is designed for individuals who wish to act as an emergency first aider in their workplace in accordance with the Health and Safety (First Aid) Regulations 1981.</p>",
        learningOutcomes: "<ul><li>Understand the role and responsibilities of a first aider</li><li>Assess an incident and manage unresponsive casualties</li><li>Administer CPR and use an Automated External Defibrillator (AED)</li><li>Provide first aid to a casualty who is choking, bleeding or in shock</li></ul>",
        courseContent: "<ol><li>Roles and responsibilities of the first aider</li><li>Primary survey and scene safety</li><li>Cardiopulmonary Resuscitation (CPR) & AED usage</li><li>Unresponsive casualty management & recovery position</li><li>Choking management</li><li>Wounds and catastrophic bleeding control</li><li>Minor injuries, shock, and burns</li></ol>",
        requirements: "<p>No prior first aid experience required. Minimum age 16.</p>",
        whoShouldAttend: "<p>Designated workplace first aiders, safety marshals, team leaders, and staff across all industries.</p>",
        certificationInfo: "Highfield Qualifications certificate valid for 3 years across the UK.",
        featured: false,
        displayOrder: 3,
        status: "active",
        faqs: [
          { question: "How long is this certificate valid?", answer: "The certificate is valid for 3 years from the date of assessment." },
        ],
      },
    ];

    const courseIds = [];
    for (const c of sampleCourses) {
      let doc = await db.collection("defaultcourses").findOne({ slug: c.slug });
      if (!doc) {
        const res = await db.collection("defaultcourses").insertOne({
          ...c,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        courseIds.push({ id: res.insertedId, name: c.name, code: c.code, price: c.price });
        console.log(`+ Default Course inserted: ${c.name}`);
      } else {
        courseIds.push({ id: doc._id, name: doc.name, code: doc.code, price: doc.price });
        console.log(`✓ Default Course exists: ${c.name}`);
      }
    }

    // 5. Seed Public Course References / Sessions (showInSchedule: true)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    const inTwoMonths = new Date(today.getFullYear(), today.getMonth() + 2, 10);
    const inThreeMonths = new Date(today.getFullYear(), today.getMonth() + 3, 5);

    const sampleReferences = [
      {
        course: courseIds[0]?.id,
        courseId: String(courseIds[0]?.id),
        courseName: courseIds[0]?.name,
        coursePrice: courseIds[0]?.price,
        referenceName: "NVQ Level 6 - Upcoming Intake (Online / Distance)",
        referenceCode: "NVQ6-INTAKE-1",
        referenceNumber: "600101",
        startDate: nextMonth,
        endDate: new Date(nextMonth.getTime() + 180 * 24 * 3600 * 1000),
        mode: "online",
        modeLabel: "100% Online Distance Learning",
        location: "Online / UK Wide",
        duration: "6 Months",
        seats: 25,
        candidatesCount: 3,
        showInSchedule: true,
        status: "active",
      },
      {
        course: courseIds[1]?.id,
        courseId: String(courseIds[1]?.id),
        courseName: courseIds[1]?.name,
        coursePrice: courseIds[1]?.price,
        referenceName: "Level 7 Strategic Leadership - Weekend Intake",
        referenceCode: "L7-LEAD-INTAKE-2",
        referenceNumber: "600102",
        startDate: inTwoMonths,
        endDate: new Date(inTwoMonths.getTime() + 240 * 24 * 3600 * 1000),
        mode: "blended",
        modeLabel: "Interactive Webinars & Portal",
        location: "London Campus & Live Zoom",
        duration: "8 Months",
        seats: 20,
        candidatesCount: 5,
        showInSchedule: true,
        status: "active",
      },
      {
        course: courseIds[2]?.id,
        courseId: String(courseIds[2]?.id),
        courseName: courseIds[2]?.name,
        coursePrice: courseIds[2]?.price,
        referenceName: "Emergency First Aid at Work - London Classroom Session",
        referenceCode: "EFAW-LON-DAY1",
        referenceNumber: "600103",
        startDate: inThreeMonths,
        endDate: inThreeMonths,
        mode: "classroom",
        modeLabel: "In-Person Practical Workshop",
        location: "Ababeel London Training Centre",
        duration: "1 Day (9:00am - 5:00pm)",
        seats: 12,
        candidatesCount: 2,
        showInSchedule: true,
        status: "active",
      },
    ];

    for (const ref of sampleReferences) {
      if (!ref.course) continue;
      let existing = await db.collection("coursereferences").findOne({ referenceNumber: ref.referenceNumber });
      if (!existing) {
        await db.collection("coursereferences").insertOne({
          ...ref,
          currency: "GBP",
          currencySymbol: "£",
          country: "United Kingdom",
          candidates: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`+ Course Reference created: ${ref.referenceName}`);
      } else {
        console.log(`✓ Course Reference exists: ${ref.referenceName}`);
      }
    }

    console.log("\n✅ All Ababeel core data, courses, awarding bodies, levels, references, and form fields seeded successfully!");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
