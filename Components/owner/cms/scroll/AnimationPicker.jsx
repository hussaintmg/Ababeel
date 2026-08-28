"use client";

/**
 * Picks a saved Scroll Animation for a block.
 *
 * Choosing one copies its ordered frame URLs into the block, so the public page
 * renders straight from the block with no extra request — and a later edit to
 * the animation does not silently change a published page.
 */
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { Clapperboard, Loader2, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";

function formatBytes(n) {
  if (!n) return "—";
  const mb = n / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

export default function AnimationPicker({ value, onApply }) {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/owner/scroll-animations", { withCredentials: true })
      .then((r) => setList(r.data?.data?.sequences || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const choose = async (seq) => {
    setApplying(seq.id);
    try {
      const res = await axios.get(`/api/owner/scroll-animations/${seq.id}`, { withCredentials: true });
      const full = res.data?.data;
      if (!full?.frames?.length) throw new Error("That animation has no frames");
      onApply({
        renderMode: "frames",
        animationId: full.id,
        frames: full.frames,
        frameCount: String(full.frameCount),
        frameWidth: String(full.width || ""),
        framesId: "",
      });
      toast.success(`${full.frameCount} frames applied`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || "Could not apply that animation");
    } finally {
      setApplying("");
    }
  };

  const clear = () =>
    onApply({ renderMode: "video", animationId: "", frames: [], frameCount: "" });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <Clapperboard size={14} className="text-fuchsia-600" />
        <span className="text-xs font-medium text-gray-700">Scroll animation</span>
        <button onClick={load} className="ml-auto p-1 rounded hover:bg-gray-200 text-gray-500" title="Refresh">
          <RefreshCw size={12} />
        </button>
        <Link href="/owner/scroll-animations" target="_blank" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
          Manage <ExternalLink size={10} />
        </Link>
      </div>

      <div className="p-3 space-y-2">
        {loading ? (
          <div className="py-6 flex items-center justify-center text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin mr-2" /> Loading animations…
          </div>
        ) : !list?.length ? (
          <p className="py-5 text-center text-xs text-gray-400">
            No scroll animations yet.{" "}
            <Link href="/owner/scroll-animations" target="_blank" className="text-blue-600 hover:underline">
              Create one
            </Link>{" "}
            from a video, a ZIP of frames, or a set of images.
          </p>
        ) : (
          list.map((s) => {
            const active = value === s.id;
            const ready = s.status === "READY";
            return (
              <button
                key={s.id}
                type="button"
                disabled={!ready || applying === s.id}
                onClick={() => choose(s)}
                className={`w-full flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                  active ? "border-fuchsia-400 bg-fuchsia-50" : ready ? "border-gray-200 hover:border-blue-400" : "border-gray-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="w-14 h-10 shrink-0 rounded bg-gray-900 overflow-hidden">
                  {s.poster ? <img src={s.poster} alt="" className="w-full h-full object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-gray-800 truncate">{s.name}</span>
                  <span className="block text-[11px] text-gray-400">
                    {s.frameCount} frames · {s.width}×{s.height} · {formatBytes(s.bytes)}
                    {s.missingFrames?.length ? ` · ${s.missingFrames.length} missing` : ""}
                  </span>
                </span>
                {!ready ? <AlertTriangle size={13} className="text-amber-500 shrink-0" /> : null}
                {applying === s.id ? <Loader2 size={13} className="animate-spin text-gray-400" /> : null}
                {active ? <span className="shrink-0 text-[10px] font-semibold text-fuchsia-700">in use</span> : null}
              </button>
            );
          })
        )}

        {value ? (
          <button type="button" onClick={clear} className="text-[11px] text-red-500 hover:underline">
            Detach and go back to the video source
          </button>
        ) : null}
      </div>
    </div>
  );
}
