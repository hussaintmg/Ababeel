"use client";

/**
 * Loads a frame sequence and keeps the decoded images in a ref.
 *
 * Frames are fetched a few at a time, nearest-first, so something is on screen
 * almost immediately and the rest fill in while the visitor reads the section
 * above. Nothing here re-renders React on every frame — the draw loop reads the
 * ref directly, which is what keeps scrubbing free of React's work.
 */

import { useEffect, useRef, useState } from "react";
import { loadOrder, frameUrl } from "./engine";

export default function useFrameSequence({ id, count, ext, enabled, onFirstFrame, urls }) {
  const imagesRef = useRef([]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  // Frames that could not be fetched. A sequence whose files are missing used
  // to show a black stage and say nothing, leaving the owner to guess.
  const [failed, setFailed] = useState(0);

  // Reset counters when the sequence itself changes, derived during render
  // rather than from the effect so there is no extra render pass.
  const key = `${id || ""}:${count || 0}`;
  const [seqKey, setSeqKey] = useState(key);
  if (key !== seqKey) {
    setSeqKey(key);
    setLoaded(0);
    setReady(false);
    setFailed(0);
  }

  useEffect(() => {
    // A sequence is addressed either by id (frames generated into a known
    // directory) or by an explicit URL list (a saved scroll animation). Either
    // is enough; requiring the id silently disabled the URL-list case.
    if (!enabled || !count || (!id && !urls?.length)) return undefined;
    let cancelled = false;
    const images = new Array(count).fill(null);
    imagesRef.current = images;

    let done = 0;
    // Distinct frames, not failed attempts: the loader may retry one when the
    // queue is re-planned, and "11 of 26" for ten missing files is a lie.
    const missing = new Set();
    // A phone has far less headroom than a laptop; fetch fewer at once there.
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    const memoryGb = typeof navigator !== "undefined" ? navigator.deviceMemory || 4 : 4;
    const CONCURRENCY = mobile || memoryGb <= 2 ? 3 : 6;

    const srcFor = (index) => (urls?.length ? urls[index] : frameUrl(id, index, ext));

    const loadOne = (index) =>
      new Promise((resolve) => {
        if (cancelled || images[index]) return resolve();
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return resolve();
          images[index] = img;
          done += 1;
          setLoaded(done);
          if (!images.__firstReported) {
            images.__firstReported = true;
            setReady(true);
            onFirstFrame?.();
          }
          resolve();
        };
        // A missing frame must not stall the sequence; the draw step falls
        // back to the nearest frame it does have. It is counted, though, so the
        // builder can say what is wrong instead of showing a black rectangle.
        img.onerror = () => {
          if (!cancelled) {
            missing.add(index);
            setFailed(missing.size);
          }
          resolve();
        };
        img.src = srcFor(index);
      });

    // Re-planned whenever the viewer moves far from where the queue was built,
    // so the frames nearest the current position always come first.
    let queue = loadOrder(count, 0);
    let cursor = 0;
    const pump = async () => {
      while (!cancelled && cursor < queue.length) {
        const index = queue[cursor];
        cursor += 1;
        await loadOne(index);
      }
    };

    loadOne(0).then(() => {
      for (let i = 0; i < CONCURRENCY; i++) pump();
    });

    // The draw loop calls this as the viewer scrolls, which during a scroll is
    // many times a second. Re-planning on every call was actively harmful: each
    // one threw the queue away and reset the cursor, so the six workers kept
    // restarting at the head of a queue that had just changed again and the
    // download never worked systematically through the sequence. On a slow
    // connection that showed as the picture freezing part-way through the
    // section. Re-plan only when the viewer has actually moved somewhere else,
    // and not more than a few times a second.
    let plannedAt = 0;
    let plannedFor = 0;
    const REPLAN_MS = 400;
    const REPLAN_DISTANCE = Math.max(Math.floor(count / 8), 4);

    imagesRef.reprioritize = (current) => {
      if (cancelled || cursor >= queue.length) return;
      const now = Date.now();
      if (now - plannedAt < REPLAN_MS) return;
      if (Math.abs(current - plannedFor) < REPLAN_DISTANCE) return;
      plannedAt = now;
      plannedFor = current;
      queue = loadOrder(count, current).filter((i) => !images[i]);
      cursor = 0;
    };

    return () => {
      cancelled = true;
      imagesRef.reprioritize = null;
      // Dropping the references is what lets the browser reclaim the decoded
      // bitmaps. Several long sequences on one page is otherwise hundreds of
      // megabytes that never comes back.
      images.forEach((img, i) => {
        if (img) {
          img.onload = null;
          img.onerror = null;
          images[i] = null;
        }
      });
      imagesRef.current = [];
    };
  }, [id, count, ext, enabled, onFirstFrame, urls]);

  return { imagesRef, loaded, ready, failed };
}
