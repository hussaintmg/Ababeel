/**
 * Derive the site's web images from the full-size originals in public/.
 *
 * The originals are 1.5–2.4 MB PNGs at 1920×700 — fine as source material,
 * ruinous on a page that shows a dozen of them. This crops each one to the
 * shape the section actually uses and writes a WebP at that size, so the
 * homepage ships tens of kilobytes per image instead of megabytes.
 *
 * Re-runnable: it only rewrites what it is asked to produce.
 *
 *   node scripts/build-home-images.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "public/cms/home");

/** [source, output name, width, height] — the shape each section needs. */
const IMAGES = [
  ["bannerv2.webp", "hero", 2000, 1200],

  // Feature bands
  ["7.png", "trust", 1200, 900],
  ["2.png", "corporate", 1200, 900],
  ["8.png", "consultancy", 1200, 900],
  ["12.png", "career", 1600, 900],
  ["11.png", "practical", 1600, 900],

  // About page
  ["4.png", "about-hero", 2000, 1100],
  ["3.png", "about-approach", 1200, 900],
  ["6.png", "about-before", 1400, 900],
  ["7.png", "about-after", 1400, 900],

  // Industry tiles
  ["1.png", "industry-construction", 800, 600],
  ["10.png", "industry-oil-gas", 800, 600],
  ["11.png", "industry-manufacturing", 800, 600],
  ["5.png", "industry-engineering", 800, 600],
  ["9.png", "industry-logistics", 800, 600],
  ["13.png", "industry-facilities", 800, 600],
];

async function main() {
  await mkdir(OUT, { recursive: true });
  let total = 0;
  for (const [src, name, w, h] of IMAGES) {
    const buf = await sharp(path.join(SRC, src))
      .resize(w, h, { fit: "cover", position: "attention" })
      .webp({ quality: 72 })
      .toBuffer();
    await writeFile(path.join(OUT, `${name}.webp`), buf);
    total += buf.length;
    console.log(`${name}.webp  ${w}×${h}  ${Math.round(buf.length / 1024)} KB`);
  }
  console.log(`\n${IMAGES.length} images, ${Math.round(total / 1024)} KB total → public/cms/home`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
