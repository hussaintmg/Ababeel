"use client";

import Link from "next/link";
import { ArrowRight, Clock, Award } from "lucide-react";
import { cn } from "@/Components/ui/cn";
import { Badge, LevelBadge, Card, ImageWell } from "@/Components/ui/Primitives";

/**
 * Course cards, in five designs.
 *
 * All five read the same course shape and are chosen by name, so the owner can
 * switch the /courses grid from `standard` to `editorial` in settings without
 * anything else changing. Adding a sixth means adding it to `CARD_TEMPLATES`
 * and to the map at the bottom — nothing else in the app knows the difference.
 *
 * Every field is optional. A course with no image, no level and no awarding
 * body still renders a correct card, because on a real site half of them will
 * be like that on the day the catalogue is first filled in.
 */

export const CARD_TEMPLATES = [
  { value: "standard", label: "Standard — image, metadata, action" },
  { value: "editorial", label: "Editorial — large image, generous type" },
  { value: "minimal", label: "Minimal — no image, typographic" },
  { value: "featured", label: "Featured — dark, for a highlighted course" },
  { value: "horizontal", label: "Horizontal — image beside content" },
];

/** The pieces every variant shows, resolved once. */
function useCourseParts(course) {
  const href = course?.slug ? `/courses/${course.slug}` : "";
  const body =
    typeof course?.awardingBody === "object" && course?.awardingBody ? course.awardingBody : null;
  const level = typeof course?.level === "object" && course?.level ? course.level : null;
  return { href, body, level };
}

function MetaRow({ course, body, dark = false, className = "" }) {
  const bits = [];
  if (course.duration) {
    bits.push(
      <span key="duration" className="inline-flex items-center gap-1.5">
        <Clock size={13} aria-hidden="true" />
        {course.duration}
      </span>,
    );
  }
  if (body?.name) {
    bits.push(
      <span key="body" className="inline-flex items-center gap-1.5">
        <Award size={13} aria-hidden="true" />
        {body.name}
      </span>,
    );
  }
  if (!bits.length) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 t-caption",
        dark ? "text-ink-300" : "text-ink-500",
        className,
      )}
    >
      {bits}
    </div>
  );
}

/** The card's action. A course with no slug has no detail page to link to. */
function ViewLink({ href, dark = false, label = "View details" }) {
  if (!href) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 t-small font-semibold",
        dark ? "text-brand-400" : "text-brand-600",
      )}
    >
      {label}
      <ArrowRight size={15} aria-hidden="true" className="aba-arrow" />
    </span>
  );
}

/**
 * The whole card is one link.
 *
 * A card with a link in the title *and* a "View details" link at the bottom
 * gives a screen-reader user two identical destinations to choose between. One
 * anchor wrapping the card, with the visual affordance inside it, is both
 * simpler and a larger touch target.
 */
function CardLink({ href, children, className = "", ariaLabel }) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <Link href={href} aria-label={ariaLabel} className={cn("aba-focus block", className)}>
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------- variants */

function StandardCard({ course }) {
  const { href, body, level } = useCourseParts(course);
  return (
    <Card hover className="flex h-full flex-col">
      <CardLink href={href} ariaLabel={course.name} className="flex h-full flex-col">
        <ImageWell src={course.featuredImage} alt="" fallbackText={course.name} />
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {level && <LevelBadge level={level} size="sm" />}
            {course.code ? (
              <Badge tone="outline" size="sm">
                {course.code}
              </Badge>
            ) : null}
          </div>
          <h3 className="t-h4 text-ink-900 aba-clamp-2">{course.name}</h3>
          {course.shortDescription ? (
            <p className="mt-2 t-small text-ink-600 aba-clamp-3">{course.shortDescription}</p>
          ) : null}
          <div className="mt-auto pt-4">
            <MetaRow course={course} body={body} className="mb-3" />
            <ViewLink href={href} />
          </div>
        </div>
      </CardLink>
    </Card>
  );
}

function EditorialCard({ course }) {
  const { href, body, level } = useCourseParts(course);
  return (
    <Card hover className="flex h-full flex-col border-0 shadow-none rounded-none bg-transparent">
      <CardLink href={href} ariaLabel={course.name} className="flex h-full flex-col">
        <ImageWell
          src={course.featuredImage}
          alt=""
          fallbackText={course.name}
          ratio="4/3"
          className="rounded-xl"
        />
        <div className="flex flex-1 flex-col pt-5">
          {level ? <p className="t-eyebrow mb-2 text-brand-600">{level.name}</p> : null}
          <h3 className="t-h3 text-ink-900 aba-clamp-2">{course.name}</h3>
          {course.shortDescription ? (
            <p className="mt-3 t-body text-ink-600 aba-clamp-3">{course.shortDescription}</p>
          ) : null}
          <div className="mt-auto pt-5">
            <MetaRow course={course} body={body} className="mb-3" />
            <ViewLink href={href} label="Explore this course" />
          </div>
        </div>
      </CardLink>
    </Card>
  );
}

function MinimalCard({ course }) {
  const { href, body, level } = useCourseParts(course);
  return (
    <Card hover className="flex h-full flex-col">
      <CardLink href={href} ariaLabel={course.name} className="flex h-full flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          {level ? <LevelBadge level={level} size="sm" /> : <span />}
          <ArrowRight size={17} aria-hidden="true" className="aba-arrow mt-0.5 shrink-0 text-ink-300" />
        </div>
        <h3 className="t-h4 text-ink-900 aba-clamp-2">{course.name}</h3>
        {course.shortDescription ? (
          <p className="mt-2 t-small text-ink-600 aba-clamp-3">{course.shortDescription}</p>
        ) : null}
        <div className="mt-auto border-t border-ink-100 pt-4">
          <MetaRow course={course} body={body} />
        </div>
      </CardLink>
    </Card>
  );
}

function FeaturedCard({ course }) {
  const { href, body, level } = useCourseParts(course);
  return (
    <Card hover className="flex h-full flex-col border-ink-800 bg-ink-900">
      <CardLink href={href} ariaLabel={course.name} className="flex h-full flex-col">
        <div className="relative">
          <ImageWell src={course.featuredImage} alt="" fallbackText={course.name} ratio="16/8" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/25 to-transparent" />
          <div className="absolute left-5 top-5">
            <Badge tone="brand" size="sm">
              Featured
            </Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          {level ? <p className="t-eyebrow mb-2 text-brand-400">{level.name}</p> : null}
          <h3 className="t-h3 text-white aba-clamp-2">{course.name}</h3>
          {course.shortDescription ? (
            <p className="mt-3 t-small text-ink-200 aba-clamp-3">{course.shortDescription}</p>
          ) : null}
          <div className="mt-auto pt-5">
            <MetaRow course={course} body={body} dark className="mb-3" />
            <ViewLink href={href} dark />
          </div>
        </div>
      </CardLink>
    </Card>
  );
}

function HorizontalCard({ course }) {
  const { href, body, level } = useCourseParts(course);
  return (
    <Card hover className="h-full">
      <CardLink href={href} ariaLabel={course.name} className="flex h-full flex-col sm:flex-row">
        <div className="sm:w-56 sm:shrink-0">
          <ImageWell
            src={course.featuredImage}
            alt=""
            fallbackText={course.name}
            ratio="16/9"
            className="h-full sm:h-full"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2.5 flex flex-wrap gap-2">
            {level && <LevelBadge level={level} size="sm" />}
            {course.code ? (
              <Badge tone="outline" size="sm">
                {course.code}
              </Badge>
            ) : null}
          </div>
          <h3 className="t-h4 text-ink-900 aba-clamp-2">{course.name}</h3>
          {course.shortDescription ? (
            <p className="mt-2 t-small text-ink-600 aba-clamp-2">{course.shortDescription}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <MetaRow course={course} body={body} />
            <ViewLink href={href} />
          </div>
        </div>
      </CardLink>
    </Card>
  );
}

const VARIANTS = {
  standard: StandardCard,
  editorial: EditorialCard,
  minimal: MinimalCard,
  featured: FeaturedCard,
  horizontal: HorizontalCard,
};

/**
 * @param course   a published TrainingCourse (lean object)
 * @param template one of CARD_TEMPLATES; unknown names fall back to standard
 */
export function CourseCard({ course, template = "standard" }) {
  if (!course?.name) return null;
  const Variant = VARIANTS[template] || VARIANTS.standard;
  return <Variant course={course} />;
}

export default CourseCard;
