"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Plus, Save, Trash2, Copy, ChevronUp, ChevronDown, ChevronRight,
  Eye, EyeOff, Loader2, ArrowLeft, ExternalLink, Code2, X, GripVertical,
  LayoutTemplate, Sparkles, Heading, Type, Image as ImageIcon, LayoutGrid,
  BarChart3, HelpCircle, Columns3, MousePointerClick, Megaphone, MoveVertical,
  GalleryHorizontal, Images, Quote, BadgeDollarSign, Building2, UsersRound, Video,
  Bookmark, Star,
} from "lucide-react";
import { BLOCK_TYPE_LIST, BLOCK_TYPES, createBlock } from "@/Components/cms/blockSchemas";
import { TEMPLATES, TEMPLATE_CATEGORIES, createBlocksFromTemplate } from "@/Components/cms/templates";
import { loadCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from "@/Components/cms/customTemplates";
import BlockEditor from "@/Components/owner/cms/BlockEditor";
import BlockRenderer from "@/Components/cms/BlockRenderer";

const ICONS = {
  Sparkles, Heading, Type, Image: ImageIcon, LayoutGrid, BarChart3,
  HelpCircle, Columns3, MousePointerClick, Megaphone, MoveVertical,
  GalleryHorizontal, Images, Quote, BadgeDollarSign, Building2, UsersRound, Video, Code2,
};

/* ---------------- single draggable block card ---------------- */
function BlockCard({ block, index, total, expanded, onToggle, onChange, onMove, onDuplicate, onRemove }) {
  const controls = useDragControls();
  const def = BLOCK_TYPES[block.type] || {};
  const Icon = ICONS[def.icon] || Type;

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-1.5 px-2.5 py-2.5 bg-gray-50 border-b border-gray-100">
        <button
          onPointerDown={(e) => controls.start(e)}
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <button onClick={onToggle} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <ChevronRight size={16} className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon size={15} />
          </span>
          <span className="font-medium text-sm text-gray-800 truncate">{def.label || block.type}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30" title="Move up">
            <ChevronUp size={15} />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30" title="Move down">
            <ChevronDown size={15} />
          </button>
          <button onClick={onDuplicate} className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title="Duplicate">
            <Copy size={14} />
          </button>
          <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-100 text-red-500" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-4">
              <BlockEditor block={block} onChange={onChange} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export default function PageBuilder({ pageKey, meta }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [customCss, setCustomCss] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState(meta?.title || "");
  const [showInNav, setShowInNav] = useState(false);
  const [navLabel, setNavLabel] = useState("");
  const isCustom = !!meta?.isCustom;
  const [expandedId, setExpandedId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCss, setShowCss] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const route = meta?.route || "/";

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
  }, []);

  useEffect(() => {
    let alive = true;
    axios
      .get(`/api/owner/cms/${pageKey}`, { withCredentials: true })
      .then((res) => {
        if (!alive) return;
        const d = res.data?.data;
        if (d) {
          setBlocks(Array.isArray(d.blocks) ? d.blocks : []);
          setCustomCss(d.customCss || "");
          setEnabled(!!d.enabled);
          setTitle(d.title || meta?.title || "");
          setShowInNav(!!d.showInNav);
          setNavLabel(d.navLabel || d.title || meta?.title || "");
        }
      })
      .catch(() => toast.error("Failed to load page content"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [pageKey]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { title, blocks, customCss, enabled };
      if (isCustom) {
        payload.showInNav = showInNav;
        payload.navLabel = navLabel;
      }
      await axios.put(`/api/owner/cms/${pageKey}`, payload, { withCredentials: true });
      toast.success("Saved successfully");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type) => {
    const bl = createBlock(type);
    setBlocks((prev) => [...prev, bl]);
    setExpandedId(bl.id);
    setShowPalette(false);
  };
  const insertTemplate = (tpl) => {
    const newBlocks = createBlocksFromTemplate(tpl);
    setBlocks((prev) => [...prev, ...newBlocks]);
    setShowTemplates(false);
    toast.success(`Added "${tpl.name}"`);
  };
  const saveAsTemplate = () => {
    if (!blocks.length) {
      toast.info("Add some blocks first, then save them as a template.");
      return;
    }
    const name = window.prompt("Name this template (it will appear under “My Templates”):", title || meta?.title || "My template");
    if (!name) return;
    saveCustomTemplate(name, blocks);
    setCustomTemplates(loadCustomTemplates());
    toast.success(`Saved "${name}" to My Templates`);
  };
  const removeCustomTemplate = (id) => {
    setCustomTemplates(deleteCustomTemplate(id));
    toast.success("Template deleted");
  };
  const updateBlock = (id, next) => setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)));
  const removeBlock = (id) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const duplicateBlock = (id) =>
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...structuredClone(prev[idx]), id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}` };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  const move = (id, dir) =>
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading editor…
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Toolbar */}
      <div className="sticky top-16 md:top-20 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white/90 backdrop-blur border-b border-gray-200 flex flex-wrap items-center gap-3">
        <Link href="/owner/cms" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> All Pages
        </Link>
        <div className="h-5 w-px bg-gray-200" />
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-900 truncate">{meta?.title || pageKey}</h1>
          <p className="text-xs text-gray-400">{route}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEnabled((e) => !e)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
            title="When published, this CMS content replaces the built-in page"
          >
            {enabled ? <Eye size={15} /> : <EyeOff size={15} />}
            {enabled ? "Published" : "Draft"}
          </button>
          <Link href={route} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            <ExternalLink size={15} /> View
          </Link>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save
          </button>
        </div>
      </div>

      {!enabled ? (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
          {isCustom ? (
            <>This page is <b>Disabled</b> — visiting <b>{route}</b> shows a 404. Switch to <b>Published</b> and Save to make it live.</>
          ) : (
            <>This page is in <b>Draft</b>. The live site still shows the built-in content. Switch to <b>Published</b> and Save to make your CMS content live.</>
          )}
        </div>
      ) : null}

      {isCustom ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowInNav((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showInNav ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showInNav ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">Show in site menu</span>
          </div>
          {showInNav ? (
            <div className="flex items-center gap-2 sm:ml-2 flex-1 min-w-0">
              <span className="text-xs text-gray-500 whitespace-nowrap">Menu label</span>
              <input
                value={navLabel}
                onChange={(e) => setNavLabel(e.target.value)}
                placeholder={title || "Menu label"}
                className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <span className="text-xs text-gray-400">When on (and Published), this page appears in the topbar &amp; footer menus.</span>
          )}
        </div>
      ) : null}

      {/* Add / Templates buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
          <LayoutTemplate size={17} /> Browse Templates
        </button>
        <button onClick={() => setShowPalette(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors">
          <Plus size={17} /> Add Single Block
        </button>
        <button onClick={saveAsTemplate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:border-amber-400 hover:text-amber-600 transition-colors" title="Save the current blocks as a reusable template">
          <Bookmark size={17} /> Save as Template
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-6">
        {/* Editor column */}
        <div>
          {blocks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
              No blocks yet. Use <b>Browse Templates</b> for ready-made designs, or add a single block.
            </div>
          ) : (
            <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-3">
              {blocks.map((block, i) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  index={i}
                  total={blocks.length}
                  expanded={expandedId === block.id}
                  onToggle={() => setExpandedId(expandedId === block.id ? null : block.id)}
                  onChange={(next) => updateBlock(block.id, next)}
                  onMove={(dir) => move(block.id, dir)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onRemove={() => removeBlock(block.id)}
                />
              ))}
            </Reorder.Group>
          )}

          {/* Custom CSS */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button onClick={() => setShowCss((s) => !s)} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Code2 size={16} className="text-gray-400" /> Custom CSS for this page
              <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${showCss ? "rotate-180" : ""}`} />
            </button>
            {showCss ? (
              <div className="px-4 pb-4">
                <textarea value={customCss} onChange={(e) => setCustomCss(e.target.value)} rows={8} spellCheck={false} placeholder={`.my-section h2 { color: #2563eb; }`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="mt-1.5 text-xs text-gray-400">Target blocks with the CSS class / anchor id set in each block&apos;s Design tab.</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Live preview column */}
        <div className="xl:sticky xl:top-36 xl:self-start">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400">Live preview {route}</span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto bg-white">
              {customCss ? <style dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
              {blocks.length ? <BlockRenderer blocks={blocks} /> : <div className="py-24 text-center text-gray-300 text-sm">Preview appears here</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Single-block palette modal */}
      <AnimatePresence>
        {showPalette ? (
          <Modal onClose={() => setShowPalette(false)} title="Add a block">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
              {BLOCK_TYPE_LIST.map((bl) => {
                const Icon = ICONS[bl.icon] || Type;
                return (
                  <button key={bl.type} onClick={() => addBlock(bl.type)} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 text-left hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                    <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon size={17} /></span>
                    <span className="min-w-0">
                      <span className="block font-medium text-sm text-gray-800">{bl.label}</span>
                      <span className="block text-xs text-gray-500">{bl.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>

      {/* Templates gallery modal */}
      <AnimatePresence>
        {showTemplates ? <TemplatesModal onClose={() => setShowTemplates(false)} onInsert={insertTemplate} customTemplates={customTemplates} onDeleteCustom={removeCustomTemplate} /> : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- modal shell ---------------- */
function Modal({ title, onClose, children, wide }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className={`w-full ${wide ? "max-w-5xl" : "max-w-2xl"} bg-white rounded-2xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------------- templates gallery ---------------- */
function TemplatesModal({ onClose, onInsert, customTemplates = [], onDeleteCustom }) {
  const hasCustom = customTemplates.length > 0;
  const categories = hasCustom ? ["My Templates", ...TEMPLATE_CATEGORIES] : TEMPLATE_CATEGORIES;
  const [cat, setCat] = useState(categories[0]);
  const all = hasCustom ? [...customTemplates, ...TEMPLATES] : TEMPLATES;
  const list = all.filter((t) => t.category === cat);
  return (
    <Modal title={`Templates (${all.length})`} onClose={onClose} wide>
      <div className="grid grid-cols-1 sm:grid-cols-[190px_minmax(0,1fr)]">
        <div className="border-r border-gray-100 p-2 sm:max-h-[65vh] overflow-y-auto flex sm:block gap-1 overflow-x-auto">
          {categories.map((c) => {
            const n = all.filter((t) => t.category === c).length;
            if (!n) return null;
            const isMine = c === "My Templates";
            return (
              <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap sm:w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${cat === c ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {isMine ? <Star size={13} className={cat === c ? "text-amber-200" : "text-amber-400"} /> : null}
                {c} <span className={`text-xs ${cat === c ? "text-blue-100" : "text-gray-400"}`}>({n})</span>
              </button>
            );
          })}
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[72vh] overflow-y-auto content-start">
          {cat === "My Templates" && !list.length ? (
            <div className="col-span-full py-16 text-center text-gray-400 text-sm">
              No saved templates yet. Design a section, then click <b>Save as Template</b>.
            </div>
          ) : null}
          {list.map((t) => (
            <div key={t.id} className="group flex flex-col rounded-xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all bg-white">
              {/* Live scaled preview — 40% of the popup (viewport) height */}
              <div className="relative h-[40vh] bg-white border-b border-gray-100 overflow-hidden">
                <TemplatePreview template={t} />
                {t.custom ? (
                  <button onClick={() => onDeleteCustom?.(t.id)} title="Delete template" className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-white shadow-sm">
                    <Trash2 size={13} />
                  </button>
                ) : null}
                {/* hover overlay with a quick insert */}
                <button
                  onClick={() => onInsert(t)}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-blue-600/0 group-hover:bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Insert this template"
                >
                  <span className="px-4 py-2 rounded-lg bg-white text-blue-700 text-xs font-semibold shadow-lg">+ Insert</span>
                </button>
              </div>
              {/* Footer — always visible */}
              <div className="flex items-center justify-between gap-2 p-3 mt-auto">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{t.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.desc}</p>
                </div>
                <button onClick={() => onInsert(t)} className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// Live, scaled-down snapshot of a template's actual rendered blocks. Rendered at
// full width inside a fixed box then scaled to fit, so the thumbnail looks like
// the real design. Interactions are disabled and animations frozen.
const PREVIEW_WIDTH = 1200; // virtual render width
function TemplatePreview({ template }) {
  // Build the blocks once, and freeze any auto-playing carousels to a static
  // first slide so the thumbnail is a calm snapshot (no perpetual timers).
  const blocks = useMemo(
    () =>
      createBlocksFromTemplate(template).map((b) =>
        b.type === "carousel"
          ? { ...b, props: { ...b.props, autoplay: false, kenBurns: false } }
          : b
      ),
    [template]
  );
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.24);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / PREVIEW_WIDTH);
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden bg-white">
      <div
        className="cms-preview pointer-events-none select-none absolute top-0 left-0 origin-top-left"
        style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})` }}
      >
        <BlockRenderer blocks={blocks} />
      </div>
    </div>
  );
}

