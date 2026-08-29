"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import { X, Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/Components/ui/cn";
import { Button } from "@/Components/ui/Button";

/**
 * The stateful pieces: drawer, modal, tabs, accordion, pagination, search and
 * the filter controls.
 *
 * Each one is keyboard-operable and announces itself. That is not decoration on
 * a training site — the filter drawer on /courses is the only way to narrow the
 * catalogue on a phone, so if it cannot be closed with Escape or reached with a
 * keyboard, the catalogue is unusable for the people most likely to need a
 * safety qualification.
 */

/* ------------------------------------------------------- shared behaviours */

/** Close on Escape, and lock the page behind an overlay while it is open. */
function useOverlay(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);

    // Restoring the exact previous value matters: two overlays can overlap
    // (a modal opened from inside a drawer), and blindly setting "" on close
    // would unlock the page while the other is still open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

/**
 * Keep Tab inside the panel while it is open, and hand focus back to whatever
 * opened it on close — otherwise a keyboard user lands back at the top of the
 * document every time they dismiss a filter drawer.
 */
function useFocusTrap(open, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const opener = document.activeElement;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const first = node.querySelector(selector);
    (first || node).focus?.();

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll(selector)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const start = items[0];
      const end = items[items.length - 1];
      if (e.shiftKey && document.activeElement === start) {
        e.preventDefault();
        end.focus();
      } else if (!e.shiftKey && document.activeElement === end) {
        e.preventDefault();
        start.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, ref]);
}

/* ------------------------------------------------------------------ drawer */

/**
 * A side panel. Used for mobile navigation and the courses filter.
 *
 * Kept mounted-when-open rather than always mounted and hidden: a hidden drawer
 * that still contains focusable links is a well-known way to leak tab stops
 * into a page that looks like it has none.
 */
export function Drawer({ open, onClose, title = "", side = "right", children, footer = null }) {
  const panel = useRef(null);
  useOverlay(open, onClose);
  useFocusTrap(open, panel);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink-950/50 backdrop-blur-[2px]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Panel"}
        tabIndex={-1}
        className={cn(
          "absolute top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl outline-none",
          side === "left" ? "left-0" : "right-0",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-5 py-4">
          <p className="t-h4 text-ink-900">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="aba-focus rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer ? <div className="shrink-0 border-t border-ink-100 p-4">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- modal */

export function Modal({ open, onClose, title = "", children, footer = null, size = "md" }) {
  const panel = useRef(null);
  useOverlay(open, onClose);
  useFocusTrap(open, panel);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink-950/55"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl",
          sizes[size] || sizes.md,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
          <p className="t-h4 text-ink-900">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="aba-focus -mr-2 rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-ink-100 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- tabs */

/**
 * Tabs following the ARIA tabs pattern: arrow keys move between tabs, and only
 * the active tab is in the tab order.
 */
export function Tabs({ tabs = [], value, onChange, className = "" }) {
  const listRef = useRef(null);

  const move = (delta) => {
    const i = tabs.findIndex((t) => t.value === value);
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    if (!next) return;
    onChange?.(next.value);
    listRef.current?.querySelector(`[data-tab="${next.value}"]`)?.focus();
  };

  return (
    <div className={cn("aba-scroll-x border-b border-ink-100", className)}>
      <div ref={listRef} role="tablist" className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              data-tab={tab.value}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange?.(tab.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
              }}
              className={cn(
                "aba-focus relative whitespace-nowrap px-4 py-3 t-small font-semibold transition-colors",
                active ? "text-ink-900" : "text-ink-500 hover:text-ink-800",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-ink-400">{tab.count}</span>
              )}
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- accordion */

export function Accordion({ items = [], allowMultiple = false, className = "" }) {
  const [open, setOpen] = useState(() => new Set());
  const baseId = useId();

  const toggle = (i) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (!items.length) return null;

  return (
    <div className={cn("divide-y divide-ink-100 border-y border-ink-100", className)}>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.id || `${item.question}-${i}`}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="aba-focus flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="t-h4 text-ink-900">{item.question || item.title}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-ink-400 transition-transform duration-300 motion-reduce:transition-none",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            {/* `hidden` rather than a height transition: an animated collapse
                of arbitrary CMS-authored HTML is the kind of thing that janks
                on a long answer, and nobody is served by that. */}
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              <div className="cms-prose t-body pb-6 text-ink-600">
                {item.html ? (
                  <div dangerouslySetInnerHTML={{ __html: item.html }} />
                ) : (
                  <p>{item.answer || item.body}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- pagination */

export function Pagination({ page = 1, pages = 1, onChange, className = "" }) {
  if (pages <= 1) return null;

  // Show a window around the current page rather than every page: 40 numbered
  // buttons is not navigation, it is a wall.
  const window = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, page + 2);
  for (let i = from; i <= to; i += 1) window.push(i);

  const btn =
    "aba-focus inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 t-small font-semibold transition-colors";

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      <button
        type="button"
        onClick={() => onChange?.(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={cn(btn, "border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:pointer-events-none")}
      >
        <ChevronLeft size={16} />
      </button>

      {from > 1 && (
        <>
          <button type="button" onClick={() => onChange?.(1)} className={cn(btn, "text-ink-600 hover:bg-ink-50")}>
            1
          </button>
          {from > 2 && <span className="px-1 text-ink-400">…</span>}
        </>
      )}

      {window.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            btn,
            n === page ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50",
          )}
        >
          {n}
        </button>
      ))}

      {to < pages && (
        <>
          {to < pages - 1 && <span className="px-1 text-ink-400">…</span>}
          <button type="button" onClick={() => onChange?.(pages)} className={cn(btn, "text-ink-600 hover:bg-ink-50")}>
            {pages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onChange?.(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className={cn(btn, "border border-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:pointer-events-none")}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ search */

/**
 * A search box that debounces before it calls back.
 *
 * Typing "safety officer" is fifteen keystrokes; without this it is fifteen
 * requests, and the answer to the eighth can arrive after the fifteenth.
 */
export function SearchInput({
  value = "",
  onChange,
  placeholder = "Search courses…",
  delay = 300,
  className = "",
  label = "Search",
}) {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);
  const id = useId();

  // Follow an externally cleared value (the "Clear all filters" button).
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const push = useCallback(
    (next) => {
      setLocal(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => onChange?.(next), delay);
    },
    [onChange, delay],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
      />
      <input
        id={id}
        type="search"
        value={local}
        onChange={(e) => push(e.target.value)}
        placeholder={placeholder}
        className="aba-focus h-12 w-full rounded-lg border border-ink-200 bg-white pl-10 pr-4 t-body text-ink-900 placeholder:text-ink-400 focus:border-ink-300"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ filters */

/** A labelled group of radio-like filter options, one of which may be active. */
export function FilterGroup({ title, options = [], value = "", onChange, showAll = true, allLabel = "All" }) {
  if (!options.length) return null;
  const name = title.replace(/\W+/g, "-").toLowerCase();

  return (
    <fieldset className="border-0 p-0">
      <legend className="t-label mb-3 text-ink-500">{title}</legend>
      <div className="space-y-1">
        {showAll && (
          <FilterOption
            name={name}
            checked={!value}
            onChange={() => onChange?.("")}
            label={allLabel}
          />
        )}
        {options.map((opt) => (
          <FilterOption
            key={opt.value}
            name={name}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            label={opt.label}
            count={opt.count}
          />
        ))}
      </div>
    </fieldset>
  );
}

function FilterOption({ name, checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 t-small text-ink-700 transition-colors hover:bg-ink-50 has-[:focus-visible]:bg-ink-50">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="aba-focus h-4 w-4 shrink-0 accent-brand-500"
      />
      <span className={cn("flex-1", checked && "font-semibold text-ink-900")}>{label}</span>
      {count !== undefined && <span className="t-caption text-ink-400">{count}</span>}
    </label>
  );
}

/** The mobile "Filters" button, with a count of what is currently applied. */
export function FilterTrigger({ activeCount = 0, onClick, className = "" }) {
  return (
    <Button variant="outline" onClick={onClick} className={cn("shrink-0", className)}>
      <SlidersHorizontal size={16} aria-hidden="true" />
      Filters
      {activeCount > 0 && (
        <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
          {activeCount}
        </span>
      )}
    </Button>
  );
}

/* ---------------------------------------------------------------- dropdown */

/**
 * A native <select> styled to match. Deliberately native: a custom listbox on a
 * phone is worse than the platform picker in every way that matters, and this
 * one is used for sorting a course list, not for anything exotic.
 */
export function Select({ label, value, onChange, options = [], className = "", id: idProp, srOnlyLabel = false }) {
  const generated = useId();
  const id = idProp || generated;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className={srOnlyLabel ? "sr-only" : "t-label mb-2 block text-ink-500"}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="aba-focus h-11 w-full appearance-none rounded-lg border border-ink-200 bg-white pl-3.5 pr-9 t-small text-ink-900"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </div>
    </div>
  );
}
