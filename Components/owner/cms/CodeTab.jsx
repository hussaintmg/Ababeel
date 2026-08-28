"use client";

/**
 * The HTML behind a section.
 *
 * The markup shown here is not a guess at what the block might render — it is
 * read back out of the live preview, so it is exactly what a visitor gets,
 * variables already resolved.
 *
 * Two directions, and they are not symmetrical, so the UI says which is which:
 *
 *   designer → HTML   always available: look, copy, take it elsewhere.
 *   HTML → designer   only by switching the section to Custom HTML. From that
 *                     point the HTML *is* the section: edits show in the
 *                     preview immediately and it saves like any other block.
 *
 * There is no third option where arbitrary HTML is parsed back into a Hero or
 * a Card Grid. A card grid is a list of cards with a column count; HTML is a
 * tree of tags. Text that claimed to round-trip would quietly lose settings on
 * the way back, so switching is offered as a deliberate one-way step instead.
 */

import { useEffect, useMemo, useState } from "react";
import { Code2, Copy, Check, ArrowRightLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { formatHtml } from "@/lib/cms/formatHtml";
import { BLOCK_TYPES } from "@/Components/cms/blockSchemas";

/** Pull one block's markup out of the preview document. */
function readBlockHtml(doc, blockId) {
  if (!doc || !blockId) return "";
  const el = doc.querySelector(`[data-cms-id="${CSS.escape(blockId)}"]`);
  return el ? el.outerHTML : "";
}

export default function CodeTab({ block, onChange, previewDoc }) {
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);
  const isCustom = block.type === "customCode";

  const html = useMemo(
    () => (isCustom ? String(block.props?.html || "") : formatHtml(readBlockHtml(previewDoc, block.id))),
    // `tick` is the manual refresh; the preview updates on its own schedule and
    // there is nothing to subscribe to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewDoc, block.id, block.props, block._style, isCustom, tick]
  );

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
    } catch {
      /* clipboard blocked — the textarea is selectable, which is the fallback */
    }
  };

  /** Freeze the section as its own HTML, from here on edited as text. */
  const convert = () => {
    const source = html || formatHtml(readBlockHtml(previewDoc, block.id));
    if (!source) return;
    onChange({
      ...block,
      type: "customCode",
      props: { ...BLOCK_TYPES.customCode.defaults, html: source, tailwind: true },
      // Wrapper styling already baked into the markup; keeping it would apply
      // the padding and background a second time.
      _style: { ...(block._style || {}), bgColor: "", bgImage: "", paddingY: "", paddingX: "" },
    });
  };

  if (isCustom) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          This section <strong>is</strong> its HTML — edit it here and the preview follows on the next
          keystroke. Tailwind utility classes work.
        </p>
        <textarea
          value={block.props?.html || ""}
          onChange={(e) => onChange({ ...block, props: { ...block.props, html: e.target.value } })}
          rows={22}
          spellCheck={false}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[11px] leading-relaxed font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={block.props?.tailwind !== false}
              onChange={(e) => onChange({ ...block, props: { ...block.props, tailwind: e.target.checked } })}
            />
            Tailwind classes
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500 flex-1">
          The markup this section renders right now, straight from the preview — variables already
          filled in.
        </p>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          title="Re-read from the preview"
          className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          <RefreshCw size={13} />
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50"
        >
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {html ? (
        <textarea
          value={html}
          readOnly
          rows={20}
          spellCheck={false}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] leading-relaxed font-mono bg-gray-50 text-gray-700 outline-none"
        />
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-400">
          Scroll this section into view in the preview, then press refresh.
        </p>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
          <ArrowRightLeft size={13} /> Edit this HTML directly
        </p>
        <p className="mt-1 text-[11px] text-amber-800/90">
          Switches the section to <strong>Custom HTML</strong>. The markup above becomes the section
          and stays editable here, with the preview following every keystroke. The {BLOCK_TYPES[block.type]?.label || block.type}{" "}
          fields go away, and it is a one-way change — undo it by deleting the section and adding a
          fresh one, so make the switch when the visual settings have nothing left to give.
        </p>
        <button
          type="button"
          onClick={convert}
          disabled={!html}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-40"
        >
          <Code2 size={13} /> Switch to Custom HTML
        </button>
      </div>

      {!previewDoc ? (
        <p className="inline-flex items-start gap-1.5 text-[11px] text-gray-400">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          Waiting for the preview to finish loading.
        </p>
      ) : null}
    </div>
  );
}
