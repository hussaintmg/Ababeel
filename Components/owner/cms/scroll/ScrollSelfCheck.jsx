"use client";

/**
 * "Why is this section not playing?" — answered from the browser.
 *
 * Everything else that checks this section checks it on the server: the block's
 * settings, and whether the frame files are on disk. Neither of those catches
 * the failure that leaves no trace anywhere — the files being on disk but not
 * *reaching the browser*. A web server that is not passing /uploads through to
 * the app produces exactly that: uploads succeed, the files are written, the
 * CMS lists the animation, and every frame 404s for the visitor.
 *
 * So this asks the only question that settles it: fetch the frames the way a
 * visitor's browser fetches them, from this browser, and report what came back.
 * For a video it does the equivalent — loads it and asks whether it can
 * actually be seeked, which is the property a scroll section depends on and the
 * one no amount of file-checking can tell you.
 *
 * It runs on its own, at the top of the editor, because the person who needs it
 * is already looking at the section and should not have to know a URL.
 */

import { useCallback, useEffect, useState } from "react";
import { Stethoscope, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { resolveSource } from "@/Components/cms/ScrollVideo";

/** Load one image and say whether it arrived. */
function probeImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok) => resolve({ url, ok });
    img.onload = () => done(true);
    img.onerror = () => done(false);
    // Cache-busted, so a stale 200 from an earlier visit cannot hide a 404 now.
    img.src = `${url}${url.includes("?") ? "&" : "?"}_check=${Date.now()}`;
  });
}

/** Load a video's header and say whether the browser can seek it. */
function probeVideo(url) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const finish = (r) => {
      v.removeAttribute("src");
      v.load?.();
      resolve(r);
    };
    const timer = setTimeout(
      () => finish({ reached: true, seekable: false, reason: "The browser fetched it but never reported a duration." }),
      12000
    );
    v.onloadedmetadata = () => {
      clearTimeout(timer);
      const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
      const seekable = duration > 0 && v.seekable && v.seekable.length > 0;
      finish({ reached: true, seekable, duration, reason: seekable ? "" : "It loaded, but reports no seekable range." });
    };
    v.onerror = () => {
      clearTimeout(timer);
      finish({ reached: false, seekable: false, reason: "The browser could not load or decode it." });
    };
    v.src = url;
  });
}

export default function ScrollSelfCheck({ props }) {
  const [state, setState] = useState({ status: "idle" });

  const run = useCallback(async () => {
    setState({ status: "running" });
    const source = resolveSource(props || {});

    if (source.kind === "none") {
      setState({
        status: "done",
        level: "error",
        headline: "No animation or video is attached to this section.",
        detail: "Choose one under “Start here — choose a ready-made animation”. Nothing else here can be checked until then.",
        lines: [],
      });
      return;
    }

    if (source.kind === "video") {
      const r = await probeVideo(source.src);
      const lines = [`Video: ${source.src}`];
      if (r.duration) lines.push(`Duration the browser sees: ${r.duration.toFixed(1)}s`);
      if (!r.reached) {
        setState({
          status: "done", level: "error", lines,
          headline: "The browser cannot load this video at all.",
          detail: "Either the file is not being served, or it is a format this browser will not decode — a .mov from a phone is usually HEVC, which Chrome and Firefox refuse. Re-upload it, or build a frame sequence from it.",
        });
      } else if (!r.seekable) {
        setState({
          status: "done", level: "error", lines,
          headline: "This video loads but cannot be seeked, so the scroll cannot drive it.",
          detail: `${r.reason} This is what an MP4 whose index sits at the end of the file does. Press “Repair this video for scrolling” below, or convert it to a frame sequence.`,
        });
      } else {
        setState({
          status: "done", level: "ok", lines,
          headline: "The video loads and can be seeked.",
          detail: "If the section still does not follow the scroll, the problem is not the file — tell whoever is helping you that this check passed.",
        });
      }
      return;
    }

    /* ---- a frame sequence: fetch the frames the way a visitor would ---- */
    const urls = source.frameUrls || [];
    const total = source.frameCount || urls.length;
    if (!urls.length) {
      setState({
        status: "done", level: "error", lines: [],
        headline: "This section is set to play frames, but it has no frame addresses saved.",
        detail: "Pick the animation again under “Start here”, then save the page.",
      });
      return;
    }

    // A spread across the sequence, plus the first and the last.
    const picks = new Set([0, urls.length - 1]);
    const stride = Math.max(Math.floor(urls.length / 8), 1);
    for (let i = 0; i < urls.length; i += stride) picks.add(i);

    const results = await Promise.all([...picks].map((i) => probeImage(urls[i])));
    const failed = results.filter((r) => !r.ok);
    const lines = [
      `Sequence: ${total} frames`,
      `Checked ${results.length} of them, spread across the sequence`,
      `First frame: ${urls[0]}`,
    ];

    if (failed.length === results.length) {
      setState({
        status: "done", level: "error", lines,
        headline: "None of the frames reach the browser.",
        detail:
          "The animation is saved and its files may well be on the server, but nothing under /uploads/ is being delivered to visitors. That is a web-server setting, not a CMS one: whoever manages the hosting needs to let /uploads/ through to the application. Until then no scroll animation can play, on any page.",
      });
    } else if (failed.length) {
      setState({
        status: "done", level: "error", lines,
        headline: `${failed.length} of the ${results.length} frames checked are missing.`,
        detail:
          "The animation record exists but some of its images do not. Re-create it under Scroll Animations, or choose a different one. Missing frames make the picture stick and jump.",
      });
    } else {
      setState({
        status: "done", level: "ok", lines,
        headline: "Every frame checked loaded correctly.",
        detail:
          "The sequence is reaching the browser, so the section has everything it needs. If it still does not move on the public page, check that the page is Published and that this block is on it.",
      });
    }
  }, [props]);

  // Run once when the section is opened, and again whenever the source changes.
  const sourceKey = `${props?.renderMode || ""}:${props?.animationId || ""}:${props?.src || ""}:${(props?.frames || []).length}`;
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const tone =
    state.level === "ok"
      ? { box: "border-green-200 bg-green-50", text: "text-green-900", Icon: CheckCircle2 }
      : state.level === "error"
      ? { box: "border-red-200 bg-red-50", text: "text-red-900", Icon: XCircle }
      : { box: "border-gray-200 bg-gray-50", text: "text-gray-700", Icon: AlertTriangle };

  return (
    <div className={`rounded-xl border p-3 ${tone.box}`}>
      <div className="flex items-center gap-2">
        <Stethoscope size={14} className={tone.text} />
        <span className={`text-xs font-semibold ${tone.text}`}>Section check</span>
        <button
          type="button"
          onClick={run}
          disabled={state.status === "running"}
          className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-gray-500 hover:bg-white/70 disabled:opacity-50"
          title="Check again"
        >
          {state.status === "running" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Check again
        </button>
      </div>

      {state.status === "running" || state.status === "idle" ? (
        <p className="mt-1.5 text-[11px] text-gray-500">Fetching this section’s files the way a visitor’s browser would…</p>
      ) : (
        <>
          <p className={`mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold ${tone.text}`}>
            <tone.Icon size={13} className="mt-0.5 shrink-0" />
            {state.headline}
          </p>
          <p className={`mt-1 text-[11px] ${tone.text} opacity-90`}>{state.detail}</p>
          {state.lines?.length ? (
            <ul className="mt-1.5 space-y-0.5">
              {state.lines.map((l, i) => (
                <li key={i} className="font-mono text-[10px] text-gray-500 break-all">
                  {l}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
