"use client";

/**
 * "Repair this video for scrolling".
 *
 * Only shown when the block is actually set to play a video, because that is
 * the only case where it applies — and it is the case that has cost this
 * section the most. A video uploaded before uploads were prepared on arrival
 * still has its index at the end of the file, and a browser cannot seek such a
 * file at all: the section shows one frame and the scroll drives nothing.
 *
 * The button does the same lossless repair the uploader now does, on the file
 * already on the server, and keeps the original alongside.
 */

import { useState } from "react";
import axios from "axios";
import { Wrench, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function VideoRepair({ props }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const src = props?.src || "";
  const isLocal = src.startsWith("/uploads/");
  // Frames do not have this problem; nor does a video hosted elsewhere, which
  // we cannot rewrite.
  if (props?.renderMode === "frames" || !src) return null;

  const repair = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post("/api/owner/cms/repair-video", { url: src }, { withCredentials: true });
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not repair that video");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <p className="flex items-start gap-1.5 text-[11px] text-amber-900">
        <Wrench size={13} className="mt-0.5 shrink-0" />
        <span>
          This section is playing a <strong>video</strong>. A scroll section does not play its video,
          it seeks it — and most exports cannot be seeked until their index is moved to the front of
          the file. If the picture does not follow the scroll, that is almost always why.
        </span>
      </p>

      {isLocal ? (
        <button
          type="button"
          onClick={repair}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Wrench size={13} />}
          {busy ? "Repairing…" : "Repair this video for scrolling"}
        </button>
      ) : (
        <p className="mt-2 text-[11px] text-amber-800">
          This video is hosted elsewhere, so it cannot be repaired from here. Upload it to this site
          instead — uploads are prepared for scrolling automatically.
        </p>
      )}

      {result ? (
        <p
          className={`mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11px] ${
            result.changed ? "bg-green-50 text-green-800" : "bg-white text-gray-600"
          }`}
        >
          {result.changed ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : <AlertTriangle size={12} className="mt-0.5 shrink-0" />}
          <span>
            {result.changed ? (
              <>
                <strong>Repaired.</strong> The index moved from {result.indexBefore}% to{" "}
                {result.indexAfter}% of the file. {result.note} Hard-refresh the public page to see
                it. The original was kept as <code className="font-mono">{result.originalKeptAs}</code>.
              </>
            ) : (
              result.note
            )}
          </span>
        </p>
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}

      <p className="mt-2 text-[11px] text-amber-800">
        A frame sequence avoids all of this — it scrubs instantly because nothing is decoded while
        you scroll. Use “Build a sequence from a video file” below to convert this one.
      </p>
    </div>
  );
}
