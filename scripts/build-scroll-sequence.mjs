/**
 * Build the homepage's scroll-driven frame sequence from the site's own photos.
 *
 * The sequence is a slow push across four workplaces — construction, oil & gas,
 * manufacturing, logistics — cross-fading one into the next, with a navy grade
 * so overlay text stays readable at every frame. Frames are written where the
 * frame-sequence engine expects them and registered as a CmsFrameSequence, so
 * the result is an ordinary scroll animation the owner can edit, replace or
 * delete from the admin like any other.
 *
 *   MONGO_URI=... node scripts/build-scroll-sequence.mjs [--frames=120]
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ObjectId } from "mongodb";
import { connectSeed } from "./lib/connect.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const W = 1280;
const H = 720;

/** The shots the push travels through, in order. */
const SHOTS = [
  "public/cms/home/industry-construction.webp",
  "public/cms/home/industry-oil-gas.webp",
  "public/cms/home/industry-manufacturing.webp",
  "public/cms/home/industry-logistics.webp",
];

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

/** One shot, zoomed to `scale` and cropped back to the frame size. */
async function shot(src, scale) {
  const w = Math.round(W * scale);
  const h = Math.round(H * scale);
  return sharp(src)
    .resize(w, h, { fit: "cover" })
    .extract({ left: Math.round((w - W) / 2), top: Math.round((h - H) / 2), width: W, height: H })
    .toBuffer();
}

async function main() {
  const total = Math.min(Math.max(parseInt(arg("frames", "120"), 10) || 120, 24), 400);
  const perShot = Math.floor(total / SHOTS.length);
  const fadeFrames = Math.round(perShot * 0.3);

  const { client, db } = await connectSeed({
    uri: process.env.MONGO_URI,
    db: arg("db", ""),
    force: process.argv.includes("--force"),
    script: "the scroll-sequence builder",
  });

  const id = new ObjectId();
  const dir = path.join(ROOT, "public/uploads/scroll-frames", id.toHexString());
  await mkdir(dir, { recursive: true });

  // A navy wash keeps the overlay legible over every shot without hiding it.
  const grade = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 8, g: 31, b: 56, alpha: 0.42 } },
  })
    .png()
    .toBuffer();

  const frames = [];
  try {
    for (let i = 0; i < total; i++) {
      const at = Math.min(Math.floor(i / perShot), SHOTS.length - 1);
      const within = i - at * perShot;
      const scale = 1.0 + (within / perShot) * 0.14;

      const layers = [{ input: grade }];
      const base = await shot(SHOTS[at], scale);

      // Cross-fade into the next shot over the tail of this one.
      const next = SHOTS[at + 1];
      if (next && within >= perShot - fadeFrames) {
        const t = (within - (perShot - fadeFrames)) / fadeFrames;
        const incoming = await sharp(await shot(next, 1.0 + (t * fadeFrames * 0.14) / perShot))
          .ensureAlpha(Math.min(Math.max(t, 0), 1))
          .png()
          .toBuffer();
        layers.unshift({ input: incoming });
      }

      const buf = await sharp(base).composite(layers).webp({ quality: 68 }).toBuffer();
      const name = `frame-${String(i + 1).padStart(6, "0")}.webp`;
      await writeFile(path.join(dir, name), buf);
      frames.push(`/uploads/scroll-frames/${id.toHexString()}/${name}`);
      if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${total} frames`);
    }
  } catch (err) {
    await rm(dir, { recursive: true, force: true });
    throw err;
  }

  const now = new Date();
  await db.collection("cmsframesequences").insertOne({
    _id: id,
    name: "Safety Across Industries",
    sourceType: "FRAMES",
    status: "READY",
    frames,
    frameCount: frames.length,
    missingFrames: [],
    width: W,
    height: H,
    progress: 100,
    stage: "done",
    error: "",
    storage: "local",
    createdAt: now,
    updatedAt: now,
  });

  console.log(`\nScroll animation ready: ${id.toHexString()} (${frames.length} frames)`);
  console.log(`Frames in public/uploads/scroll-frames/${id.toHexString()}`);
  await client.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
