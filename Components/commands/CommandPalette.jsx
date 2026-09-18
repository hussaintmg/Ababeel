"use client";

import React, { useState, useEffect, useRef, useId, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  CornerDownLeft,
  X,
  Command,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Folder,
  Layers,
  Sparkles,
} from "lucide-react";
import { useCommand } from "@/context/CommandContext";
import { formatShortcut } from "@/lib/commands/keyboard";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export default function CommandPalette() {
  const {
    paletteOpen,
    closePalette,
    paletteInitialQuery,
    commandRegistry,
    executeCommand,
    openShortcutsModal,
    activeScopes,
    isMac,
    pushOverlay,
    popOverlay,
  } = useCommand();

  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entityResults, setEntityResults] = useState([]);
  const [searchingEntities, setSearchingEntities] = useState(false);

  // Register with overlay stack when open
  useEffect(() => {
    if (paletteOpen) {
      pushOverlay("command-palette", closePalette);
      return () => popOverlay("command-palette");
    }
  }, [paletteOpen, pushOverlay, popOverlay, closePalette]);

  // Focus input on open and set initial query
  useEffect(() => {
    if (paletteOpen) {
      setQuery(paletteInitialQuery || "");
      setSelectedIndex(0);
      setEntityResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [paletteOpen, paletteInitialQuery]);

  // Context for commands
  const commandContext = useMemo(
    () => ({
      user,
      activeScopes,
    }),
    [user, activeScopes]
  );

  // Fetch available registered commands
  const availableCommands = useMemo(() => {
    if (!paletteOpen) return [];
    return commandRegistry.getAvailable(commandContext);
  }, [paletteOpen, commandRegistry, commandContext]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return availableCommands;
    }
    const q = query.toLowerCase().trim();
    return availableCommands.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(q)) return true;
      if (cmd.category.toLowerCase().includes(q)) return true;
      if (cmd.description && cmd.description.toLowerCase().includes(q)) return true;
      if (Array.isArray(cmd.keywords) && cmd.keywords.some((kw) => kw.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [availableCommands, query]);

  // Debounced server search for records (when user is owner/admin or searching courses)
  useEffect(() => {
    const term = query.trim();
    if (!term || term.length < 2) {
      setEntityResults([]);
      setSearchingEntities(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingEntities(true);
      try {
        if (user?.role === "owner") {
          const res = await axios.get("/api/owner/search", {
            params: { q: term },
            withCredentials: true,
          });
          if (!cancelled && res.data?.results) {
            setEntityResults(res.data.results);
          }
        } else {
          // Public / organization course search
          const res = await axios.get("/api/training/courses", {
            params: { search: term, limit: 5 },
          });
          if (!cancelled && res.data?.success) {
            const courses = res.data.data?.items || [];
            setEntityResults(
              courses.map((c) => ({
                id: c._id,
                title: c.name,
                subtitle: c.awardingBody?.name || "Course",
                category: "Courses",
                url: `/courses/${c.slug || c._id}`,
              }))
            );
          }
        }
      } catch (err) {
        // Search error is non-fatal for palette
      } finally {
        if (!cancelled) setSearchingEntities(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, user]);

  // Combined selectable items list
  const allItems = useMemo(() => {
    const list = [];

    // 1. Registered commands
    filteredCommands.forEach((cmd) => {
      list.push({
        type: "command",
        id: cmd.id,
        title: cmd.title,
        subtitle: cmd.description,
        category: cmd.category,
        shortcut: cmd.shortcut ? formatShortcut(cmd.shortcut) : null,
        isDestructive: cmd.isDestructive,
        disabled: !cmd.isEnabled(commandContext),
        disabledReason: cmd.disabledReason,
        run: () => executeCommand(cmd.id),
      });
    });

    // 2. Server records
    entityResults.forEach((ent) => {
      list.push({
        type: "entity",
        id: `entity-${ent.id || ent.url}`,
        title: ent.title,
        subtitle: ent.subtitle || ent.category,
        category: ent.category || "Records",
        shortcut: null,
        url: ent.url,
        run: () => {
          if (ent.url) router.push(ent.url);
        },
      });
    });

    return list;
  }, [filteredCommands, entityResults, commandContext, executeCommand, router]);

  // Reset selected index when items list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems.length]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Keyboard navigation within palette
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected && !selected.disabled) {
          closePalette();
          selected.run();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
      }
    },
    [allItems, selectedIndex, closePalette]
  );

  if (!paletteOpen) return null;

  // Group items by category
  const categories = Array.from(new Set(allItems.map((item) => item.category)));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closePalette}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-200 bg-gray-50/50">
          <Search size={18} className="text-gray-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, action, or search records..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 outline-none"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={
              allItems[selectedIndex] ? `cmd-item-${selectedIndex}` : undefined
            }
          />
          {searchingEntities && (
            <Loader2 size={16} className="text-blue-600 animate-spin mr-2 shrink-0" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors mr-1"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-gray-300 bg-white text-[11px] font-sans text-gray-500 shadow-xs">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100 max-h-[480px]"
        >
          {allItems.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <Command className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800">No matching commands or records</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try searching with different keywords, or press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                  ?
                </kbd>{" "}
                to view the keyboard shortcuts reference.
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = allItems.filter((i) => i.category === category);

              return (
                <div key={category} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const itemIndex = allItems.indexOf(item);
                      const isSelected = itemIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          id={`cmd-item-${itemIndex}`}
                          data-index={itemIndex}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            if (!item.disabled) {
                              closePalette();
                              item.run();
                            }
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white font-medium shadow-xs"
                              : item.disabled
                              ? "text-gray-400 opacity-60 cursor-not-allowed"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span
                              className={`shrink-0 ${
                                isSelected ? "text-white" : "text-gray-400"
                              }`}
                            >
                              {item.type === "entity" ? (
                                <Folder size={16} />
                              ) : (
                                <Command size={16} />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 truncate">
                                <span className="truncate">{item.title}</span>
                                {item.disabled && item.disabledReason && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? "bg-blue-700 text-blue-100"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {item.disabledReason}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && (
                                <p
                                  className={`text-xs truncate ${
                                    isSelected ? "text-blue-100" : "text-gray-400"
                                  }`}
                                >
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {item.shortcut && (
                              <kbd
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium shadow-2xs ${
                                  isSelected
                                    ? "bg-blue-700/80 text-white border border-blue-500"
                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {item.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <CornerDownLeft
                                size={14}
                                className="text-white/80 shrink-0"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & shortcut guide */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px]">
                ↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px]">
                ↵
              </kbd>{" "}
              Select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px]">
                Esc
              </kbd>{" "}
              Close
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              closePalette();
              openShortcutsModal();
            }}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            <HelpCircle size={13} />
            Keyboard shortcuts reference
          </button>
        </div>
      </div>
    </div>
  );
}
