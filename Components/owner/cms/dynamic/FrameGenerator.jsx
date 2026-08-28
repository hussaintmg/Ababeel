"use client";

/**
 * Turns the block's video into a scroll frame sequence.
 *
 * Two routes to the same result, picked automatically:
 *  - the server runs ffmpeg, when it has it (fast, best quality);
 *  - otherwise the browser does it — seek, draw to a canvas, encode to WebP,
 *    upload in batches — so the feature also works on hosts without ffmpeg.
 */
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Clapperboard, Loader2, Trash2, Info } from "lucide-react";
import { Label } from "@/Components/owner/cms/fields";

const BATCH = 6;

function formatBytes(n) {
  if (!n) return "—";
  const mb = n / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

function seek(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Could not seek the video"));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

/** Extract in the browser when the server has no ffmpeg. */
async function extractInBrowser(src, count, width, onProgress) {
  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("This browser cannot decode the video"));
  });
  if (!video.duration || !video.videoWidth) throw new Error("The video has no readable duration");

  const w = Math.min(width, video.videoWidth);
  const h = Math.round((w * video.videoHeight) / video.videoWidth / 2) * 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const begin = await axios.post(
    "/api/owner/cms/frames",
    { action: "begin", width: w, height: h, count, src },
    { withCredentials: true }
  );
  const id = begin.data?.data?.id;
  if (!id) throw new Error("Could not start a frame sequence");

  let batch = new FormData();
  batch.append("id", id);
  let inBatch = 0;

  const flush = async () => {
    if (!inBatch) return;
    await axios.put("/api/owner/cms/frames", batch, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    batch = new FormData();
    batch.append("id", id);
    inBatch = 0;
  };

  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * Math.max(video.duration - 0.05, 0);
    await seek(video, t);
    ctx.drawImage(video, 0, 0, w, h);
    // eslint-disable-next-line no-await-in-loop
    const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.72));
    if (blob) {
      batch.append(`frame_${i}`, blob, `${i}.webp`);
      inBatch += 1;
    }
    if (inBatch >= BATCH) await flush();
    onProgress((i + 1) / count);
  }
  await flush();

  const done = await axios.post(
    "/api/owner/cms/frames",
    { action: "finish", id, width: w, height: h, duration: video.duration, src },
    { withCredentials: true }
  );
  return done.data?.data;
}

export default function FrameGenerator({ props, onApply }) {
  const [caps, setCaps] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(props.frameCount || 120);
  const [width, setWidth] = useState(props.frameWidth || 1280);
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    axios
      .get("/api/owner/cms/frames", { withCredentials: true })
      .then((r) => setCaps(r.data?.data || null))
      .catch(() => setCaps({ ffmpeg: false }));
  }, []);

  useEffect(() => {
    if (!props.framesId) {
      setManifest(null);
      return;
    }
    axios
      .get(`/api/owner/cms/frames?id=${encodeURIComponent(props.framesId)}`, { withCredentials: true })
      .then((r) => setManifest(r.data?.data || null))
      .catch(() => setManifest(null));
  }, [props.framesId]);

  const generate = useCallback(async () => {
    if (!props.src) {
      toast.info("Choose a video first.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      let result;
      if (caps?.ffmpeg) {
        const res = await axios.post(
          "/api/owner/cms/frames",
          { src: props.src, count, width },
          { withCredentials: true }
        );
        result = res.data?.data;
      } else {
        result = await extractInBrowser(props.src, Number(count), Number(width), setProgress);
      }
      if (!result?.id) throw new Error("No frames were produced");
      setManifest(result);
      onApply({
        renderMode: "frames",
        framesId: result.id,
        frameCount: String(result.count),
        frameExt: result.ext || "webp",
        frameWidth: String(result.width || width),
      });
      toast.success(`${result.count} frames ready (${formatBytes(result.bytes)})`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || "Frame generation failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, [props.src, caps, count, width, onApply]);

  const remove = async () => {
    if (!props.framesId) return;
    try {
      await axios.delete(`/api/owner/cms/frames?id=${encodeURIComponent(props.framesId)}`, { withCredentials: true });
    } catch {
      /* already gone — clearing the block is what matters */
    }
    onApply({ renderMode: "video", framesId: "", frameCount: "", frameWidth: String(width) });
    setManifest(null);
    toast.success("Frame sequence removed");
  };

  const estimateMb = ((Number(count) * Number(width) * 0.021) / 1024).toFixed(1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <Clapperboard size={14} className="text-fuchsia-600" />
        <span className="text-xs font-medium text-gray-700">Frame sequence</span>
        {props.renderMode === "frames" && props.framesId ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            active · {props.frameCount} frames{manifest?.bytes ? ` · ${formatBytes(manifest.bytes)}` : ""}
          </span>
        ) : (
          <span className="ml-auto text-[11px] text-gray-400">not generated</span>
        )}
      </div>

      <div className="p-3 space-y-3">
        <p className="flex items-start gap-1.5 text-[11px] text-gray-500">
          <Info size={12} className="mt-0.5 shrink-0" />
          Scrubbing a video makes the browser decode on every scroll step, which is what makes it lag.
          Frames are drawn straight to a canvas, so the picture follows the scroll exactly — the trade is
          a one-off download of roughly {estimateMb} MB.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Frames</Label>
            <input
              type="number"
              min={12}
              max={240}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-[10px] text-gray-400">More frames = smoother, heavier. 90–150 suits most clips.</p>
          </div>
          <div>
            <Label>Frame width (px)</Label>
            <input
              type="number"
              min={320}
              max={1920}
              step={80}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-[10px] text-gray-400">1280 is plenty for a full-bleed section.</p>
          </div>
        </div>

        {busy && progress > 0 ? (
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-fuchsia-500 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={busy || !props.src}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Clapperboard size={13} />}
            {busy ? `Generating… ${Math.round(progress * 100) || ""}${progress ? "%" : ""}` : props.framesId ? "Regenerate frames" : "Generate frames"}
          </button>
          {props.framesId ? (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={13} /> Remove &amp; use the video
            </button>
          ) : null}
          {caps ? (
            <span className="text-[11px] text-gray-400">
              {caps.ffmpeg ? "extracted on the server" : "extracted in your browser (server has no ffmpeg)"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
