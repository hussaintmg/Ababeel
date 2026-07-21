"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Home, Info, Mail, Award, Briefcase, HelpCircle, BookOpen,
  Image as ImageIcon, Shield, Receipt, FileText, ExternalLink, Loader2,
  Eye, EyeOff, LayoutTemplate, Plus, Trash2, X, Globe, KeyRound,
} from "lucide-react";
import { slugify } from "@/lib/cmsDefaults";

const ICONS = {
  settings: Settings, home: Home, info: Info, mail: Mail, award: Award,
  briefcase: Briefcase, help: HelpCircle, book: BookOpen, image: ImageIcon,
  shield: Shield, receipt: Receipt, file: FileText,
  key: KeyRound,
};

export default function CmsDashboardPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const load = () =>
    axios
      .get("/api/owner/cms", { withCredentials: true })
      .then((res) => setPages(res.data?.data || []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const createPage = async () => {
    const title = newName.trim();
    if (!title) return;
    setCreating(true);
    try {
      const res = await axios.post(
        "/api/owner/cms",
        { action: "create", title },
        { withCredentials: true }
      );
      const key = res.data?.page?.key;
      toast.success(`Page "/${key}" created`);
      setShowCreate(false);
      setNewName("");
      if (key) router.push(`/owner/cms/${key}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not create page");
    } finally {
      setCreating(false);
    }
  };

  const deletePage = async (key, title) => {
    if (!window.confirm(`Delete the "${title}" page permanently? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/owner/cms/${key}`, { withCredentials: true });
      toast.success("Page deleted");
      setPages((prev) => prev.filter((p) => p.key !== key));
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not delete page");
    }
  };

  const groups = pages.reduce((acc, p) => {
    (acc[p.group] = acc[p.group] || []).push(p);
    return acc;
  }, {});
  const slugPreview = slugify(newName);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
          <LayoutTemplate size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Website CMS</h1>
          <p className="text-gray-500 text-sm">
            Manage every page, the global branding, navigation and footer — no code required.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <Plus size={17} /> Add Page
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading pages…
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{group}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((p, i) => {
                  const Icon = ICONS[p.icon] || (p.isCustom ? Globe : FileText);
                  const isGlobal = p.kind === "global";
                  return (
                    <motion.div
                      key={p.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        href={`/owner/cms/${p.key}`}
                        className="group block h-full rounded-2xl border border-gray-200 bg-white p-5 hover:border-blue-400 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                              isGlobal ? "bg-indigo-50 text-indigo-600" : p.isCustom ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isGlobal ? (
                              <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">Global</span>
                            ) : p.enabled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">
                                <Eye size={12} /> {p.isCustom ? "Live" : "Published"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                                <EyeOff size={12} /> {p.isCustom ? "Disabled" : "Draft"}
                              </span>
                            )}
                            {p.isCustom ? (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deletePage(p.key, p.title);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete page"
                              >
                                <Trash2 size={14} />
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{p.description || p.route}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-600">Edit →</span>
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(p.route, "_blank");
                            }}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                          >
                            <ExternalLink size={13} /> View
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create-page modal */}
      <AnimatePresence>
        {showCreate ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Add a new page</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
              </div>
              <div className="p-5">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Page name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPage()}
                  placeholder="e.g. Projects"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                {slugPreview ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Public address: <span className="font-mono text-gray-700">/{slugPreview}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">A URL-friendly address is generated from the name.</p>
                )}
                <p className="mt-3 text-xs text-gray-400">
                  The page starts as <b>Disabled</b>. Design it with templates, then switch it to <b>Published</b> to make it live. You can also add it to the menu from its editor.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
                  <button
                    onClick={createPage}
                    disabled={creating || !newName.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Create page
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
