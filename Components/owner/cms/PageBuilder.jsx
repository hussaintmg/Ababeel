"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback, Component, Suspense } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Plus, Save, Trash2, Copy, ChevronUp, ChevronDown, ChevronRight,
  Eye, EyeOff, Loader2, ArrowLeft, ExternalLink, Code2, X, GripVertical,
  LayoutTemplate, Sparkles, Heading, Type, Image as ImageIcon, LayoutGrid,
  BarChart3, HelpCircle, Columns2, Columns3, MousePointerClick, Megaphone, MoveVertical,
  GalleryHorizontal, Images, Quote, BadgeDollarSign, Building2, UsersRound, Video,
  Bookmark, Star, Database, Repeat, Film, Bug, Play, RefreshCw, SlidersHorizontal, Globe,
  Search, Layers, Grid, List, Monitor, Tablet, Smartphone,
} from "lucide-react";
import { BLOCK_TYPE_LIST, BLOCK_TYPES, createBlock, isContainer, defaultStyle } from "@/Components/cms/blockSchemas";
import { loadCustomTemplates, saveCustomTemplate, deleteCustomTemplate, fetchRemoteCustomSections } from "@/Components/cms/customTemplates";
import { TEMPLATES, TEMPLATE_CATEGORIES, createBlocksFromTemplate } from "@/Components/cms/templates";
import SectionStudioModal from "@/Components/owner/cms/SectionStudioModal";
import BlockEditor from "@/Components/owner/cms/BlockEditor";
import BlockRenderer from "@/Components/cms/BlockRenderer";
import { CmsVariablesProvider, useCmsVariables } from "@/context/CmsVariablesContext";
import DataSourcesPanel from "@/Components/owner/cms/dynamic/DataSourcesPanel";
import DataInspector from "@/Components/owner/cms/dynamic/DataInspector";
import PreviewFrame, { DEVICES } from "@/Components/owner/cms/PreviewFrame";
import { formatHtml } from "@/lib/cms/formatHtml";
import VariablesFloatingPanel from "@/Components/owner/cms/dynamic/VariablesFloatingPanel";
import { getFeatures } from "@/lib/cms/features";
import { buildSampleContext } from "@/lib/cms/sampleData";

const ICONS = {
  Sparkles, Heading, Type, Image: ImageIcon, LayoutGrid, BarChart3,
  HelpCircle, Columns2, Columns3, MousePointerClick, Megaphone, MoveVertical,
  GalleryHorizontal, Images, Quote, BadgeDollarSign, Building2, UsersRound, Video, Code2,
  Repeat, Film, SlidersHorizontal,
};

/* ---------------- nested children (Repeat containers) ---------------- */
function ChildBlocks({ block, onChange, features, scopeHint, previewDoc, onOpenStudio }) {
  const children = Array.isArray(block.children) ? block.children : [];
  const [expandedId, setExpandedId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);

  const setChildren = (next) => onChange({ ...block, children: next });
  const add = (type) => {
    const bl = createBlock(type);
    setChildren([...children, bl]);
    setExpandedId(bl.id);
    setShowPalette(false);
  };
  const update = (id, next) => setChildren(children.map((c) => (c.id === id ? next : c)));
  const remove = (id) => setChildren(children.filter((c) => c.id !== id));
  const move = (id, dir) => {
    const i = children.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= children.length) return;
    const next = [...children];
    [next[i], next[j]] = [next[j], next[i]];
    setChildren(next);
  };

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 mb-2">
        Repeated design — rendered once per record
      </p>
      {children.length === 0 ? (
        <p className="text-xs text-gray-400 mb-2">
          Add the blocks that make up one card, then bind their properties to{" "}
          <code className="font-mono">{scopeHint}</code>.
        </p>
      ) : null}
      <div className="space-y-2">
        {children.map((child, i) => {
          const def = BLOCK_TYPES[child.type] || {};
          const Icon = ICONS[def.icon] || Type;
          const open = expandedId === child.id;
          return (
            <div key={child.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 py-2 bg-gray-50 border-b border-gray-100">
                <button onClick={() => setExpandedId(open ? null : child.id)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <ChevronRight size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                  <span className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon size={13} />
                  </span>
                  <span className="font-medium text-xs text-gray-800 truncate">{def.label || child.type}</span>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => move(child.id, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"><ChevronUp size={13} /></button>
                  <button onClick={() => move(child.id, 1)} disabled={i === children.length - 1} className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"><ChevronDown size={13} /></button>
                  <button onClick={() => remove(child.id)} className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
              {open ? (
                <div className="p-3">
                  <BlockEditor block={child} onChange={(next) => update(child.id, next)} features={features} scopeHint={scopeHint} previewDoc={previewDoc} onOpenStudio={onOpenStudio} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => setShowPalette(true)}
        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-blue-300 text-xs text-blue-600 hover:bg-blue-50"
      >
        <Plus size={14} /> Add a block inside the repeat
      </button>
      <AnimatePresence>
        {showPalette ? (
          <Modal onClose={() => setShowPalette(false)} title="Add a block inside the repeat">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
              {BLOCK_TYPE_LIST.filter((bl) => !isContainer(bl.type)).map((bl) => {
                const Icon = ICONS[bl.icon] || Type;
                return (
                  <button key={bl.type} onClick={() => add(bl.type)} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 text-left hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
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
    </div>
  );
}

class BlockEditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.warn("BlockEditor error caught by boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <span>Notice: Could not load some block settings</span>
          </div>
          <p className="font-mono text-[11px] text-amber-700 bg-white/70 p-1.5 rounded border border-amber-200 mb-2">
            {this.state.error?.message || "Render error"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-medium text-xs transition-colors"
          >
            Retry Settings
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------- single draggable block card ---------------- */
function BlockCard({ block, index, total, expanded, onToggle, onChange, onMove, onDuplicate, onRemove, features, previewDoc, onOpenStudio }) {
  const controls = useDragControls();
  const def = BLOCK_TYPES[block.type] || {};
  const Icon = ICONS[def.icon] || Type;
  const container = isContainer(block.type);
  const scopeHint = block.props?.item || "item";
  const bound = !!block._conditions?.rules?.length || !!block._repeat?.enabled || !!block._condProps?.length;

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
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <button onClick={onToggle} className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 text-left">
          <ChevronRight size={16} className={`text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon size={15} />
          </span>
          <span className="font-medium text-xs sm:text-sm text-gray-800 truncate">{def.label || block.type}</span>
          {container && block.props?.source ? (
            <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 hidden sm:inline-block">
              {block.props.source}
            </span>
          ) : null}
          {bound && !container ? (
            <span className="shrink-0 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 hidden sm:inline-block">dynamic</span>
          ) : null}
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
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
            <div className="p-4 space-y-4">
              <BlockEditorErrorBoundary>
                <BlockEditor block={block} onChange={onChange} features={features} previewDoc={previewDoc} onOpenStudio={onOpenStudio} />
              </BlockEditorErrorBoundary>
              {container ? (
                <ChildBlocks block={block} onChange={onChange} features={features} scopeHint={scopeHint} previewDoc={previewDoc} onOpenStudio={onOpenStudio} />
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export default function PageBuilder(props) {
  return (
    <CmsVariablesProvider>
      <PageBuilderInner {...props} />
    </CmsVariablesProvider>
  );
}

function PageBuilderInner({ pageKey, meta }) {
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
  const [showHtml, setShowHtml] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  // What the browser tab and a search result show for this page. Kept apart
  // from the page's CMS name, which is what the owner dashboard lists it by.
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  // Anything else already in the page's settings, so saving SEO does not
  // discard it.
  const [otherSettings, setOtherSettings] = useState({});
  const [pageHtml, setPageHtml] = useState("");
  const [customTemplates, setCustomTemplates] = useState([]);
  const route = meta?.route || "/";

  // ----- dynamic CMS state -----
  const [features, setFeatures] = useState(() => getFeatures(null));
  const [dataSources, setDataSources] = useState([]);
  const [dynamicRoute, setDynamicRoute] = useState(null);
  const [previewMode, setPreviewMode] = useState("static"); // static | live | sample
  const [previewData, setPreviewData] = useState(null);
  const [previewCatalogue, setPreviewCatalogue] = useState({});
  const [previewMeta, setPreviewMeta] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  // Which viewport the preview is rendered at. "fluid" fills the panel.
  const [device, setDevice] = useState("fluid");
  // The preview's own document, so the HTML tab can read a section's real
  // markup back out of it rather than guessing at what it renders.
  const [previewDoc, setPreviewDoc] = useState(null);
  // The frame needs a pixel height; max-h-[70vh] means nothing to an iframe.
  const [vh, setVh] = useState(900);
  useEffect(() => {
    const sync = () => setVh(window.innerHeight);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  const [showData, setShowData] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const { tree, setPageSources } = useCmsVariables();

  // Publish this page's own data sources into the variable registry, so the
  // pickers offer `{{programmeCount}}` and friends rather than leaving an
  // author to remember the names they defined on the Data panel.
  useEffect(() => {
    setPageSources(dataSources, dynamicRoute);
  }, [dataSources, dynamicRoute, setPageSources]);

  const [showStudio, setShowStudio] = useState(false);
  const [studioInitialSection, setStudioInitialSection] = useState(null);

  const openStudioForBlock = (block) => {
    setStudioInitialSection({
      sectionId: block.props?._sectionId || block.id,
      blockId: block.id,
      name: block.props?._name || "Custom Code Section",
      category: block.props?._category || "Custom Sections",
      code: block.props?._code || "",
      css: block.props?._css || "",
      fields: block.props?._fields || [],
      options: block.props?._options || {},
      props: block.props || {},
    });
    setShowStudio(true);
  };

  const openStudioNew = () => {
    setStudioInitialSection(null);
    setShowStudio(true);
  };

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
    fetchRemoteCustomSections().then((remote) => {
      if (Array.isArray(remote) && remote.length > 0) {
        setCustomTemplates(remote);
      }
    });
  }, []);

  // Feature switches come from the same global CMS settings as the rest of the
  // site configuration.
  useEffect(() => {
    let alive = true;
    axios
      .get("/api/owner/cms/global", { withCredentials: true })
      .then((res) => alive && setFeatures(getFeatures(res.data?.data?.settings)))
      .catch(() => {});
    return () => {
      alive = false;
    };
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
          const st = d.settings && typeof d.settings === "object" ? d.settings : {};
          setSeoTitle(st.seo?.title || "");
          setSeoDescription(st.seo?.description || "");
          // eslint-disable-next-line no-unused-vars
          const { seo: _seo, ...rest } = st;
          setOtherSettings(rest);
          setDataSources(Array.isArray(d.dataSources) ? d.dataSources : []);
          setDynamicRoute(d.dynamicRoute || null);
          if ((d.dataSources?.length || d.dynamicRoute?.enabled || d.blocks?.some(b => b.type?.startsWith('public_'))) && previewMode === "static") {
            setPreviewMode("live");
          }
        }
      })
      .catch(() => toast.error("Failed to load page content"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  // ----- preview data (optimized: only fetches on data source/structure change, not keystrokes) -----
  const dataSourcesKey = useMemo(() => JSON.stringify(dataSources || []), [dataSources]);
  const dynamicRouteKey = useMemo(() => JSON.stringify(dynamicRoute || {}), [dynamicRoute]);
  const catalogueTypesKey = useMemo(
    () => (blocks || []).map((b) => b.type).filter((t) => t && (t.includes("course") || t.includes("training") || t.includes("catalog"))).join(","),
    [blocks]
  );

  const loadPreviewData = useCallback(async () => {
    if (previewMode === "static") {
      setPreviewData(null);
      setPreviewMeta({});
      return;
    }
    if (previewMode === "sample") {
      setPreviewData(buildSampleContext(tree));
      setPreviewMeta({});
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await axios.post(
        "/api/owner/cms/preview/data",
        { dataSources, dynamicRoute, blocks: (blocks || []).slice(0, 50), params: {}, mode: "mixed" },
        { withCredentials: true }
      );
      setPreviewData(res.data?.data?.context || {});
      setPreviewMeta(res.data?.data?.meta || {});
      setPreviewCatalogue(res.data?.data?.catalogue || {});
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not load live data");
      setPreviewData({});
    } finally {
      setPreviewLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, dataSourcesKey, dynamicRouteKey, tree, catalogueTypesKey]);

  useEffect(() => {
    const timer = setTimeout(loadPreviewData, 400);
    return () => clearTimeout(timer);
  }, [loadPreviewData]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        blocks,
        customCss,
        enabled,
        dataSources,
        dynamicRoute,
        settings: { ...otherSettings, seo: { title: seoTitle, description: seoDescription } },
      };
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
      const cloneFn = typeof structuredClone === "function" ? structuredClone : (v) => JSON.parse(JSON.stringify(v));
      const copy = { ...cloneFn(prev[idx]), id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}` };
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
      <div className="sticky top-14 md:top-16 lg:top-20 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 sm:py-3 bg-white/95 backdrop-blur border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/owner/cms" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 shrink-0">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">All Pages</span>
          </Link>
          <div className="h-5 w-px bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{meta?.title || pageKey}</h1>
            <p className="text-xs text-gray-400 truncate">{route}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:ml-auto w-full sm:w-auto justify-end">
          {features.dynamicCms && features.liveData ? (
            <button
              onClick={() => setShowData((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${showData ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              title="Configure the data this page reads from the database"
            >
              <Database size={14} className="shrink-0" /> <span>Data</span>
              {dataSources.length ? <span className="text-[10px] rounded-full bg-blue-600 text-white px-1.5">{dataSources.length}</span> : null}
            </button>
          ) : null}
          {features.dynamicCms && features.variables ? (
            <button
              onClick={() => setShowVariables((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${showVariables ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              title="Browse and drag variables into any field"
            >
              <Sparkles size={14} className="shrink-0" /> <span>Variables</span>
            </button>
          ) : null}
          <button
            onClick={() => setEnabled((e) => !e)}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
            title="When published, this CMS content replaces the built-in page"
          >
            {enabled ? <Eye size={14} className="shrink-0" /> : <EyeOff size={14} className="shrink-0" />}
            <span>{enabled ? "Published" : "Draft"}</span>
          </button>
          <Link href={route} target="_blank" className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
            <ExternalLink size={14} className="shrink-0" /> <span>View</span>
          </Link>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin shrink-0" /> : <Save size={14} className="shrink-0" />}
            <span>Save</span>
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

      {/* Dynamic data configuration */}
      {showData && features.dynamicCms && features.liveData ? (
        <div className="mt-4">
          <DataSourcesPanel
            sources={dataSources}
            onChange={setDataSources}
            dynamicRoute={dynamicRoute}
            onDynamicRouteChange={setDynamicRoute}
            pageKey={pageKey}
            isCustom={isCustom}
          />
        </div>
      ) : null}

      {/* Add / Templates buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
          <LayoutTemplate size={17} /> Browse Sections
        </button>
        <button onClick={openStudioNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all" title="Create a custom React SDK section with code, animations & variables">
          <Code2 size={17} /> Section Studio (SDK)
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
        <div className="min-w-0">
          {blocks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
              No blocks yet. Use <b>Browse Sections</b> for ready-made designs, or add a single block.
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
                  features={features}
                  previewDoc={previewDoc}
                  onOpenStudio={openStudioForBlock}
                />
              ))}
            </Reorder.Group>
          )}

          {/* Browser tab + search result */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button onClick={() => setShowSeo((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Globe size={16} className="text-gray-400" /> Browser tab &amp; search result
              <span className="text-[11px] text-gray-400 font-normal truncate">
                {seoTitle || title || meta?.title || "using the page name"}
              </span>
              <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${showSeo ? "rotate-180" : ""}`} />
            </button>
            {showSeo ? (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || meta?.title || "Page title"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Leave it empty and the page name is used. The site template around it
                    (&ldquo;%s | Ababeel&rdquo;) is set under Global Settings.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    placeholder="One or two sentences, shown under the title in search results."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* What it will look like — the thing an author is actually
                    trying to picture. */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-[11px] text-gray-400 mb-1.5">Preview</div>
                  <div className="text-[13px] text-blue-800 truncate">
                    {(seoTitle || title || meta?.title || "Page") + " | Ababeel"}
                  </div>
                  <div className="text-[11px] text-green-700">{route}</div>
                  <div className="text-[11px] text-gray-600 line-clamp-2">
                    {seoDescription || "No description set — the site's default is used."}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Custom CSS */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button onClick={() => setShowCss((s) => !s)} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Code2 size={16} className="text-gray-400" /> Custom CSS for this page
              <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${showCss ? "rotate-180" : ""}`} />
            </button>
            {showCss ? (
              <div className="px-4 pb-4">
                <textarea value={customCss} onChange={(e) => setCustomCss(e.target.value)} rows={8} spellCheck={false} placeholder={`.my-section h2 { color: #2563eb; }`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="mt-1.5 text-xs text-gray-400">
                  Applies to the whole page. For one section only, use its Design tab — it has a CSS
                  box scoped to that section.
                </p>
              </div>
            ) : null}
          </div>

          {/* The whole page as HTML, read back out of the preview. */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button onClick={() => {
              setShowHtml((v) => {
                if (!v) setPageHtml(formatHtml(previewDoc?.body?.innerHTML || ""));
                return !v;
              });
            }} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Code2 size={16} className="text-gray-400" /> Page HTML
              <span className="text-[11px] text-gray-400 font-normal">everything the page renders</span>
              <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${showHtml ? "rotate-180" : ""}`} />
            </button>
            {showHtml ? (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-500 flex-1">
                    Read from the preview, so it is exactly what a visitor gets — variables filled in.
                    To edit a section&apos;s markup, open that section and use its HTML tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPageHtml(formatHtml(previewDoc?.body?.innerHTML || ""))}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(pageHtml).catch(() => {})}
                    disabled={!pageHtml}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  value={pageHtml}
                  readOnly
                  rows={16}
                  spellCheck={false}
                  placeholder="Press Refresh to read the page's current markup."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] leading-relaxed font-mono bg-gray-50 text-gray-700 outline-none"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Live preview column */}
        <div className="min-w-0 xl:sticky xl:top-36 xl:self-start">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400 truncate">Preview {route}</span>
              {previewLoading ? <Loader2 size={12} className="animate-spin text-gray-400" /> : null}
            </div>

            {features.dynamicCms ? (
              <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-white">
                <span className="text-[11px] text-gray-400 mr-1">Data</span>
                {[
                  { id: "static", label: "Static", enabled: true },
                  { id: "live", label: "Live Database", enabled: features.liveData },
                  { id: "sample", label: "Sample Data", enabled: true },
                ]
                  .filter((m) => m.enabled)
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPreviewMode(m.id)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${previewMode === m.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                {previewMode === "live" ? (
                  <button
                    onClick={loadPreviewData}
                    className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-500"
                    title="Refresh live data"
                  >
                    <RefreshCw size={12} />
                  </button>
                ) : null}
                {features.dataInspector ? (
                  <button
                    onClick={() => setShowInspector((v) => !v)}
                    className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${showInspector ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    <Bug size={11} /> Inspect
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-100 bg-white">
              <span className="text-[11px] text-gray-400 mr-1">Screen</span>
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  title={d.title}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${device === d.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {d.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-gray-400 tabular-nums">
                {DEVICES.find((d) => d.id === device)?.width || "auto"}
                {DEVICES.find((d) => d.id === device)?.width ? "px" : ""}
              </span>
            </div>

            {/* Rendered in an iframe so the section's own media queries answer
                to the chosen width — a narrowed div would still lay out as
                desktop. */}
            <PreviewFrame
              width={DEVICES.find((d) => d.id === device)?.width || 0}
              height={Math.round(vh * 0.7)}
              selectedBlockId={expandedId}
              onSelectBlock={(id) => setExpandedId(id)}
              onDocument={setPreviewDoc}
            >
              {customCss ? <style dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
              {blocks.length ? (
                <BlockRenderer blocks={previewMode === 'live' ? blocks.map(block => ({ ...block, props: { ...block.props, ...previewCatalogue[block.id] } })) : blocks} data={previewData} showWarnings />
              ) : (
                <div className="py-24 text-center text-gray-300 text-sm">Preview appears here</div>
              )}
            </PreviewFrame>
          </div>

          {showInspector && features.dataInspector ? (
            <div className="mt-3">
              <DataInspector context={previewData || {}} blocks={blocks} meta={previewMeta} />
            </div>
          ) : null}

        </div>
      </div>

      {/* Variables live in a floating window you can park wherever suits — it
          no longer pushes the live preview down the page. */}
      {features.variables ? (
        <VariablesFloatingPanel open={showVariables} onClose={() => setShowVariables(false)} />
      ) : null}

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
        {showTemplates ? (
          <TemplatesModal
            onClose={() => setShowTemplates(false)}
            onInsert={insertTemplate}
            customTemplates={customTemplates}
            onDeleteCustom={removeCustomTemplate}
            onOpenStudio={() => {
              setShowTemplates(false);
              openStudioNew();
            }}
            onEditSdkSection={(block) => {
              setShowTemplates(false);
              openStudioForBlock(block);
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Section Code Studio (SDK) Modal */}
      <SectionStudioModal
        isOpen={showStudio}
        onClose={() => {
          setShowStudio(false);
          setStudioInitialSection(null);
        }}
        initialSection={studioInitialSection}
        onSave={async (savedData) => {
          if (studioInitialSection?.blockId) {
            updateBlock(studioInitialSection.blockId, {
              props: {
                ...studioInitialSection.props,
                _name: savedData.name,
                _code: savedData.code,
                _css: savedData.css,
                _fields: savedData.fields,
                _options: savedData.options,
                ...(savedData.defaultProps || {}),
              },
            });
          }
          const updated = await fetchRemoteCustomSections();
          setCustomTemplates(updated);
        }}
        onInsert={(sectionData) => {
          const block = {
            id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            type: "sdkCustomSection",
            props: {
              _sectionId: sectionData.sectionId,
              _name: sectionData.name,
              _code: sectionData.code,
              _css: sectionData.css,
              _fields: sectionData.fields || [],
              _options: sectionData.options || {},
              ...(sectionData.defaultProps || {}),
            },
            _style: { ...defaultStyle() },
          };
          setBlocks((prev) => [...prev, block]);
          setShowStudio(false);
          toast.success(`Inserted "${sectionData.name}" into page`);
        }}
      />
    </div>
  );
}

/* ---------------- modal shell ---------------- */
function Modal({ title, onClose, children, wide, extraWide, scrollable = true, headerRight }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 25, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          extraWide
            ? "max-w-[1450px] w-[97vw] h-[92vh] sm:h-[88vh]"
            : wide
            ? "max-w-6xl w-[95vw]"
            : "max-w-2xl"
        } max-h-[94vh] sm:max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-gray-100 bg-white shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {headerRight}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className={`flex-1 min-h-0 ${scrollable ? "overflow-y-auto" : "overflow-hidden flex flex-col"}`}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- templates gallery ---------------- */
function TemplatesModal({ onClose, onInsert, customTemplates = [], onDeleteCustom, onOpenStudio, onEditSdkSection }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "expanded"
  const [previewingTemplate, setPreviewingTemplate] = useState(null);

  const safeCustom = Array.isArray(customTemplates) ? customTemplates.filter(Boolean) : [];
  const safeTemplates = Array.isArray(TEMPLATES) ? TEMPLATES.filter(Boolean) : [];
  const hasCustom = safeCustom.length > 0;
  const categories = [
    "All Sections",
    ...(hasCustom ? ["My Templates"] : []),
    ...(Array.isArray(TEMPLATE_CATEGORIES) ? TEMPLATE_CATEGORIES : []),
  ];
  const [cat, setCat] = useState("All Sections");

  const all = useMemo(
    () => (hasCustom ? [...safeCustom, ...safeTemplates] : safeTemplates),
    [hasCustom, safeCustom, safeTemplates]
  );

  const filteredList = useMemo(() => {
    let list = all;
    if (cat === "My Templates") {
      list = safeCustom;
    } else if (cat !== "All Sections") {
      list = all.filter((t) => t && t.category === cat);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        if (!t) return false;
        const nameMatch = (t.name || "").toLowerCase().includes(q);
        const descMatch = (t.desc || "").toLowerCase().includes(q);
        const catMatch = (t.category || "").toLowerCase().includes(q);
        const blockMatch = (t.blocks || []).some((b) =>
          b && (b.type || "").toLowerCase().includes(q)
        );
        return nameMatch || descMatch || catMatch || blockMatch;
      });
    }
    return list;
  }, [all, cat, searchQuery, safeCustom]);

  const [visibleLimit, setVisibleLimit] = useState(24);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleLimit(24);
  }, [cat, searchQuery]);

  const displayedList = useMemo(
    () => filteredList.slice(0, visibleLimit),
    [filteredList, visibleLimit]
  );

  return (
    <>
      <Modal
        title={`Browse Sections & Templates (${all.length})`}
        onClose={onClose}
        extraWide
        scrollable={false}
      >
        {/* Top filter bar: Search, View mode toggle, count */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50/70">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections by name, style, or block type..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all shadow-sm"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
            {onOpenStudio ? (
              <button
                type="button"
                onClick={onOpenStudio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
                title="Create a custom React section with code, animations & variables"
              >
                <Code2 size={13} />
                <span>+ Code Section Studio</span>
              </button>
            ) : null}

            <span className="text-xs text-gray-500 font-medium hidden md:inline-block">
              Showing <b className="text-gray-800">{filteredList.length}</b> {filteredList.length === 1 ? "section" : "sections"}
            </span>

            {/* View mode toggle */}
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="2-Column Grid View"
              >
                <Grid size={13} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("expanded")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "expanded"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Expanded 1-Column View (Full Width)"
              >
                <List size={13} />
                <span className="hidden sm:inline">Expanded</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Categories Sidebar + Sections Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] overflow-hidden">
          {/* Categories Sidebar */}
          <div className="border-r border-gray-100 p-3 overflow-y-auto preview-scrollbar flex md:block gap-1.5 overflow-x-auto bg-gray-50/40 shrink-0">
            {categories.map((c) => {
              const isAll = c === "All Sections";
              const isMine = c === "My Templates";
              const count = isAll
                ? all.length
                : isMine
                ? customTemplates.length
                : all.filter((t) => t.category === c).length;

              if (count === 0 && !isMine && !isAll) return null;
              const active = cat === c;

              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`whitespace-nowrap md:w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-2 shrink-0 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {isMine ? (
                      <Star
                        size={13}
                        className={active ? "text-amber-200" : "text-amber-400"}
                      />
                    ) : null}
                    <span className="truncate">{c}</span>
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                      active
                        ? "bg-blue-700/60 text-blue-100"
                        : "bg-gray-200/70 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards scrollable viewport */}
          <div className="p-3 sm:p-5 overflow-y-scroll preview-scrollbar bg-slate-100/60 min-h-0 h-full">
            {filteredList.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                <LayoutTemplate size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-base text-gray-800">No sections found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No sections match "${searchQuery}". Try a different keyword or category.`
                    : cat === "My Templates"
                    ? "No custom templates saved yet. Design a section on your page and click “Save as Template”."
                    : "No sections available in this category."}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    Clear Search
                  </button>
                ) : null}
              </div>
            ) : (
              <div
                className={`grid gap-4 sm:gap-5 content-start ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 max-w-5xl mx-auto"
                }`}
              >
                {displayedList.map((t) => {
                  const blockCount = (t.blocks || []).length;
                  const blockTypes = Array.from(
                    new Set((t.blocks || []).map((b) => b.type))
                  );

                  return (
                    <div
                      key={t.id}
                      className={`group flex flex-col ${
                        viewMode === "grid"
                          ? "h-[44vh] sm:h-[42vh] min-h-[280px] max-h-[400px]"
                          : "h-[52vh] min-h-[360px] max-h-[480px]"
                      } rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 bg-white overflow-hidden`}
                    >
                      {/* Card Header */}
                      <div className="px-3.5 py-2 bg-white border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold tracking-wide truncate">
                            {t.category}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium shrink-0">
                            <Layers size={11} />
                            {blockCount} {blockCount === 1 ? "block" : "blocks"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {t.isSdkCustom && onEditSdkSection ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const b = t.blocks?.[0];
                                if (b) onEditSdkSection(b);
                              }}
                              title="Edit in Section Code Studio (SDK)"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                            >
                              <Code2 size={12} />
                              <span className="hidden sm:inline">Edit Code</span>
                            </button>
                          ) : null}
                          <button
                            onClick={() => setPreviewingTemplate(t)}
                            title="Interactive full-screen preview"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye size={12} />
                            <span className="hidden sm:inline">Preview</span>
                          </button>
                          {t.custom ? (
                            <button
                              onClick={() => onDeleteCustom?.(t.id)}
                              title="Delete template"
                              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Live scaled preview */}
                      <div
                        className="relative w-full flex-1 min-h-0 bg-slate-50 border-b border-gray-100 overflow-hidden cursor-pointer group/preview"
                        onClick={() => setPreviewingTemplate(t)}
                        title="Click to preview full section"
                      >
                        <TemplatePreview
                          template={t}
                          minHeight={viewMode === "grid" ? 200 : 280}
                        />

                        {/* Hover Overlay with Preview & Insert Buttons */}
                        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewingTemplate(t);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-800 text-xs font-semibold shadow-md transition-transform hover:scale-105"
                          >
                            <Eye size={13} /> Full Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInsert(t);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-transform hover:scale-105"
                          >
                            <Plus size={13} /> Insert
                          </button>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3 mt-auto bg-white shrink-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                            {t.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            {t.desc || "Pre-designed section"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setPreviewingTemplate(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
                          >
                            <Eye size={12} />
                            <span className="hidden xl:inline">Full</span> Preview
                          </button>
                          <button
                            onClick={() => onInsert(t)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                          >
                            <Plus size={13} /> Insert
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {visibleLimit < filteredList.length ? (
              <div className="py-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-800 text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all cursor-pointer"
                >
                  <Plus size={15} /> Load More Sections ({filteredList.length - visibleLimit} remaining)
                </button>
                <button
                  onClick={() => setVisibleLimit(filteredList.length)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline transition-colors cursor-pointer"
                >
                  Show All ({filteredList.length})
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      {/* Full Interactive Preview Modal */}
      <AnimatePresence>
        {previewingTemplate ? (
          <SectionPreviewModal
            template={previewingTemplate}
            onClose={() => setPreviewingTemplate(null)}
            onInsert={(t) => {
              setPreviewingTemplate(null);
              onInsert(t);
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ---------------- full-screen interactive preview modal ---------------- */
function SectionPreviewModal({ template, onClose, onInsert }) {
  const [deviceWidth, setDeviceWidth] = useState("100%");
  const blocks = useMemo(
    () => createBlocksFromTemplate(template),
    [template]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex flex-col justify-between"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-20 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            title="Back to gallery"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {template.name}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium shrink-0">
                {template.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate hidden sm:block">
              {template.desc || "Pre-designed section"}
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: "100%", label: "Full Width", icon: Monitor },
            { id: "1200px", label: "Desktop (1200px)", icon: Monitor },
            { id: "768px", label: "Tablet (768px)", icon: Tablet },
            { id: "390px", label: "Mobile (390px)", icon: Smartphone },
          ].map((d) => {
            const Icon = d.icon;
            const active = deviceWidth === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDeviceWidth(d.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={d.label}
              >
                <Icon size={14} />
                <span className="hidden lg:inline">{d.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onInsert(template)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus size={16} /> Insert into Page
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        className="flex-1 min-h-0 overflow-y-auto bg-slate-200/70 p-3 sm:p-6 flex justify-center items-start preview-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 w-full"
          style={{
            maxWidth: deviceWidth,
            minHeight: "400px",
          }}
        >
          <TemplateErrorBoundary title={template.name}>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading interactive preview...</div>}>
              <BlockRenderer blocks={blocks} />
            </Suspense>
          </TemplateErrorBoundary>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Error Boundary for Safe Template Rendering ---------------- */
class TemplateErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("CMS template preview caught non-fatal error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
            <LayoutTemplate size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[90%]">
            {this.props.title || "Section Preview"}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">Click Full Preview to view layout</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// Live, scaled-down snapshot of a template's actual rendered blocks.
const PREVIEW_WIDTH = 1200; // virtual render width

function TemplatePreview({ template, minHeight = 200 }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [scale, setScale] = useState(0.35);
  const [contentHeight, setContentHeight] = useState(450);

  // Lazy observer: only mount heavy BlockRenderer when card is scrolled into/near view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setIsInView(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Build the blocks once, and freeze any auto-playing carousels to a static
  // first slide so the thumbnail is a calm snapshot (no perpetual timers).
  const blocks = useMemo(() => {
    if (!isInView) return [];
    try {
      return createBlocksFromTemplate(template).map((b) =>
        b.type === "carousel"
          ? { ...b, props: { ...(b.props || {}), autoplay: false, kenBurns: false } }
          : b
      );
    } catch {
      return [];
    }
  }, [template, isInView]);

  useEffect(() => {
    if (!isInView) return;
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container) return;

    const measure = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth > 0) {
        const nextScale = containerWidth / PREVIEW_WIDTH;
        setScale(nextScale);
        if (content) {
          const rawHeight = content.offsetHeight || content.scrollHeight || 450;
          setContentHeight(rawHeight);
        }
      }
    };

    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) {
      ro.observe(container);
      if (content) ro.observe(content);
    }

    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 350);

    return () => {
      ro?.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [template, blocks, isInView]);

  const scaledHeight = Math.max(Math.ceil(contentHeight * scale), minHeight);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden pointer-events-none select-none bg-slate-50"
    >
      {!isInView ? (
        <div
          style={{ height: `${minHeight}px` }}
          className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100/70"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 shadow-xs">
            <LayoutTemplate size={18} />
          </div>
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[90%]">
            {template.name}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">{template.category}</span>
        </div>
      ) : (
        /* Spacer div in normal flow that gives the container its exact scaled height */
        <div
          style={{
            height: `${scaledHeight}px`,
            width: "100%",
            position: "relative",
            minHeight: "100%",
          }}
        >
          <div
            ref={contentRef}
            className="cms-preview pointer-events-none select-none absolute top-0 left-0 origin-top-left bg-white shadow-sm"
            style={{
              width: `${PREVIEW_WIDTH}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <TemplateErrorBoundary title={template.name}>
              <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-gray-400">Rendering preview...</div>}>
                <BlockRenderer blocks={blocks} />
              </Suspense>
            </TemplateErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}


