"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, Keyboard, Command, Sparkles } from "lucide-react";
import { useCommand } from "@/context/CommandContext";
import { formatShortcut } from "@/lib/commands/keyboard";

export default function KeyboardShortcutsModal() {
  const {
    shortcutsModalOpen,
    closeShortcutsModal,
    isMac,
    pushOverlay,
    popOverlay,
  } = useCommand();

  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  // Register with overlay stack when open
  useEffect(() => {
    if (shortcutsModalOpen) {
      pushOverlay("shortcuts-modal", closeShortcutsModal);
      setTimeout(() => inputRef.current?.focus(), 50);
      return () => popOverlay("shortcuts-modal");
    }
  }, [shortcutsModalOpen, pushOverlay, popOverlay, closeShortcutsModal]);

  const shortcutGroups = useMemo(
    () => [
      {
        category: "General & Navigation",
        items: [
          { key: "$mod+k", desc: "Open Command Palette" },
          { key: "?", desc: "Open Keyboard Shortcuts Reference" },
          { key: "escape", desc: "Dismiss topmost modal / Clear selection" },
          { key: "/", desc: "Focus search bar (when outside text inputs)" },
        ],
      },
      {
        category: "Forms & Editing",
        items: [
          { key: "$mod+s", desc: "Save active form / editor / changes" },
          { key: "$mod+z", desc: "Undo in active editor / input" },
          { key: "$mod+shift+z", desc: "Redo in active editor / input" },
          { key: "enter", desc: "Submit form / Confirm focused action" },
        ],
      },
      {
        category: "Tables, Lists & Selection",
        items: [
          { key: "$mod+a", desc: "Select all visible items in table" },
          { key: "click", desc: "Select single row or open details" },
          { key: "$mod+click", desc: "Toggle selection of individual row" },
          { key: "shift+click", desc: "Select contiguous range of rows" },
          { key: "arrowup / arrowdown", desc: "Navigate through rows" },
          { key: "shift+arrow", desc: "Extend selection range with keyboard" },
          { key: "space", desc: "Toggle checkbox on focused row" },
          { key: "delete", desc: "Delete selected items (with confirmation)" },
          { key: "escape", desc: "Clear row selection" },
        ],
      },
      {
        category: "Clipboard & Media Uploads",
        items: [
          { key: "$mod+c", desc: "Copy selected items or text" },
          { key: "$mod+v", desc: "Paste text or paste screenshot image into upload target" },
          { key: "$mod+x", desc: "Cut text inside editable inputs" },
        ],
      },
    ],
    []
  );

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return shortcutGroups;
    const q = search.toLowerCase().trim();

    return shortcutGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.desc.toLowerCase().includes(q) ||
            item.key.toLowerCase().includes(q) ||
            formatShortcut(item.key).toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [shortcutGroups, search]);

  if (!shortcutsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeShortcutsModal}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard Shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-500">
                Operating on {isMac ? "macOS (⌘ Command)" : "Windows / Linux (Ctrl)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeShortcutsModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white">
          <div className="relative flex items-center">
            <Search size={16} className="text-gray-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[500px]">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No shortcuts found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item, idx) => {
                    const keys = item.key.split(" / ");
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 border-b border-gray-50 text-sm"
                      >
                        <span className="text-gray-700 font-medium">{item.desc}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              {kIdx > 0 && <span className="text-gray-400 text-xs">or</span>}
                              <kbd className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-xs font-mono font-semibold shadow-2xs">
                                {formatShortcut(k)}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Typing in inputs and editors remains completely safe.</span>
          <button
            type="button"
            onClick={closeShortcutsModal}
            className="px-4 py-1.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
