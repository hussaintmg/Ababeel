/**
 * Seeds the training platform's starting data.
 *
 *   node scripts/seed-training-platform.mjs --dry-run   # show what would change
 *   node scripts/seed-training-platform.mjs             # write it
 *
 * What it writes:
 *   • the default registration form fields
 *   • a starter set of course levels
 *
 * Both are idempotent and additive. An existing field or level is left exactly
 * as it is — the point is to give a fresh install a working form, not to undo
 * an owner's edits on a site that already has one. Nothing is ever deleted.
 *
 * Deliberately does NOT seed courses, awarding bodies, consultants or
 * testimonials: those are the client's own content, and inventing plausible
 * placeholders is how invented claims end up on a live safety-training site.
 */
import { connectSeed } from "./lib/connect.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "").slice(5);

// Mirrors lib/training/defaultFields.js. Kept as data here rather than
// imported because the seed scripts run outside Next's module resolution.
const FIELDS = [
  { key: "firstName", label: "First Name", type: "text", placeholder: "e.g. Ayesha", required: true, width: "half", bindTo: "firstName", system: true, maxLength: 100 },
  { key: "lastName", label: "Last Name", type: "text", placeholder: "e.g. Khan", required: true, width: "half", bindTo: "lastName", system: true, maxLength: 100 },
  { key: "email", label: "Email Address", type: "email", placeholder: "you@company.com", required: true, width: "half", bindTo: "email", system: true, maxLength: 200 },
  { key: "phone", label: "Phone Number", type: "phone", placeholder: "+92 300 0000000", required: true, width: "half", bindTo: "phone", system: true, maxLength: 40 },
  { key: "company", label: "Company / Organisation", type: "text", placeholder: "Where you work", required: false, width: "half", bindTo: "company", maxLength: 200 },
  { key: "jobTitle", label: "Job Title", type: "text", placeholder: "Your role", required: false, width: "half", maxLength: 200 },
  { key: "country", label: "Country", type: "country", required: true, width: "half", bindTo: "country", maxLength: 100 },
  { key: "city", label: "City", type: "text", required: false, width: "half", maxLength: 100 },
  { key: "address", label: "Address", type: "textarea", placeholder: "Street address", required: false, width: "full", maxLength: 500 },
  {
    key: "additionalInformation",
    label: "Additional Information",
    type: "textarea",
    placeholder: "Anything we should know before the session?",
    helpText: "Accessibility requirements, prior qualifications, invoicing contact…",
    required: false,
    width: "full",
    maxLength: 2000,
  },
];

const LEVELS = [
  { name: "Beginner", slug: "beginner", description: "No prior safety qualification needed.", icon: "🌱", color: "#0ea5e9" },
  { name: "Intermediate", slug: "intermediate", description: "Builds on a foundation-level qualification or equivalent experience.", icon: "📘", color: "#6366f1" },
  { name: "Advanced", slug: "advanced", description: "For practitioners already working in a safety role.", icon: "🎯", color: "#f26722" },
  { name: "Professional", slug: "professional", description: "Senior and chartered-track qualifications.", icon: "🏅", color: "#0f766e" },
];

function fieldDoc(field, index) {
  const now = new Date();
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder || "",
    helpText: field.helpText || "",
    required: !!field.required,
    enabled: true,
    width: field.width || "full",
    options: [],
    minLength: 0,
    maxLength: field.maxLength || 0,
    pattern: "",
    patternMessage: "",
    bindTo: field.bindTo || "",
    system: !!field.system,
    displayOrder: index,
    createdAt: now,
    updatedAt: now,
  };
}

function levelDoc(level, index) {
  const now = new Date();
  return {
    name: level.name,
    slug: level.slug,
    description: level.description,
    icon: level.icon,
    image: "",
    color: level.color,
    status: "published",
    displayOrder: index,
    createdAt: now,
    updatedAt: now,
  };
}

async function seedCollection(db, collection, docs, keyName, label) {
  const existing = await db
    .collection(collection)
    .find({}, { projection: { [keyName]: 1 } })
    .toArray();
  const have = new Set(existing.map((d) => String(d[keyName])));
  const missing = docs.filter((d) => !have.has(String(d[keyName])));

  console.log(`\n${label}`);
  console.log(`  already present: ${have.size}`);
  console.log(`  to insert:       ${missing.length}${missing.length ? ` (${missing.map((d) => d[keyName]).join(", ")})` : ""}`);

  if (!missing.length || dryRun) return 0;
  const result = await db.collection(collection).insertMany(missing);
  return result.insertedCount;
}

async function main() {
  const { client, db, name } = await connectSeed({
    uri: "",
    db: dbOverride,
    force,
    script: "the training platform seed",
  });

  try {
    if (dryRun) console.log("\n--dry-run: nothing will be written.");

    const fieldsInserted = await seedCollection(
      db,
      "registrationfields",
      FIELDS.map(fieldDoc),
      "key",
      "Registration form fields",
    );
    const levelsInserted = await seedCollection(
      db,
      "courselevels",
      LEVELS.map(levelDoc),
      "slug",
      "Course levels",
    );

    console.log(
      dryRun
        ? "\nDry run complete — nothing written."
        : `\nDone: ${fieldsInserted} field(s) and ${levelsInserted} level(s) inserted into "${name}".`,
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
