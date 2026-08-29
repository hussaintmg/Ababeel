"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft, X } from "lucide-react";

/**
 * Global owner search — a command palette over every dashboard entity.
 *
 * Two pieces: a trigger that sits in the dashboard's own layout, and the
 * palette itself. It calls one endpoint (`/api/owner/search`) that queries
 * everything server-side, rather than fanning out eight requests from here.
 *
 * The keyboard is the point of a palette, so arrows, Enter and Escape all work
 * and the highlighted row is tracked with `aria-activedescendant` — a listbox
 * whose selection only exists visually is unusable with a screen reader.
 */
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl-K from anywhere in the dashboard, unless the user is typing.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-lg border border-gray-300 bg-white px-3.5 text-left text-sm text-gray-400 transition-colors hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Search size={16} className="shrink-0" aria-hidden="true" />
        <span className="truncate">Search courses, registrations, people…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[11px] text-gray-500 sm:block">
          ⌘K
        </kbd>
      </button>

      {open ? <Palette onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Palette({ onClose }) {
  const router = useRouter();
  const listId = useId();

  const [term, setTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef(null);
  const requestId = useRef(0);
  const timer = useRef(null);

  // Groups flattened, because the keyboard moves through results in the order
  // they are shown, not group by group.
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => {
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const run = useCallback(async (q) => {
    const id = ++requestId.current;
    if (q.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/search?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (id !== requestId.current) return;
      setGroups(data?.success ? data.data.groups || [] : []);
      setSearched(true);
    } catch {
      if (id === requestId.current) setGroups([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const onType = (value) => {
    setTerm(value);
    setActive(0);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(value), 250);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      go(flat[active]);
    }
  };

  // Keep the highlighted row in view when the arrows walk past the fold.
  useEffect(() => {
    document
      .getElementById(`${listId}-opt-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  let index = -1;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-[10vh] sm:pt-[15vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-gray-900/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the dashboard"
        className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4">
          {loading ? (
            <Loader2 size={18} className="shrink-0 animate-spin text-gray-400" aria-hidden="true" />
          ) : (
            <Search size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search courses, registrations, people…"
            aria-label="Search the dashboard"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={flat.length ? `${listId}-opt-${active}` : undefined}
            autoComplete="off"
            className="h-14 flex-1 border-0 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div id={listId} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-2">
          {term.trim().length < 2 ? (
            <p className="px-3 py-8 text-center text-sm text-gray-400">
              Type at least two characters to search.
            </p>
          ) : !flat.length && searched && !loading ? (
            <p className="px-3 py-8 text-center text-sm text-gray-500">
              Nothing matches “{term}”.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.key} className="mb-1">
                <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  index += 1;
                  const i = index;
                  const isActive = i === active;
                  return (
                    <div
                      key={item.id}
                      id={`${listId}-opt-${i}`}
                      role="option"
                      aria-selected={isActive}
                      tabIndex={-1}
                      onClick={() => go(item)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${
                        isActive ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                        {item.meta ? (
                          <p className="truncate text-xs capitalize text-gray-500">{item.meta}</p>
                        ) : null}
                      </div>
                      {isActive ? (
                        <CornerDownLeft size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-4 border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-400 sm:flex">
          <span>↑ ↓ to navigate</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
