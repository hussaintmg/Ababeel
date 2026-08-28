/**
 * Repairs videos that were uploaded before uploads were prepared for scrolling.
 *
 *   node scripts/fix-scroll-videos.mjs --dry-run
 *   node scripts/fix-scroll-videos.mjs --apply
 *
 * A video in a Scroll Video section is seeked, not played. Almost every encoder
 * writes an MP4's index (the `moov` atom) at the end of the file, and until the
 * browser has that index it does not know the duration and cannot seek at all —
 * so the section sits on one frame however far the visitor scrolls. Uploads are
 * now fixed as they arrive; this fixes the ones already on disk.
 *
 * Every file is replaced only after the new one has been written and checked,
 * and the original is kept alongside as <name>.original until you delete it, so
 * nothing is lost if a conversion goes wrong.
 */
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const dryRun = !apply;

const ROOT = process.cwd();
const DIRS = [path.join(ROOT, "public", "uploads", "cms")];
const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".ogv"]);

async function main() {
  // Imported through a file URL so this runs under plain node, without the
  // bundler's "@/" alias.
  const mod = await import(pathToFileURL(path.join(ROOT, "lib", "cms", "videoPrepare.js")).href).catch(
    () => null
  );
  if (!mod) {
    console.error(
      "Could not load lib/cms/videoPrepare.js.\n" +
        "Run this from the project root, with dependencies installed (npm ci)."
    );
    process.exit(1);
  }
  const { prepareScrollVideo, needsFaststart, moovPosition } = mod;

  const files = [];
  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith(".original")) continue;
      if (VIDEO_EXT.has(path.extname(name).toLowerCase())) files.push(path.join(dir, name));
    }
  }

  if (!files.length) {
    console.log("No uploaded videos found under public/uploads/cms.");
    return;
  }

  console.log(`Found ${files.length} video file(s).${dryRun ? "  (--dry-run: nothing will be written)" : ""}\n`);

  let repaired = 0;
  let alreadyFine = 0;

  for (const file of files) {
    const buffer = fs.readFileSync(file);
    const pos = moovPosition(buffer);
    const late = needsFaststart(buffer);
    const label = path.basename(file);
    const sizeMb = (buffer.length / 1024 / 1024).toFixed(1);

    if (pos === null) {
      // WebM and friends have no moov atom; nothing to check here.
      console.log(`  ${label}  (${sizeMb} MB)  not an MP4 — skipped`);
      alreadyFine += 1;
      continue;
    }

    const where = `${(pos * 100).toFixed(0)}% into the file`;
    if (!late) {
      console.log(`  ${label}  (${sizeMb} MB)  index already at the front (${where}) — nothing to do`);
      alreadyFine += 1;
      continue;
    }

    console.log(`  ${label}  (${sizeMb} MB)  index at ${where} — a browser cannot seek this`);
    if (dryRun) {
      repaired += 1;
      continue;
    }

    const out = await prepareScrollVideo(buffer, label);
    if (!out.changed) {
      console.log(`      could not repair: ${out.note || "unknown reason"}`);
      continue;
    }
    // Keep the original until the operator is satisfied, then write the new one.
    fs.writeFileSync(`${file}.original`, buffer);
    fs.writeFileSync(file, out.buffer);
    const after = moovPosition(out.buffer);
    console.log(`      repaired → index now ${(after * 100).toFixed(0)}% in  (${out.action}; original kept as ${label}.original)`);
    if (out.note) console.log(`      ${out.note}`);
    repaired += 1;
  }

  console.log(
    `\n${alreadyFine} file(s) already fine, ${repaired} ${dryRun ? "would be repaired" : "repaired"}.`
  );
  if (dryRun && repaired) console.log("Re-run with --apply to repair them.");
  if (!dryRun && repaired) {
    console.log(
      "\nHard-refresh the pages that use them. Once you are happy, the .original files can be deleted."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
