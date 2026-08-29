/**
 * Date and text formatting for the training pages.
 *
 * Every date in this system is a day, not a moment: a course starts on the 10th
 * of September wherever the reader is. They are stored at UTC midnight and
 * formatted in UTC for exactly that reason — formatting in the browser's zone
 * would show "9 September" to anyone west of Greenwich, which on a schedule is
 * not a cosmetic bug.
 *
 * Client-safe: no database, no server imports.
 */

const LOCALE = "en-GB";
const UTC = { timeZone: "UTC" };

function asDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "10 September 2026" */
export function formatDate(value, opts = {}) {
  const d = asDate(value);
  if (!d) return "";
  return d.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...UTC,
    ...opts,
  });
}

/** "10 Sep 2026" — for tables and dense cards. */
export function formatDateShort(value) {
  return formatDate(value, { month: "short" });
}

/**
 * A range, collapsed as far as it honestly can be:
 *   same day        → "10 September 2026"
 *   same month      → "10 – 14 September 2026"
 *   same year       → "28 September – 3 October 2026"
 *   otherwise       → "28 December 2026 – 3 January 2027"
 *   no end date     → "From 10 September 2026"
 */
export function formatDateRange(start, end) {
  const a = asDate(start);
  const b = asDate(end);
  if (!a && !b) return "";
  if (!a) return `Until ${formatDate(b)}`;
  if (!b) return `From ${formatDate(a)}`;

  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();
  const sameDay = sameMonth && a.getUTCDate() === b.getUTCDate();

  if (sameDay) return formatDate(a);
  if (sameMonth) {
    const month = a.toLocaleDateString(LOCALE, { month: "long", ...UTC });
    return `${a.getUTCDate()} – ${b.getUTCDate()} ${month} ${a.getUTCFullYear()}`;
  }
  if (sameYear) {
    const from = a.toLocaleDateString(LOCALE, { day: "numeric", month: "long", ...UTC });
    return `${from} – ${formatDate(b)}`;
  }
  return `${formatDate(a)} – ${formatDate(b)}`;
}

/** "September 2026" */
export function formatMonth(year, month) {
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(LOCALE, { month: "long", year: "numeric", ...UTC });
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Split a textarea field into lines.
 *
 * Several CMS fields ("one per line") are authored this way; doing the split in
 * one place stops each renderer inventing its own idea of what a blank line
 * means.
 */
export function toLines(value) {
  return String(value || "")
    .split(/\r?\n|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Plain text from a rich-text field, for previews and meta descriptions. */
export function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trim to a length without cutting a word in half.
 *
 * Always breaks at the last whole word, even when that loses more than the
 * character budget suggests: "one two thre…" reads as a rendering bug, and a
 * meta description or card preview is worth less broken than short. Only text
 * with no space at all — a single long token — is cut mid-way.
 */
export function truncate(text, max = 160) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
