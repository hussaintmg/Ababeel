import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getCmsDoc } from "@/lib/cms";
import { resolveSource, validateScrollVideo, sceneRange } from "@/Components/cms/ScrollVideo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Why a Scroll Video section is not playing on a published page.
 *
 * A scroll section can fail for reasons that are invisible from the outside:
 * the page is still a draft, the block is set to play a video rather than the
 * sequence, or the frame files the block names are not on the server any more.
 * From a browser all three look identical — one frozen picture — and the only
 * way anyone has been able to tell them apart is to guess.
 *
 * This answers it directly. Open it while signed in as the owner:
 *
 *   /api/owner/cms/scroll-check/professional-dev
 *
 * It reports, for every Scroll Video block on that page, what the block is set
 * to, and — the part that cannot be checked any other way — whether the frame
 * files it names actually exist on this server's disk.
 *
 * Owner-only, and read-only: it changes nothing.
 */

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

/** Is this public URL a file that exists? Only paths inside /public count. */
function fileFor(url) {
  const clean = String(url || "").split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return { checked: false, reason: "not a local path" };
  const abs = path.resolve(PUBLIC_ROOT, `.${clean}`);
  if (!abs.startsWith(`${PUBLIC_ROOT}${path.sep}`)) return { checked: false, reason: "outside the public folder" };
  try {
    const stat = fs.statSync(abs);
    return { checked: true, exists: stat.isFile(), bytes: stat.size };
  } catch {
    return { checked: true, exists: false, bytes: 0 };
  }
}

/** Check a spread of frames rather than all of them — enough to be certain. */
function sampleFrames(urls) {
  if (!urls.length) return { sampled: 0, missing: [], totalBytes: 0 };
  const idx = new Set([0, urls.length - 1]);
  for (let i = 0; i < urls.length; i += Math.max(Math.floor(urls.length / 10), 1)) idx.add(i);
  const missing = [];
  let totalBytes = 0;
  let counted = 0;
  idx.forEach((i) => {
    const r = fileFor(urls[i]);
    if (!r.checked) return;
    counted += 1;
    if (!r.exists) missing.push({ frame: i + 1, url: urls[i] });
    else totalBytes += r.bytes;
  });
  return {
    sampled: counted,
    missing,
    // Rough, from the sample: enough to say whether this is a heavy sequence.
    estimatedTotalMb: counted ? Number(((totalBytes / counted) * urls.length / 1024 / 1024).toFixed(1)) : 0,
  };
}

export async function GET(request, context) {
  const { user, error } = await requireOwner(request);
  if (error) return error;

  const { key } = await context.params;

  let doc;
  try {
    doc = await getCmsDoc(key);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Could not read the page: ${err?.message || "database unavailable"}` },
      { status: 503 }
    );
  }
  if (!doc) {
    return NextResponse.json({ success: false, error: `No CMS page with the key "${key}".` }, { status: 404 });
  }

  const blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
  const scrollBlocks = blocks.filter((b) => b?.type === "scrollVideo");

  const report = scrollBlocks.map((block, n) => {
    const p = block.props || {};
    const source = resolveSource(p);
    const frames = Array.isArray(p.frames) ? p.frames : [];
    const files = source.kind === "frames" && frames.length ? sampleFrames(frames) : null;

    return {
      block: n + 1,
      id: block.id,
      willRender: source.kind,
      renderMode: p.renderMode || "(unset)",
      animationId: p.animationId || "",
      framesInBlock: frames.length,
      frameCountProp: p.frameCount || "",
      firstFrame: frames[0] || "",
      lastFrame: frames[frames.length - 1] || "",
      frameFiles: files
        ? {
            sampled: files.sampled,
            missing: files.missing.length,
            missingExamples: files.missing.slice(0, 3),
            estimatedTotalMb: files.estimatedTotalMb,
          }
        : null,
      video: p.src || "",
      poster: p.poster || "",
      scrollDuration: p.scrollDuration || "(auto)",
      pinned: p.sticky !== false,
      elements: (Array.isArray(p.scenes) ? p.scenes : []).map((s, i) => {
        const r = sceneRange(s, source.kind === "frames" ? source.frameCount : 0);
        return {
          element: i + 1,
          label: s.heading || s.text || s.ctaLabel || (s.image ? "image" : `element ${i + 1}`),
          frames: s.startFrame || s.endFrame ? `${s.startFrame || 1}–${s.endFrame || source.frameCount || "?"}` : null,
          percent: `${Math.round(r.start * 100)}%–${Math.round(r.end * 100)}%`,
        };
      }),
      problems: validateScrollVideo(p),
    };
  });

  // The three things that most often mean "it does not play", answered plainly.
  const verdict = [];
  if (!doc.enabled) {
    verdict.push(
      `The page "${key}" is a DRAFT. Visitors see the built-in content, not anything built in the CMS. Switch it to Published and save.`
    );
  }
  if (!scrollBlocks.length) {
    verdict.push(`There is no Scroll Video block on this page — it has ${blocks.length} block(s): ${blocks.map((b) => b?.type).join(", ") || "none"}.`);
  }
  report.forEach((r) => {
    if (r.willRender === "video") {
      verdict.push(`Block ${r.block} is set to play a VIDEO, not a frame sequence. Choose a scroll animation, or set the playback source to Frame sequence.`);
    }
    if (r.willRender === "none") {
      verdict.push(`Block ${r.block} has no usable source at all — no frames, no video, no poster.`);
    }
    if (r.frameFiles?.missing) {
      verdict.push(
        `Block ${r.block}: ${r.frameFiles.missing} of ${r.frameFiles.sampled} sampled frame files are MISSING from this server. The animation record exists but its images do not — re-create it under Scroll Animations.`
      );
    }
  });
  if (!verdict.length) verdict.push("Nothing obviously wrong: the page is published and the block has its frames on disk.");

  return NextResponse.json({
    success: true,
    page: key,
    published: !!doc.enabled,
    totalBlocks: blocks.length,
    scrollVideoBlocks: scrollBlocks.length,
    verdict,
    report,
    checkedBy: user?.email || "",
  });
}
