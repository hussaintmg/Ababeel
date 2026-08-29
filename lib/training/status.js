/**
 * Publication and registration rules for the public training platform.
 *
 * Pure functions, no database and no React, so both the server queries and the
 * rendered buttons make the same decision — a session that says "Registration
 * Closed" is a session the API will also refuse.
 *
 * Client-safe, and it must stay that way: card components import `registrationCta`
 * from here. Take the status lists from `constants.js`, never from the model —
 * importing the model pulls Mongoose into the browser bundle and breaks the build.
 */
import {
  PUBLIC_SESSION_STATUSES,
  REGISTERABLE_SESSION_STATUSES,
} from "@/lib/training/constants";

/** Query fragment: only published catalogue entries. */
export const PUBLISHED = { status: "published" };

/** Query fragment: sessions a visitor may see at all. */
export const PUBLIC_SESSION = { status: { $in: PUBLIC_SESSION_STATUSES } };

/** Query fragment: sessions that belong on the public schedule. */
export const SCHEDULED_SESSION = {
  status: { $in: PUBLIC_SESSION_STATUSES },
  showInSchedule: true,
};

/** True when a course may appear on the public site. */
export function isCoursePublic(course) {
  return !!course && course.status === "published";
}

/** True when a session may appear on the public site. */
export function isSessionPublic(session) {
  return !!session && PUBLIC_SESSION_STATUSES.includes(session.status);
}

/**
 * Whether a session is still taking registrations.
 *
 * A deadline in the past closes registration even while the status still says
 * `open`, so an owner does not have to close each session by hand the morning
 * it fills.
 */
export function isRegistrationOpen(session, now = new Date()) {
  if (!session) return false;
  if (!REGISTERABLE_SESSION_STATUSES.includes(session.status)) return false;
  if (session.registrationDeadline && new Date(session.registrationDeadline) < now) return false;
  if (session.startDate && new Date(session.startDate) < startOfDay(now)) return false;
  return true;
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/**
 * What the register button should say and do for a session.
 *
 * Returned as data rather than JSX so the schedule cards, the course page and
 * the registration page itself all agree without sharing a component.
 */
export function registrationCta(session, now = new Date()) {
  if (!session) {
    return { available: false, label: "Registration Unavailable", tone: "muted" };
  }
  if (session.status === "cancelled") {
    return { available: false, label: "Session Cancelled", tone: "danger" };
  }
  if (session.status === "completed") {
    return { available: false, label: "Session Completed", tone: "muted" };
  }
  if (session.status === "draft") {
    return { available: false, label: "Registration Unavailable", tone: "muted" };
  }
  if (!isRegistrationOpen(session, now)) {
    return { available: false, label: "Registration Closed", tone: "muted" };
  }
  return { available: true, label: "Register Now", tone: "primary" };
}

/**
 * The registration URL for a course/session pair.
 *
 * Returns "" when registration is not possible, so a template that maps over
 * sessions cannot render a link into a dead end.
 */
export function registrationHref(course, session, now = new Date()) {
  if (!course || !session) return "";
  if (!registrationCta(session, now).available) return "";
  const courseId = String(course._id || course.id || "");
  const sessionId = String(session._id || session.id || "");
  if (!courseId || !sessionId) return "";
  return `/registration?course=${encodeURIComponent(courseId)}&reference=${encodeURIComponent(sessionId)}`;
}

/** Human label for a session's delivery mode, honouring a custom label. */
export function modeLabel(session) {
  if (!session) return "";
  if (session.modeLabel) return session.modeLabel;
  const map = { online: "Online", physical: "In Person", hybrid: "Hybrid", other: "Other" };
  return map[session.mode] || "Online";
}
