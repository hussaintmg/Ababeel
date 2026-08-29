/**
 * The Ababeel VPS migration.
 *
 *   npm run migrate:ababeel -- --dry-run   # show what would change
 *   npm run migrate:ababeel                # write it, pages and home LIVE
 *   npm run migrate:ababeel -- --draft     # …seed everything switched off instead
 *
 * Six things, in order:
 *
 *   1. Registration form fields   (additive — existing fields untouched)
 *   2. Course levels              (additive — existing levels untouched)
 *   3. Navigation and footer      (replaced, backed up first)
 *   4. Training CMS pages         (written LIVE with real sections; owner edits win)
 *   5. The "Why Ababeel" page     (a custom CMS page, created if missing)
 *   6. Home page                  (replaced LIVE, backed up first; --draft leaves it off)
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
  trainingPageDocs,
  whyAbabeelDoc,
} from "./lib/seed-data.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const draft = args.has("--draft");
// Kept for compatibility; publishing is now the default. --draft turns it off.
const publishHome = !draft || args.has("--publish-home");
const force = args.has("--force");
const dbOverride = (process.argv.find((a) => a.startsWith("--db=")) || "").slice(5);

/** Copy a document into `cmsbackups` before replacing it. */
async function backup(db, label, document) {
  if (!document) return "(nothing to back up)";
  if (dryRun) return "(dry run — not taken)";
  const { insertedId } = await db.collection("cmsbackups").insertOne({
    label,
    takenAt: new Date(),
    takenBy: "ababeel-migrate",
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

  // Only the two keys this owns are replaced. Brand, contact details and
  // every colour the owner chose are left exactly as they are.
  const settings = { ...(current?.settings || {}) };
  settings.topbar = { ...(settings.topbar || {}), navLinks: NAV_LINKS };
  settings.footer = { ...(settings.footer || {}), columns: FOOTER_COLUMNS };

  // Logos: repair only the values that still point at the leftover pre-Ababeel
  // template assets. A logo the owner uploaded or typed themselves is a
  // different value and is never touched.
  const LEGACY_LOGOS = {
    topbar: [["/logo.png", "/ababeel-logo.svg"]],
    footer: [["/logo-2.png", "/ababeel-logo-light.svg"]],
    favicon: [["/favicon.ico", "/ababeel-icon.svg"], ["/favicon-default.ico", "/ababeel-icon.svg"]],
  };
  const logos = { ...(settings.logos || {}) };
  for (const [slot, swaps] of Object.entries(LEGACY_LOGOS)) {
    for (const [from, to] of swaps) {
      if (!logos[slot] || logos[slot] === from) logos[slot] = to;
    }
  }
  settings.logos = logos;

  await sitecontents.updateOne(
    { key: "global" },
    {
      $set: { settings, updatedAt: new Date(), updatedByEmail: "ababeel-migrate" },
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

/**
 * True when a CMS document has never been touched by a person.
 *
 * The owner editor stamps `updatedByEmail` with the editing owner's address;
 * the seeds stamp their own names; the auto-seed on first public read leaves
 * it empty. So a doc is safe to overwrite exactly when that field is empty or
 * one of ours — a single owner edit makes it theirs, permanently.
 */
const SEED_AUTHORS = new Set(["", "ababeel-migrate", "seed-cms-bootstrap", "api/setup/bootstrap"]);
function untouched(doc) {
  return !doc || SEED_AUTHORS.has(String(doc.updatedByEmail || ""));
}

async function seedTrainingPages(db) {
  const sitecontents = db.collection("sitecontents");
  const pages = [...trainingPageDocs()];
  const why = whyAbabeelDoc();

  console.log("\nTraining CMS pages");
  for (const page of pages) {
    const existing = await sitecontents.findOne({ key: page.key });
    if (!untouched(existing)) {
      console.log(`  ${page.key.padEnd(18)} kept — edited by ${existing.updatedByEmail}`);
      continue;
    }
    if (dryRun) {
      console.log(`  ${page.key.padEnd(18)} would write ${page.blocks.length} section(s), ${publishHome ? "LIVE" : "disabled (--draft)"}`);
      continue;
    }
    await sitecontents.updateOne(
      { key: page.key },
      {
        $set: {
          title: page.title,
          blocks: page.blocks,
          // Live by default so the designed sections actually show; --draft
          // seeds them switched off for review first. Only untouched or
          // seed-authored docs ever reach this write.
          enabled: publishHome,
          updatedAt: new Date(),
          updatedByEmail: "ababeel-migrate",
        },
        $setOnInsert: {
          key: page.key,
          settings: {},
          customCss: "",
          publicHidden: false,
          isCustom: false,
          route: page.route,
          navLabel: "",
          showInNav: false,
          dataSources: [],
          dynamicRoute: null,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(`  ${page.key.padEnd(18)} wrote ${page.blocks.length} section(s), ${publishHome ? "LIVE" : "disabled (--draft)"}`);
  }

  // Why Ababeel is a custom page with no built-in route behind it, so it
  // ships enabled — otherwise it would be a link to a 404.
  const existingWhy = await sitecontents.findOne({ key: why.key });
  if (!untouched(existingWhy)) {
    console.log(`  ${why.key.padEnd(18)} kept — edited by ${existingWhy.updatedByEmail}`);
  } else if (dryRun) {
    console.log(`  ${why.key.padEnd(18)} would write ${why.blocks.length} section(s), enabled (custom page)`);
  } else {
    await sitecontents.updateOne(
      { key: why.key },
      {
        $set: {
          title: why.title,
          blocks: why.blocks,
          enabled: true,
          updatedAt: new Date(),
          updatedByEmail: "ababeel-migrate",
        },
        $setOnInsert: {
          key: why.key,
          settings: {},
          customCss: "",
          publicHidden: false,
          isCustom: true,
          route: why.route,
          navLabel: why.title,
          showInNav: false,
          dataSources: [],
          dynamicRoute: null,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(`  ${why.key.padEnd(18)} wrote ${why.blocks.length} section(s), enabled (custom page)`);
  }
}

async function seedHomePage(db) {
  const sitecontents = db.collection("sitecontents");
  const current = await sitecontents.findOne({ key: "home" });
  const blocks = homePageBlocks();

  console.log("\nHome page");
  console.log(`  current: ${current ? `${current.blocks?.length || 0} block(s), ${current.enabled ? "LIVE" : "not live"}` : "not created yet"}`);
  console.log(`  writing: ${blocks.length} block(s) — ${blocks.map((b) => b.type).join(", ")}`);
  console.log(`  enabled: ${publishHome ? "YES — live immediately (use --draft to seed switched off)" : "no (--draft) — review it in the CMS, then enable it there"}`);

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
        updatedByEmail: "ababeel-migrate",
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
    script: "the Ababeel migration",
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
    await seedTrainingPages(db);
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
