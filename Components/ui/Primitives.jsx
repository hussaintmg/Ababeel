"use client";

import Link from "next/link";
import { ChevronRight, AlertTriangle, SearchX, Inbox } from "lucide-react";
import { cn } from "@/Components/ui/cn";

/**
 * The small, stateless pieces every training page is built from: layout
 * containers, section headings, badges, cards, breadcrumbs, and the empty,
 * error and loading states.
 *
 * Anything that needs state (drawers, tabs, accordions, pagination) lives in
 * Interactive.jsx so a server component can import from here without pulling a
 * client bundle it does not use.
 */

/* ------------------------------------------------------------------ layout */

/** The page-width container. One measure across the whole site. */
export function Container({ children, size = "wide", className = "" }) {
  const sizes = {
    narrow: "max-w-3xl",
    prose: "max-w-4xl",
    normal: "max-w-6xl",
    wide: "max-w-7xl",
  };
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-6 lg:px-8", sizes[size] || sizes.wide, className)}>
      {children}
    </div>
  );
}

/** Vertical rhythm. Sections are generous — crowding is what reads as cheap. */
export function Section({ children, className = "", tone = "light", size = "md", id }) {
  const tones = {
    light: "bg-white text-ink-900",
    muted: "bg-ink-50 text-ink-900",
    dark: "bg-ink-900 text-white",
    ink: "bg-ink-950 text-white",
    none: "",
  };
  const sizes = {
    sm: "py-12 sm:py-14",
    md: "py-16 sm:py-20 lg:py-24",
    lg: "py-20 sm:py-28 lg:py-32",
  };
  return (
    <section id={id} className={cn(tones[tone] ?? tones.light, sizes[size] || sizes.md, className)}>
      {children}
    </section>
  );
}

/**
 * A section's heading group: eyebrow, title, lead.
 *
 * `dark` inverts the colours rather than the caller passing six class names,
 * which is how the same heading ends up looking slightly different on two
 * pages.
 */
export function SectionHeading({
  eyebrow = "",
  title,
  lead = "",
  align = "left",
  dark = false,
  className = "",
  as: Tag = "h2",
}) {
  return (
    <div
      className={cn(
        align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className={cn("t-eyebrow mb-3", dark ? "text-brand-400" : "text-brand-600")}>{eyebrow}</p>
      ) : null}
      {title ? (
        <Tag className={cn("t-h2", dark ? "text-white" : "text-ink-900")}>{title}</Tag>
      ) : null}
      {lead ? (
        <p className={cn("t-body-lg mt-4", dark ? "text-ink-200" : "text-ink-600")}>{lead}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ badges */

export function Badge({ children, tone = "neutral", size = "md", className = "", style }) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700",
    brand: "bg-brand-50 text-brand-700",
    dark: "bg-ink-900 text-white",
    outline: "border border-ink-200 text-ink-700 bg-white",
    light: "bg-white/15 text-white backdrop-blur-sm",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
  };
  const sizes = { sm: "px-2 py-0.5 text-[11px]", md: "px-2.5 py-1 text-xs" };
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        tones[tone] || tones.neutral,
        sizes[size] || sizes.md,
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A level badge tinted with the level's own colour when the owner set one.
 *
 * The colour is a CMS-authored string, so it is only ever used as a CSS custom
 * property value on a style attribute — never interpolated into a class name,
 * which would not exist in the compiled stylesheet anyway.
 */
export function LevelBadge({ level, size = "md", className = "" }) {
  if (!level?.name) return null;
  const color = typeof level.color === "string" && /^#[0-9a-f]{3,8}$/i.test(level.color)
    ? level.color
    : "";
  return (
    <Badge
      tone={color ? "neutral" : "brand"}
      size={size}
      className={className}
      style={color ? { backgroundColor: `${color}1a`, color } : undefined}
    >
      {level.icon ? <span aria-hidden="true">{level.icon}</span> : null}
      {level.name}
    </Badge>
  );
}

/* ------------------------------------------------------------------- cards */

export function Card({ children, className = "", as: Tag = "div", hover = false, ...rest }) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-ink-100 bg-white overflow-hidden",
        hover && "aba-lift hover:border-ink-200",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A 16:9 image well that never collapses.
 *
 * Optional CMS images are the single most common cause of a broken-looking
 * card, so a missing `src` renders a quiet placeholder with the item's initial
 * rather than an empty box or a browser's broken-image icon.
 */
export function ImageWell({ src, alt = "", fallbackText = "", ratio = "16/9", className = "", zoom = true }) {
  return (
    <div
      className={cn("relative w-full overflow-hidden bg-ink-100", className)}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("h-full w-full object-cover", zoom && "aba-zoom")}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-100 to-ink-200">
          <span className="t-h2 text-ink-300 select-none" aria-hidden="true">
            {(fallbackText || "").trim().charAt(0).toUpperCase() || "•"}
          </span>
        </div>
      )}
    </div>
  );
}

/** A logo on a neutral tile — awarding bodies and accreditations. */
export function LogoTile({ src, alt, name = "", className = "" }) {
  return (
    <div
      className={cn(
        "flex h-20 items-center justify-center rounded-lg border border-ink-100 bg-white px-5",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || name} loading="lazy" className="max-h-12 w-auto object-contain" />
      ) : (
        <span className="t-h4 text-ink-400">{name}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- breadcrumbs */

export function Breadcrumb({ items = [], dark = false, className = "" }) {
  const trail = items.filter(Boolean);
  if (!trail.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 t-caption">
        {trail.map((item, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className={cn(
                    "aba-focus transition-colors",
                    dark ? "text-ink-300 hover:text-white" : "text-ink-500 hover:text-ink-900",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={dark ? "text-white" : "text-ink-900"}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <ChevronRight
                  size={13}
                  aria-hidden="true"
                  className={dark ? "text-ink-500" : "text-ink-300"}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ----------------------------------------------------------------- states */

/**
 * Nothing to show, and it is not an error.
 *
 * The message always says what would make the list non-empty, because "No
 * results" on its own leaves a visitor with nothing to do next.
 */
export function EmptyState({
  title = "Nothing here yet",
  message = "",
  icon: Icon = Inbox,
  action = null,
  className = "",
}) {
  return (
    <div className={cn("rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-14 text-center", className)}>
      <Icon size={30} className="mx-auto mb-4 text-ink-300" aria-hidden="true" />
      <p className="t-h4 text-ink-900">{title}</p>
      {message ? <p className="t-small mt-2 mx-auto max-w-md text-ink-500">{message}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** The specific empty state for a filtered list that matched nothing. */
export function NoResults({ message = "No courses match your selected filters.", action = null }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results"
      message={message}
      action={action}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again. If the problem continues, contact our team.",
  action = null,
  className = "",
}) {
  return (
    <div
      role="alert"
      className={cn("rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center", className)}
    >
      <AlertTriangle size={28} className="mx-auto mb-3 text-red-500" aria-hidden="true" />
      <p className="t-h4 text-red-900">{title}</p>
      <p className="t-small mt-2 mx-auto max-w-md text-red-700">{message}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------- skeletons */

/**
 * Skeletons reuse the shimmer the CMS already ships (`.cms-skeleton`), which
 * stops animating under `prefers-reduced-motion`. A second shimmer of our own
 * would be one more thing to keep in step with that.
 */
export function Skeleton({ className = "", style }) {
  return <div className={cn("cms-skeleton", className)} style={style} aria-hidden="true" />;
}

export function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-100 overflow-hidden">
      <Skeleton className="w-full" style={{ aspectRatio: "16/9", borderRadius: 0 }} />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, columns = 3 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };
  return (
    <div className={cn("grid grid-cols-1 gap-6", cols[columns] || cols[3])} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ScheduleSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-5 rounded-xl border border-ink-100 p-5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="w-full" style={{ aspectRatio: "16/7" }} />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

/**
 * A polite live region for a list that is refreshing.
 *
 * The skeleton is `aria-hidden`, so without this a screen-reader user gets no
 * signal at all that the results changed.
 */
export function LoadingAnnouncer({ loading, label = "Loading results" }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {loading ? label : ""}
    </p>
  );
}
