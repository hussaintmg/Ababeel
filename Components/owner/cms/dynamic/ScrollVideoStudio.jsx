"use client";

/**
 * Scroll-video preview + frame scrubber for the builder.
 *
 * Reads the real file's duration, dimensions and (where the browser exposes
 * per-frame callbacks) its actual frame rate, then lets the author drag through
 * the mapped playback range to check exactly which frame lands where — without
 * having to scroll the published page.
 */
import { useRef, useState } from "react";
import { Play, Pause, Film } from "lucide-react";
import ScrollVideo, { useVideoMeta, mapProgress } from "@/Components/cms/ScrollVideo";

function timecode(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ScrollVideoStudio({ props }) {
  const metaVideoRef = useRef(null);
  const meta = useVideoMeta(metaVideoRef, props.src);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
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

  if (!props.src) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs text-gray-400">
        Choose a video above to see the frame timeline and scrubber.
      </div>
    );
  }

  const mapped = mapProgress(progress, {
    mode: props.mode,
    startOffset: props.startOffset,
    endOffset: props.endOffset,
    speed: props.speed,
    reverse: props.reverse,
    loops: props.loops,
  });
  const currentTime = mapped * (meta.duration || 0);
  const currentFrame = Math.round(currentTime * (meta.fps || 30));
  const ticks = Math.min(Math.max(Math.round((meta.duration || 0) / 2), 4), 12);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Hidden element used purely to read the file's metadata. */}
      <video ref={metaVideoRef} src={props.src} preload="metadata" muted playsInline className="hidden" />

      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <Film size={14} className="text-fuchsia-600" />
        <span className="text-xs font-medium text-gray-700">Scroll video preview</span>
        <span className="ml-auto text-[11px] text-gray-400">
          {meta.duration ? `${timecode(meta.duration)} · ${meta.width}×${meta.height} · ~${meta.fps}fps · ~${meta.frames} frames` : "reading metadata…"}
        </span>
      </div>

      <div className="relative bg-black" style={{ height: 220 }}>
        <div className="absolute inset-0 [&_section]:!h-full [&_section>div]:!h-full [&_section>div]:!static">
          <ScrollVideo p={{ ...props, stageHeight: "220px", height: "220px", sticky: false, respectReducedMotion: false }} builderProgress={mapped} />
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
            className="flex-1 accent-blue-600"
          />
          <span className="w-28 text-right text-[11px] font-mono text-gray-500">
            {Math.round(progress * 100)}% · {timecode(currentTime)} · f{currentFrame}
          </span>
        </div>

        {/* Frame timeline, generated from the video's real duration. */}
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
      </div>
    </div>
  );
}
