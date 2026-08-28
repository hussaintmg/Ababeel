"use client";

/**
 * Scroll Animations — create a frame sequence from a video, a ZIP of frames, or
 * a pile of individual images, and manage the ones that exist.
 *
 * All three tabs post to the same endpoint and produce the same kind of
 * sequence; which one is usable depends on what the server can do, which the
 * capability bar states up front.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { uploadInChunks, uploadFiles } from "@/lib/cms/chunkedUpload";
import Link from "next/link";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, FileArchive, Images, Loader2, Trash2, AlertTriangle, ArrowLeft,
  Upload, X, CheckCircle2, RefreshCw, Clapperboard,
} from "lucide-react";
import CapabilityBar from "@/Components/owner/cms/scroll/CapabilityBar";

const TABS = [
  { id: "video", label: "Video Upload", icon: Film },
  { id: "zip", label: "ZIP Frames", icon: FileArchive },
  { id: "frames", label: "Multiple Frames", icon: Images },
];

function formatBytes(n) {
  if (!n) return "—";
  const mb = n / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

/* ------------------------------------------------------------------ *
 * a drop zone that also opens a file picker
 * ------------------------------------------------------------------ */
function DropZone({ accept, multiple, onFiles, children, disabled }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        disabled
          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
          : over
          ? "border-blue-500 bg-blue-50 cursor-pointer"
          : "border-gray-300 hover:border-blue-400 cursor-pointer"
      }`}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * workbench
 * ------------------------------------------------------------------ */
export default function ScrollAnimationsWorkbench() {
  const [tab, setTab] = useState("video");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [stage, setStage] = useState("");

  const [name, setName] = useState("");
  const [video, setVideo] = useState(null);
  const [zip, setZip] = useState(null);
  const [frames, setFrames] = useState([]);

  const [fpsMode, setFpsMode] = useState("30");
  const [customFps, setCustomFps] = useState("12");
  const [targetFrames, setTargetFrames] = useState("120");
  const [width, setWidth] = useState("1280");

  const load = useCallback(async () => {
    try {
      const res = await axios.get("/api/owner/scroll-animations", { withCredentials: true });
      setData(res.data?.data || null);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not load scroll animations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const caps = data?.capabilities;
  const options = data?.options;
  const sequences = data?.sequences || [];

  // Warn about gaps before anything is uploaded, using the filenames alone.
  const frameGaps = useMemo(() => {
    if (!frames.length) return { missing: [], numbers: 0 };
    const nums = frames
      .map((f) => {
        const stem = f.name.replace(/\.[a-z0-9]+$/i, "");
        const m = stem.match(/\d+/g);
        return m ? parseInt(m[m.length - 1], 10) : null;
      })
      .filter((n) => n !== null)
      .sort((a, b) => a - b);
    if (nums.length < 2) return { missing: [], numbers: nums.length };
    const missing = [];
    for (let i = nums[0]; i <= nums[nums.length - 1]; i++) {
      if (!nums.includes(i)) missing.push(i);
      if (missing.length > 50) break;
    }
    return { missing, numbers: nums.length };
  }, [frames]);

  const submit = async () => {
    if (tab === "video" && !video) return toast.info("Choose a video first.");
    if (tab === "zip" && !zip) return toast.info("Choose a ZIP first.");
    if (tab === "frames" && !frames.length) return toast.info("Choose some frames first.");

    setBusy(true);
    setUploadPct(0);
    setStage("Uploading");
    try {
      // The file goes up in pieces first. Sending it whole worked only for the
      // smallest archives: past the request body limit the server got a
      // truncated stream and answered "Failed to parse body as FormData".
      let uploadId;
      if (tab === "frames") {
        uploadId = await uploadFiles(frames, setUploadPct);
      } else {
        uploadId = await uploadInChunks(tab === "video" ? video : zip, setUploadPct);
      }

      setStage("Processing on the server");
      const form = new FormData();
      form.append("source", tab);
      form.append("name", name.trim() || "Untitled animation");
      form.append("width", width);
      form.append("uploadId", uploadId);
      if (tab === "video") {
        form.append("fpsMode", fpsMode);
        form.append("customFps", customFps);
        form.append("targetFrames", targetFrames);
      }

      const res = await axios.post("/api/owner/scroll-animations", form, {
        withCredentials: true,
      });
      const seq = res.data?.data;
      if (res.data?.ok === false) {
        toast.error(seq?.error || "Processing failed");
      } else {
        toast.success(`${seq.frameCount} frames ready (${formatBytes(seq.bytes)})`);
        if (seq.missingFrames?.length) {
          toast.warn(`Missing frame numbers: ${seq.missingFrames.slice(0, 10).join(", ")}${seq.missingFrames.length > 10 ? "…" : ""}`);
        }
        setName("");
        setVideo(null);
        setZip(null);
        setFrames([]);
      }
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Upload failed");
    } finally {
      setBusy(false);
      setUploadPct(0);
      setStage("");
    }
  };

  const remove = async (seq) => {
    if (!window.confirm(`Delete "${seq.name}" and its ${seq.frameCount} frames?`)) return;
    try {
      await axios.delete(`/api/owner/scroll-animations/${seq.id}`, { withCredentials: true });
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not delete");
    }
  };

  const videoDisabled = caps && !caps.ffmpegAvailable;

  return (
    <div className="pb-16 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/owner/cms" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Website CMS
        </Link>
        <div className="h-5 w-px bg-gray-200" />
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clapperboard size={18} className="text-fuchsia-600" /> Scroll Animations
          </h1>
          <p className="text-xs text-gray-400">
            Frame sequences that play as the visitor scrolls. Build one from a video, a ZIP of frames, or individual images.
          </p>
        </div>
      </div>

      <div className="mb-5">
        {loading ? <div className="h-24 rounded-xl cms-skeleton" /> : <CapabilityBar capabilities={caps} />}
      </div>

      {/* ---------------- create ---------------- */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        <div className="flex border-b border-gray-100">
          {TABS.map((t) => {
            const disabled = t.id === "video" && videoDisabled;
            return (
              <button
                key={t.id}
                onClick={() => !disabled && setTab(t.id)}
                disabled={disabled}
                title={disabled ? caps?.ffmpegReason : ""}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t.id ? "bg-gray-900 text-white" : disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <t.icon size={15} /> {t.label}
                {disabled ? <AlertTriangle size={12} className="text-amber-400" /> : null}
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Car Reveal"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {tab === "video" ? (
            <>
              <DropZone accept="video/mp4,video/quicktime,video/webm" onFiles={(f) => setVideo(f[0] || null)} disabled={busy || videoDisabled}>
                <Film size={26} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-700">{video ? video.name : "Drop a video here, or click to choose"}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  MP4 / MOV / WEBM · up to {options?.maxVideoSizeMb || 500} MB
                </p>
              </DropZone>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Frame rate</label>
                  <select
                    value={fpsMode}
                    onChange={(e) => setFpsMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                  >
                    {(options?.fpsModes || []).map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                {fpsMode === "custom" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Custom fps</label>
                    <input value={customFps} onChange={(e) => setCustomFps(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                ) : null}
                {fpsMode === "target" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target frames</label>
                    <input value={targetFrames} onChange={(e) => setTargetFrames(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                ) : null}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Frame width</label>
                  <select value={width} onChange={(e) => setWidth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                    {(options?.resolutions || []).map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          {tab === "zip" ? (
            <>
              <DropZone accept=".zip,application/zip" onFiles={(f) => setZip(f[0] || null)} disabled={busy}>
                <FileArchive size={26} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-700">{zip ? `${zip.name} · ${formatBytes(zip.size)}` : "Drop a frame ZIP here, or click to choose"}</p>
                <p className="text-[11px] text-gray-400 mt-1">frame-0001.jpg, frame-0002.jpg … · non-images are ignored</p>
              </DropZone>
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Frame width</label>
                <select value={width} onChange={(e) => setWidth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                  {(options?.resolutions || []).map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {tab === "frames" ? (
            <>
              <DropZone accept="image/jpeg,image/png,image/webp" multiple onFiles={(f) => setFrames((prev) => [...prev, ...f])} disabled={busy}>
                <Images size={26} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-700">Drop frames here, or click to select hundreds of images</p>
                <p className="text-[11px] text-gray-400 mt-1">JPG / PNG / WebP · sorted numerically, not alphabetically</p>
              </DropZone>

              {frames.length ? (
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-800">Selected: {frames.length} frames</span>
                    <button onClick={() => setFrames([])} className="ml-auto text-xs text-red-500 hover:underline">Clear</button>
                  </div>
                  {frameGaps.missing.length ? (
                    <p className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
                      <AlertTriangle size={11} className="inline mr-1" />
                      Frame sequence contains missing frames: {frameGaps.missing.slice(0, 20).join(", ")}
                      {frameGaps.missing.length > 20 ? "…" : ""}. You can continue anyway — the animation will simply skip them.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {frames.slice(0, 60).map((f, i) => (
                      <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                        {f.name}
                        <button onClick={() => setFrames((prev) => prev.filter((_, x) => x !== i))} className="text-gray-400 hover:text-red-500">
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                    {frames.length > 60 ? <span className="text-[10px] text-gray-400 px-1.5 py-0.5">+{frames.length - 60} more</span> : null}
                  </div>
                </div>
              ) : null}

              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Frame width</label>
                <select value={width} onChange={(e) => setWidth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                  {(options?.resolutions || []).map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {busy ? (
            <div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-blue-600 transition-[width]" style={{ width: `${uploadPct || 4}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">
                {stage}
                {uploadPct > 0 && uploadPct < 100 ? ` · ${uploadPct}%` : ""}
                {uploadPct >= 100 ? " — extracting frames, optimizing images and saving the sequence. This can take a minute." : ""}
              </p>
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Create Sequence
          </button>
        </div>
      </div>

      {/* ---------------- existing ---------------- */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Your animations</h2>
        <span className="text-xs text-gray-400">{sequences.length}</span>
        <button onClick={load} className="ml-auto p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl cms-skeleton" />)}</div>
      ) : sequences.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sequences.map((s) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-stretch">
                <div className="w-28 shrink-0 bg-gray-900">
                  {s.poster ? <img src={s.poster} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0 p-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 truncate">{s.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      s.status === "READY" ? "bg-emerald-50 text-emerald-700"
                        : s.status === "FAILED" ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {s.sourceType} · {s.frameCount} frames · {s.width}×{s.height} · {formatBytes(s.bytes)}
                    {s.fps ? ` · ${s.fps.toFixed(1)} fps` : ""}
                  </p>
                  {s.missingFrames?.length ? (
                    <p className="mt-1 text-[11px] text-amber-700">
                      <AlertTriangle size={10} className="inline mr-0.5" /> Missing frames: {s.missingFrames.slice(0, 8).join(", ")}
                      {s.missingFrames.length > 8 ? "…" : ""}
                    </p>
                  ) : null}
                  {s.error ? <p className="mt-1 text-[11px] text-red-600">{s.error}</p> : null}
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-[10px] font-mono text-gray-400 truncate">{s.id}</code>
                    <button onClick={() => { navigator.clipboard?.writeText(s.id); toast.success("Animation id copied"); }} className="text-[11px] text-blue-600 hover:underline">
                      Copy id
                    </button>
                    <button onClick={() => remove(s)} className="ml-auto p-1 rounded hover:bg-red-50 text-red-500" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          No scroll animations yet. Create one above, then pick it in a Scroll Video block.
        </p>
      )}
    </div>
  );
}
