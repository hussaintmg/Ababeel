"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CalendarCheck, MapPin, Star, BadgeCheck } from "lucide-react";
import { cn } from "@/Components/ui/cn";
import { Badge, Card, ImageWell, LogoTile } from "@/Components/ui/Primitives";
import { LinkButton, InertButton } from "@/Components/ui/Button";
import { registrationCta, registrationHref, modeLabel } from "@/lib/training/status";
import { formatDateRange, formatDate } from "@/lib/training/format";

/**
 * The cards for everything that is not a course: awarding bodies, sessions on
 * the schedule, testimonials and people.
 *
 * Like the course cards, each one treats every optional field as genuinely
 * optional — a consultant with no photo, a testimonial with no company, an
 * awarding body with no logo all render correctly rather than leaving a hole.
 */

/* --------------------------------------------------------- awarding bodies */

export function AwardingBodyCard({ body }) {
  if (!body?.name) return null;
  const href = body.slug ? `/awarding-bodies/${body.slug}` : "";
  return (
    <Card hover className="flex h-full flex-col">
      <Link
        href={href || "#"}
        aria-label={body.name}
        className="aba-focus flex h-full flex-col p-6"
      >
        <LogoTile src={body.logo} alt="" name={body.name} className="mb-5 border-0 bg-ink-50 px-4" />
        <h3 className="t-h4 text-ink-900">{body.name}</h3>
        {body.description ? (
          <p className="mt-2 t-small text-ink-600 aba-clamp-3">{body.description}</p>
        ) : null}
        {href ? (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 t-small font-semibold text-brand-700">
            View courses
            <ArrowRight size={15} aria-hidden="true" className="aba-arrow" />
          </span>
        ) : null}
      </Link>
    </Card>
  );
}

/* ---------------------------------------------------------------- sessions */

/**
 * One dated intake on the schedule.
 *
 * The date block on the left is the thing a visitor scans for, so it is the
 * first and largest element. The register button uses the shared CTA rules, so
 * a closed session shows an inert "Registration Closed" and never a link that
 * leads to a form the server would refuse.
 */
export function SessionCard({ session, course: courseProp = null, showCourseName = true }) {
  if (!session) return null;
  const course = courseProp || (typeof session.course === "object" ? session.course : null);
  const cta = registrationCta(session);
  const href = course ? registrationHref(course, session) : "";
  const start = session.startDate ? new Date(session.startDate) : null;
  const body = course?.awardingBody && typeof course.awardingBody === "object" ? course.awardingBody : null;

  return (
    <Card hover className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* Date block */}
        <div className="flex shrink-0 items-center gap-4 sm:w-32 sm:flex-col sm:items-start sm:gap-0">
          {start ? (
            <div className="rounded-lg bg-ink-50 px-4 py-3 text-center">
              <p className="t-label text-brand-700">
                {start.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}
              </p>
              <p className="t-h3 leading-none text-ink-900">{start.getUTCDate()}</p>
              <p className="t-caption text-ink-500">{start.getUTCFullYear()}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-ink-50 px-4 py-3 text-center">
              <p className="t-caption text-ink-500">Dates to be announced</p>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="min-w-0 flex-1">
          {showCourseName && course?.name ? (
            course.slug ? (
              <Link href={`/courses/${course.slug}`} className="aba-focus">
                <h3 className="t-h4 text-ink-900 hover:text-brand-700">{course.name}</h3>
              </Link>
            ) : (
              <h3 className="t-h4 text-ink-900">{course.name}</h3>
            )
          ) : null}

          {session.referenceName ? (
            <p className="mt-0.5 t-small text-ink-500">{session.referenceName}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 t-caption text-ink-600">
            {(session.startDate || session.endDate) && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} aria-hidden="true" />
                {formatDateRange(session.startDate, session.endDate)}
              </span>
            )}
            {session.examDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck size={13} aria-hidden="true" />
                Exam {formatDate(session.examDate)}
              </span>
            )}
            {session.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} aria-hidden="true" />
                {session.location}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral" size="sm">
              {modeLabel(session)}
            </Badge>
            {(session.duration || course?.duration) && (
              <Badge tone="outline" size="sm">
                {session.duration || course.duration}
              </Badge>
            )}
            {body?.name && (
              <Badge tone="outline" size="sm">
                {body.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0 sm:self-center">
          {cta.available && href ? (
            <LinkButton href={href} size="md" fullWidth>
              {cta.label}
            </LinkButton>
          ) : (
            <InertButton tone={cta.tone === "danger" ? "danger" : "muted"}>{cta.label}</InertButton>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ testimonials */

function Stars({ rating = 0 }) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  if (!value) return null;
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={15}
          aria-hidden="true"
          className={i < value ? "fill-amber-400 text-amber-400" : "text-ink-200"}
        />
      ))}
    </div>
  );
}

/**
 * A review card.
 *
 * `sourceLogo` and `verifiedLabel` are owner-uploaded and owner-typed; there is
 * no reviews API anywhere behind this. The card shows the source the owner
 * named rather than asserting a verification the site cannot check.
 */
export function TestimonialCard({ testimonial, variant = "card" }) {
  if (!testimonial?.name) return null;
  const t = testimonial;
  const large = variant === "featured";

  return (
    <Card className={cn("flex h-full flex-col p-6", large && "p-8 sm:p-10")}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <Stars rating={t.rating} />
        {t.sourceLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.sourceLogo}
            alt={t.sourceName ? `${t.sourceName} logo` : ""}
            loading="lazy"
            className="h-5 w-auto shrink-0 object-contain"
          />
        ) : t.sourceName ? (
          <span className="t-caption shrink-0 text-ink-500">{t.sourceName}</span>
        ) : null}
      </div>

      {t.reviewText ? (
        <blockquote
          className={cn("text-ink-800", large ? "t-h3 font-normal leading-snug" : "t-body")}
        >
          {t.reviewText}
        </blockquote>
      ) : null}

      <div className="mt-auto flex items-center gap-3 pt-6">
        {t.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.profileImage}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-100 t-small font-bold text-ink-500"
          >
            {t.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="t-small font-semibold text-ink-900">{t.name}</p>
          {(t.position || t.company) && (
            <p className="t-caption truncate text-ink-500">
              {[t.position, t.company].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        {t.verifiedLabel ? (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 t-caption text-emerald-700">
            <BadgeCheck size={14} aria-hidden="true" />
            {t.verifiedLabel}
          </span>
        ) : t.reviewDate ? (
          <span className="ml-auto shrink-0 t-caption text-ink-500">{formatDate(t.reviewDate)}</span>
        ) : null}
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- people */

/** A team member or a consultant in a grid. */
export function PersonCard({ person, href = "", showBio = true }) {
  if (!person?.name) return null;
  const inner = (
    <>
      <ImageWell
        src={person.profileImage}
        alt=""
        fallbackText={person.name}
        ratio="1/1"
        className="rounded-lg"
      />
      <div className="pt-4">
        <h3 className="t-h4 text-ink-900">{person.name}</h3>
        {person.position ? <p className="mt-0.5 t-small text-brand-700">{person.position}</p> : null}
        {showBio && person.bio ? (
          <p className="mt-2 t-small text-ink-600 aba-clamp-3">{stripHtml(person.bio)}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <Card hover className="border-0 bg-transparent shadow-none">
      {href ? (
        <Link href={href} aria-label={person.name} className="aba-focus block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Card>
  );
}

/**
 * Bios come from a rich-text field, so a card preview needs the words without
 * the markup. Rendering the HTML into a clamped card would let a stray heading
 * or list break the grid, and inserting it unsanitised is not on the table.
 */
function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
