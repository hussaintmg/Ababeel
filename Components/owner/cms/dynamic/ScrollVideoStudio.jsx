"use client";

/**
 * Scroll-video preview, scrubber and health check for the builder.
 *
 * Three things the author could not do before:
 *
 *   • preview a frame sequence at all. The panel bailed out unless a video file
 *     was attached, so the commonest setup — pick a saved scroll animation, no
 *     video anywhere — showed nothing and looked broken before it ever reached
 *     a page.
 *   • see the mobile configuration without a phone. Desktop/Mobile switches the
 *     preview between the two, including the separate mobile source, stage
 *     height and scroll distance.
 *   • find out what is wrong. Every problem the renderer can detect is listed
 *     underneath with what to do about it, instead of the author scrolling a
 *     live page to work out why nothing moves.
 */

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Film, Monitor, Smartphone, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import ScrollVideo, { useVideoMeta, mapProgress, validateScrollVideo, resolveSource } from "@/Components/cms/ScrollVideo";

function timecode(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const DEVICES = [
  { value: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { value: "mobile", label: "Mobile", icon: Smartphone, width: "390px" },
];

export default function ScrollVideoStudio({ props }) {
  const metaVideoRef = useRef(null);
  const meta = useVideoMeta(metaVideoRef, props.src);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [device, setDevice] = useState("desktop");
  // The sequence's real shape, read from its first frame. A fixed-height
  // preview box crops with `cover`, so a tall or unusually-sized sequence
  // showed a sliver of itself and looked broken — the author could not see
  // what they were editing. The box takes the frames' own aspect ratio
  // instead, and nothing is cropped.
  const [frameAspect, setFrameAspect] = useState(0);
  const timerRef = useRef(null);

  const togglePlay = () => {
    if (playing) {
      clearInterval(timerRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timerRef.current);
          setPlaying(false);
          return 1;
        }
        return Math.min(p + 0.01, 1);
      });
    }, 40);
  };

  // Read the shape off the first frame, once per sequence.
  const firstFrame = Array.isArray(props.frames) && props.frames.length ? props.frames[0] : "";
  useEffect(() => {
    if (!firstFrame) {
      setFrameAspect(0);
      return undefined;
    }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalHeight) setFrameAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = firstFrame;
    return () => {
      alive = false;
    };
  }, [firstFrame]);

  const problems = validateScrollVideo(props);
  const errors = problems.filter((x) => x.level === "error");
  const source = resolveSource(props, { mobile: device === "mobile" });
  const nothingToShow = source.kind === "none";

  const mapped = mapProgress(progress, {
    mode: props.mode,
    startOffset: props.startOffset,
    endOffset: props.endOffset,
    speed: props.speed,
    reverse: props.reverse,
    loops: props.loops,
    ease: props.playbackEase,
    offset: props.offset,
  });
  const currentTime = mapped * (meta.duration || 0);
  const currentFrame =
    source.kind === "frames"
      ? Math.round(mapped * Math.max(source.frameCount - 1, 0)) + 1
      : Math.round(currentTime * (meta.fps || 30));
  const ticks = Math.min(Math.max(Math.round((meta.duration || 0) / 2), 4), 12);

  const summary =
    source.kind === "frames"
      ? `${source.frameCount} frames`
      : source.kind === "video"
      ? meta.duration
        ? `${timecode(meta.duration)} · ${meta.width}×${meta.height} · ~${meta.fps}fps`
        : "reading metadata…"
      : source.kind === "poster"
      ? source.reason || "poster image"
      : "no source";

  const device_ = DEVICES.find((d) => d.value === device) || DEVICES[0];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Hidden element used purely to read the file's metadata. */}
      {props.src ? <video ref={metaVideoRef} src={props.src} preload="metadata" muted playsInline className="hidden" /> : null}

      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <Film size={14} className="text-fuchsia-600" />
        <span className="text-xs font-medium text-gray-700">Scroll video preview</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-gray-200/70 p-0.5">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDevice(d.value)}
                title={`Preview as ${d.label.toLowerCase()}`}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  device === d.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={12} /> {d.label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-gray-400">{summary}</span>
      </div>

      <div className="bg-gray-900 p-3 flex justify-center">
        <div
          className="relative bg-black overflow-hidden rounded"
          style={
            // Mobile is previewed at a phone's width, so its shape is the
            // point and the height follows. Otherwise the box takes the
            // frames' own aspect ratio, capped so a very tall sequence does
            // not push everything else off the panel.
            device === "mobile"
              ? { width: 390, maxWidth: "100%", height: 420 }
              : { width: "100%", maxWidth: 560, aspectRatio: frameAspect ? String(frameAspect) : "16 / 9" }
          }
        >
          {nothingToShow ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-6">
              <AlertCircle size={20} className="text-amber-400" />
              <p className="text-xs text-amber-200">Nothing to preview yet.</p>
              <p className="text-[11px] text-gray-400">
                Choose a ready-made animation above, upload a video, or set a poster image.
              </p>
            </div>
          ) : (
            // The preview forces a full-motion, unpinned, fixed-height render so
            // the scrubber owns the position — the section's own pin and scroll
            // hold belong to the page, not to a 240px box.
            <div className="absolute inset-0 [&_section]:!h-full [&_section>div]:!h-full [&_section>div]:!relative">
              <ScrollVideo
                p={{
                  ...props,
                  stageHeight: "100%",
                  mobileStageHeight: "100%",
                  height: "100%",
                  // The scrubber owns the position here, so the section must
                  // not pin: `relative` rather than `static` keeps it a
                  // containing block, which the overlays and scenes position
                  // against.
                  sticky: false,
                  reducedMotion: "full",
                  // Show the whole frame. The box already matches the
                  // sequence's shape, and an author checking their animation
                  // needs to see all of it rather than the public page's crop.
                  fit: "contain",
                }}
                builderProgress={mapped}
                forceDevice={device}
                // A video that loads but cannot be seeked only reveals itself
                // at runtime, so the preview has to be able to say so — the
                // validation list underneath cannot know it.
                showDiagnostics
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700"
            title={playing ? "Pause" : "Play through the scroll range"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => {
              setProgress(Number(e.target.value) / 1000);
              if (playing) {
                clearInterval(timerRef.current);
                setPlaying(false);
              }
            }}
            aria-label="Scrub through the scroll range"
            className="flex-1 accent-blue-600"
          />
          <span className="w-28 text-right text-[11px] font-mono text-gray-500">
            {Math.round(progress * 100)}%
            {source.kind === "frames" ? ` · f${currentFrame}` : ` · ${timecode(currentTime)} · f${currentFrame}`}
          </span>
        </div>

        {/* Scene boundaries, drawn on the same 0–100% ruler the scrubber uses,
            so an author can see where each one takes over. */}
        {Array.isArray(props.scenes) && props.scenes.length ? (
          <div className="mt-2 relative h-6">
            <div className="absolute inset-x-0 top-2 h-1 rounded bg-gray-200" />
            {props.scenes.map((s, i) => {
              const a = Math.max(Math.min(Number(s?.start ?? 0), 100), 0);
              const b = Math.max(Math.min(Number(s?.end ?? 100), 100), 0);
              if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
              const lo = Math.min(a, b);
              const hi = Math.max(a, b);
              return (
                <div
                  key={i}
                  className="absolute top-1.5 h-2 rounded bg-fuchsia-400/80"
                  style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 0.6)}%` }}
                  title={`Scene ${i + 1}: ${lo}%–${hi}% ${s?.heading ? `· ${s.heading}` : ""}`}
                />
              );
            })}
            <div className="absolute top-0 w-px h-6 bg-blue-600" style={{ left: `${progress * 100}%` }} />
          </div>
        ) : source.kind === "video" ? (
          <div className="mt-2 flex items-end justify-between text-[10px] text-gray-400 font-mono">
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const t = (i / ticks) * (meta.duration || 0);
              return (
                <span key={i} className="flex flex-col items-center gap-0.5">
                  <span className="block w-px h-2 bg-gray-300" />
                  {timecode(t)}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* What is wrong, and what to do about it. */}
      <div className="border-t border-gray-100 px-3 py-2.5 space-y-1.5">
        {problems.length === 0 ? (
          <p className="flex items-center gap-1.5 text-[11px] text-green-700">
            <CheckCircle2 size={12} /> This section is set up correctly.
          </p>
        ) : (
          problems.map((issue, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11px] ${
                issue.level === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
              }`}
            >
              {issue.level === "error" ? (
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              )}
              <span>
                <strong className="font-semibold">{issue.message}</strong>
                {issue.hint ? <span className="block opacity-90">{issue.hint}</span> : null}
              </span>
            </div>
          ))
        )}
        {errors.length ? (
          <p className="text-[11px] text-gray-500">
            The section still renders — it falls back to the poster and its text rather than showing a
            blank box — but it will not animate until the errors above are fixed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
