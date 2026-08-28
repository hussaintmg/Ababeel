"use client";

/**
 * What this deployment can actually do.
 *
 * Shown before anything is uploaded so a missing ffmpeg is discovered here and
 * not halfway through a 400 MB video — and so the two routes that do not need
 * it are visibly still available.
 */
import { Check, AlertTriangle, Circle } from "lucide-react";

function Row({ state, label, detail }) {
  const icon =
    state === "ok" ? <Check size={13} className="text-emerald-600" />
      : state === "warn" ? <AlertTriangle size={13} className="text-amber-500" />
      : <Circle size={11} className="text-gray-300" />;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className={state === "off" ? "text-gray-400" : "text-gray-700"}>
        {label}
        {detail ? <span className="block text-[11px] text-gray-400">{detail}</span> : null}
      </span>
    </div>
  );
}

export default function CapabilityBar({ capabilities }) {
  if (!capabilities) return null;
  const c = capabilities;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Media processing</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <Row state="ok" label="Frame upload" />
        <Row state="ok" label="ZIP import" />
        <Row state={c.localStorageAvailable ? "ok" : "warn"} label="Local storage" />
        <Row
          state={c.ffmpegAvailable ? "ok" : "warn"}
          label={c.ffmpegAvailable ? "Video processing (ffmpeg)" : "Video processing unavailable"}
          detail={c.ffmpegAvailable ? c.ffmpegVersion : c.ffmpegReason}
        />
        <Row
          state={c.imageOptimizationAvailable ? "ok" : "warn"}
          label={c.imageOptimizationAvailable ? "WebP optimization" : "WebP optimization unavailable"}
          detail={c.imageOptimizationAvailable ? "" : c.imageOptimizationReason}
        />
        <Row
          state={c.cloudStorageAvailable ? "ok" : "off"}
          label={c.cloudStorageAvailable ? "Cloud storage configured" : "Cloud storage not configured"}
          detail={c.cloudStorageAvailable ? "" : "Optional — local storage is used"}
        />
      </div>
      {!c.ffmpegAvailable ? (
        <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
          This server cannot process video. Use <b>ZIP Frames</b> or <b>Multiple Frames</b> — both produce exactly the
          same scroll animation.
        </p>
      ) : null}
    </div>
  );
}
