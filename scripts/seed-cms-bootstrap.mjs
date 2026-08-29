/**
 * Sets up the whole training platform in one command.
 *
 *   node scripts/seed-cms-bootstrap.mjs --dry-run       # show what would change
 *   node scripts/seed-cms-bootstrap.mjs                 # write it
 *   node scripts/seed-cms-bootstrap.mjs --publish-home  # …and publish the home page
 *
 * Four things, in order:
 *
 *   1. Registration form fields   (additive — existing fields untouched)
 *   2. Course levels              (additive — existing levels untouched)
 *   3. Navigation and footer      (replaced, backed up first)
 *   4. Home page                  (replaced, backed up first, left OFF by default)
 *
 * WHAT IT WILL NOT DO
 * -------------------
 * It never deletes, never drops a collection, and never creates courses,
 * awarding bodies, consultants or testimonials. Those are claims about a real
 * safety-training business and they are yours to write — a script inventing
 * them is how invented claims end up on a live site.
 *
 * SAFETY
 * ------
 * Anything it replaces is copied into the `cmsbackups` collection first, and
 * the backup id is printed. `--dry-run` writes nothing. Running it twice
 * changes nothing the second time except re-writing the nav and home blocks to
 * the same values.
 *
 * Most of this is only needed once. Note that the navigation already ships as
 * a code default — this step only matters if someone has previously saved a
 * custom navigation in the CMS, because a saved value wins over the default.
 */
import { connectSeed } from "./lib/connect.mjs";
import {
  REGISTRATION_FIELDS,
  registrationFieldDoc,
  LEVELS,
  levelDoc,
  NAV_LINKS,
  FOOTER_COLUMNS,
  homePageBlocks,
} from "./lib/seed-data.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const publishHome = args.has("--publish-home");
const force = args.has("--force");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "").slice(5);

/** Copy a document into `cmsbackups` before replacing it. */
async function backup(db, label, document) {
  if (!document) return "(nothing to back up)";
  if (dryRun) return "(dry run — not taken)";
  const { insertedId } = await db.collection("cmsbackups").insertOne({
    label,
    takenAt: new Date(),
    takenBy: "seed-cms-bootstrap",
    document,
  });
  return String(insertedId);
}

/** Insert only the documents whose key is not already present. */
async function seedMissing(db, collection, docs, keyName, label) {
  const existing = await db
    .collection(collection)
    .find({}, { projection: { [keyName]: 1 } })
    .toArray();
  const have = new Set(existing.map((d) => String(d[keyName])));
  const missing = docs.filter((d) => !have.has(String(d[keyName])));

  console.log(`\n${label}`);
  console.log(`  already present: ${have.size}`);
  console.log(
    `  to insert:       ${missing.length}` +
      (missing.length ? ` (${missing.map((d) => d[keyName]).join(", ")})` : ""),
  );

  if (!missing.length || dryRun) return 0;
  const { insertedCount } = await db.collection(collection).insertMany(missing);
  return insertedCount;
}

async function seedNavigation(db) {
  const sitecontents = db.collection("sitecontents");
  const current = await sitecontents.findOne({ key: "global" });

  console.log("\nNavigation and footer");
  console.log(`  current nav links:   ${current?.settings?.topbar?.navLinks?.length ?? 0}`);
  console.log(`  will write:          ${NAV_LINKS.length} nav link(s), ${FOOTER_COLUMNS.length} footer column(s)`);

  const backupId = await backup(db, "global-settings", current);
  console.log(`  backup:              ${backupId}`);
  if (dryRun) return;

  // Only the two keys this owns are replaced. Brand, logos, contact details
  // and every colour the owner chose are left exactly as they are.
  const settings = { ...(current?.settings || {}) };
  settings.topbar = { ...(settings.topbar || {}), navLinks: NAV_LINKS };
  settings.footer = { ...(settings.footer || {}), columns: FOOTER_COLUMNS };

  await sitecontents.updateOne(
    { key: "global" },
    {
      $set: { settings, updatedAt: new Date(), updatedByEmail: "seed-cms-bootstrap" },
      $setOnInsert: {
        key: "global", title: "Global Site Settings", blocks: [], enabled: true,
        customCss: "", publicHidden: false, isCustom: false, route: "/",
        navLabel: "", showInNav: false, dataSources: [], dynamicRoute: null,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function seedHomePage(db) {
  const sitecontents = db.collection("sitecontents");
  const current = await sitecontents.findOne({ key: "home" });
  const blocks = homePageBlocks();

  console.log("\nHome page");
  console.log(`  current: ${current ? `${current.blocks?.length || 0} block(s), ${current.enabled ? "LIVE" : "not live"}` : "not created yet"}`);
  console.log(`  writing: ${blocks.length} block(s) — ${blocks.map((b) => b.type).join(", ")}`);
  console.log(`  enabled: ${publishHome ? "YES (--publish-home)" : "no — review it in the CMS, then enable it there"}`);

  const backupId = await backup(db, "home-page", current);
  console.log(`  backup:  ${backupId}`);
  if (dryRun) return;

  await sitecontents.updateOne(
    { key: "home" },
    {
      $set: {
        title: "Home Page",
        blocks,
        enabled: !!publishHome,
        updatedAt: new Date(),
        updatedByEmail: "seed-cms-bootstrap",
      },
      $setOnInsert: {
        key: "home", settings: {}, customCss: "", publicHidden: false,
        isCustom: false, route: "/", navLabel: "", showInNav: false,
        dataSources: [], dynamicRoute: null, createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function main() {
  const { client, db, name } = await connectSeed({
    uri: "",
    db: dbOverride,
    force,
    script: "the CMS bootstrap",
  });

  try {
    if (dryRun) console.log("\n--dry-run: nothing will be written.");

    const fields = await seedMissing(
      db,
      "registrationfields",
      REGISTRATION_FIELDS.map(registrationFieldDoc),
      "key",
      "Registration form fields",
    );
    const levels = await seedMissing(
      db,
      "courselevels",
      LEVELS.map(levelDoc),
      "slug",
      "Course levels",
    );

    await seedNavigation(db);
    await seedHomePage(db);

    console.log("\n" + "─".repeat(64));
    if (dryRun) {
      console.log("Dry run complete — nothing written.");
      console.log("Run again without --dry-run to apply.");
    } else {
      console.log(`Done — written to "${name}".`);
      console.log(`  ${fields} registration field(s), ${levels} level(s) inserted.`);
      console.log("  Navigation, footer and home page written.");
      if (!publishHome) {
        console.log("\n  The home page is DISABLED, so your current one still shows.");
        console.log("  Open Website CMS → Home Page, review it, and enable it there.");
      }
      console.log("\n  Replaced documents are in the `cmsbackups` collection.");
      console.log("\nNext, in the owner dashboard: create your awarding bodies,");
      console.log("then your courses, then course references with dates.");
      console.log("The public pages fill themselves from those.");
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
