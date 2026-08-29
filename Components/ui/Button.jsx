"use client";

import Link from "next/link";
import { cn } from "@/Components/ui/cn";

/**
 * Button and LinkButton.
 *
 * One set of variants for the whole public site. The hierarchy is the point:
 * `primary` is the safety orange and there should be one per view, `dark` and
 * `outline` carry everything else, `ghost` and `link` are for tertiary actions.
 * A page that needs three oranges is a page with an unclear ask.
 *
 * `Button` renders a <button>, `LinkButton` a next/link — never a <div> with an
 * onClick, so keyboard and screen-reader behaviour comes for free.
 */

const BASE =
  "aba-focus inline-flex items-center justify-center gap-2 t-button rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none select-none";

const VARIANTS = {
  // Dark text on the orange, not white. White on brand-500 measures 3.12:1,
  // which fails AA for 15px text — and the fix is not a duller orange, it is
  // the contrast pairing real safety signage already uses. ink-900 on
  // brand-500 is 5.86:1, and 7.02:1 on the lighter hover.
  primary: "bg-brand-500 text-ink-900 hover:bg-brand-400 shadow-sm",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
  outline: "border border-ink-200 text-ink-900 bg-white hover:bg-ink-50 hover:border-ink-300",
  // On a dark hero the outline has to be light, or it disappears.
  outlineLight: "border border-white/35 text-white hover:bg-white/10 hover:border-white/60",
  ghost: "text-ink-700 hover:bg-ink-50",
  link: "text-brand-700 hover:text-brand-800 underline underline-offset-4 px-0 py-0 rounded-none",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES = {
  sm: "h-9 px-3.5",
  md: "h-11 px-5",
  lg: "h-13 px-7 text-base",
};

function classes({ variant = "primary", size = "md", fullWidth = false, className = "" }) {
  return cn(
    BASE,
    VARIANTS[variant] || VARIANTS.primary,
    variant === "link" ? "" : SIZES[size] || SIZES.md,
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  loading = false,
  ...rest
}) {
  return (
    <button
      type={type}
      className={classes({ variant, size, fullWidth, className })}
      // A loading button stays in the tab order and announces itself rather
      // than vanishing from the page mid-submit.
      aria-busy={loading || undefined}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href = "#",
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  external = false,
  ...rest
}) {
  const cls = classes({ variant, size, fullWidth, className });

  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

/**
 * A button-shaped element that is deliberately not actionable — a closed
 * registration, a cancelled session. Rendered as a disabled <button> rather
 * than a styled <span> so assistive tech reports it as unavailable rather than
 * silently omitting it.
 */
export function InertButton({ children, size = "md", className = "", tone = "muted" }) {
  const tones = {
    muted: "bg-ink-100 text-ink-500 border border-ink-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={cn(BASE, SIZES[size] || SIZES.md, tones[tone] || tones.muted, "cursor-not-allowed", className)}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
      />
    </svg>
  );
}

export default Button;
