"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Container,
  SectionHeading,
  LinkButton,
  LogoTile,
  CourseCard,
  SessionCard,
  TestimonialCard,
  PersonCard,
  ConsultantProfile,
  AwardingBodyCard,
  EmptyState,
  RevealStagger,
  Reveal,
  cn,
} from "@/Components/ui";

/**
 * Renderers for the page-builder's live catalogue blocks.
 *
 * Presentational only: `_items` is resolved on the server by
 * `lib/cms/trainingBlocks.js` before the block reaches the browser, so nothing
 * here fetches, and a block renders identically in the builder preview and on
 * the live page.
 *
 * Every one of them handles an empty `_items`. On a new site that is the normal
 * state, and in the builder it is what an owner sees while they are still
 * filling the catalogue in — so it says what would fill it rather than
 * collapsing to nothing.
 */

/** The shared heading + optional footer link every catalogue block has. */
function BlockShell({ p, s, children, footer = true }) {
  const align = p.align === "center" ? "center" : "left";
  const hasHeader = p.title || p.subtitle || p.eyebrow;
  // A text colour set in the Design tab means the section sits on its own
  // dark band, so the heading and footer button switch to their light forms.
  const dark = !!s?.textColor;

  return (
    <Container className="py-14 sm:py-16">
      {hasHeader ? (
        <SectionHeading
          eyebrow={p.eyebrow}
          title={p.title}
          lead={p.subtitle}
          align={align}
          dark={dark}
          className="mb-10"
        />
      ) : null}

      {children}

      {footer && p.ctaLabel && p.ctaHref ? (
        <div className={cn("mt-10 flex", align === "center" ? "justify-center" : "justify-start")}>
          <LinkButton href={p.ctaHref} variant={dark ? "outlineLight" : "outline"}>
            {p.ctaLabel}
            <ArrowRight size={15} aria-hidden="true" className="aba-arrow" />
          </LinkButton>
        </div>
      ) : null}
    </Container>
  );
}

function Nothing({ message, fallback }) {
  return <EmptyState title="Nothing to show yet" message={message || fallback} />;
}

const COLUMN_CLASSES = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function gridClass(columns) {
  return cn("grid grid-cols-1 gap-6", COLUMN_CLASSES[String(columns)] || COLUMN_CLASSES[3]);
}

/* ------------------------------------------------------------------ courses */

export function CourseGridBlock({ p, s }) {
  const items = Array.isArray(p._items) ? p._items : [];
  return (
    <BlockShell p={p} s={s}>
      {items.length ? (
        <RevealStagger className={gridClass(p.columns)}>
          {items.map((course) => (
            <CourseCard key={course._id} course={course} template={p.cardTemplate || "standard"} />
          ))}
        </RevealStagger>
      ) : (
        <Nothing
          message={p.emptyMessage}
          fallback="Courses will appear here once they are published in the dashboard."
        />
      )}
    </BlockShell>
  );
}

/* ----------------------------------------------------------------- schedule */

export function ScheduleListBlock({ p, s }) {
  const items = Array.isArray(p._items) ? p._items : [];
  return (
    <BlockShell p={p} s={s}>
      {items.length ? (
        <RevealStagger className="space-y-4">
          {items.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              showCourseName={p.showCourseName !== false}
            />
          ))}
        </RevealStagger>
      ) : (
        <Nothing
          message={p.emptyMessage}
          fallback="No training sessions are currently scheduled."
        />
      )}
    </BlockShell>
  );
}

/* ----------------------------------------------------------------- logos */

/**
 * One implementation behind both logo blocks.
 *
 * Awarding bodies and accreditations differ in what they mean, not in how a
 * logo strip is drawn, so the difference lives in the props rather than in a
 * second copy of this layout.
 */
function LogoBlock({ p, s, items, hrefFor, detailCard }) {
  if (!items.length) {
    return (
      <BlockShell p={p} s={s}>
        <Nothing message={p.emptyMessage} fallback="Logos will appear here once they are published." />
      </BlockShell>
    );
  }

  if (p.layout === "cards" && detailCard) {
    return (
      <BlockShell p={p} s={s}>
        <RevealStagger className={gridClass(3)}>
          {items.map((item) => detailCard(item))}
        </RevealStagger>
      </BlockShell>
    );
  }

  const grayscale = p.grayscale !== false;
  const dark = !!s?.textColor;

  const logo = (item) => (
    <LogoTile
      src={item.logo}
      alt=""
      name={item.name}
      className={cn(
        "h-16 px-3 transition",
        dark ? "border-0 bg-white/95 rounded-lg" : "border-0 bg-transparent",
        // Some brand marks are unreadable desaturated, which is why this is a
        // choice rather than always on.
        grayscale && "opacity-70 grayscale hover:opacity-100 hover:grayscale-0",
      )}
    />
  );

  const wrapped = (item) => {
    const href = hrefFor?.(item);
    return href ? (
      <Link key={item._id} href={href} className="aba-focus block" aria-label={item.name}>
        {logo(item)}
      </Link>
    ) : (
      <div key={item._id}>{logo(item)}</div>
    );
  };

  if (p.layout === "grid") {
    return (
      <BlockShell p={p} s={s}>
        <RevealStagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(wrapped)}
        </RevealStagger>
      </BlockShell>
    );
  }

  return (
    <BlockShell p={p} s={s}>
      <Reveal>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {items.map(wrapped)}
        </div>
      </Reveal>
    </BlockShell>
  );
}

export function AwardingBodyLogosBlock({ p, s }) {
  const items = Array.isArray(p._items) ? p._items : [];
  return (
    <LogoBlock
      p={p}
      s={s}
      items={items}
      hrefFor={(item) => (p.linkToBody !== false && item.slug ? `/awarding-bodies/${item.slug}` : "")}
      detailCard={(item) => <AwardingBodyCard key={item._id} body={item} />}
    />
  );
}

export function AccreditationLogosBlock({ p, s }) {
  const items = Array.isArray(p._items) ? p._items : [];
  // No per-logo link: an accreditation mark is evidence, not navigation, and
  // sending someone off to a third-party site mid-page is not what the strip is
  // for. The block's own CTA points at /about/accreditations, where the details
  // and the verification links live.
  return <LogoBlock p={p} s={s} items={items} />;
}

/* ----------------------------------------------------------------- people */

export function ConsultantListBlock({ p, s }) {
  const items = Array.isArray(p._items) ? p._items : [];

  if (!items.length) {
    return (
      <BlockShell p={p} s={s}>
        <Nothing message={p.emptyMessage} fallback="Consultant profiles are on their way." />
      </BlockShell>
    );
  }

  if (p.display === "cards") {
    return (
      <BlockShell p={p} s={s}>
        <RevealStagger className={gridClass(p.columns)}>
          {items.map((person) => (
            <PersonCard key={person._id} person={person} />
          ))}
        </RevealStagger>
      </BlockShell>
    );
  }

  return (
    <BlockShell p={p} s={s}>
      <div className="space-y-16 lg:space-y-24">
        {items.map((consultant, index) => (
          <ConsultantProfile key={consultant._id} consultant={consultant} index={index} />
        ))}
      </div>
    </BlockShell>
  );
}

export function TeamGridBlock({ p, s }) {
  const all = Array.isArray(p._items) ? p._items : [];
  const items = p.leadershipOnly ? all.filter((m) => m.leadership) : all;

  return (
    <BlockShell p={p} s={s}>
      {items.length ? (
        <RevealStagger className={gridClass(p.columns)}>
          {items.map((person) => (
            <PersonCard key={person._id} person={person} showBio={p.showBio !== false} />
          ))}
        </RevealStagger>
      ) : (
        <Nothing message={p.emptyMessage} fallback="Team profiles are on their way." />
      )}
    </BlockShell>
  );
}

/* ------------------------------------------------------------- testimonials */

export function ReviewWallBlock({ p, s }) {
  const all = Array.isArray(p._items) ? p._items : [];
  const items = p.featuredOnly ? all.filter((t) => t.featured) : all;

  if (!items.length) {
    return (
      <BlockShell p={p} s={s} footer={false}>
        <Nothing
          message={p.emptyMessage}
          fallback="Reviews will appear here once they are published in the dashboard."
        />
      </BlockShell>
    );
  }

  if (p.layout === "featured" || p.layout === "editorial") {
    const [first, ...rest] = items;
    return (
      <BlockShell p={p} s={s} footer={false}>
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <TestimonialCard testimonial={first} variant="featured" />
          </div>
        </Reveal>
        {p.layout === "editorial" && rest.length ? (
          <RevealStagger className={cn("mt-8", gridClass(3))}>
            {rest.map((t) => (
              <TestimonialCard key={t._id} testimonial={t} />
            ))}
          </RevealStagger>
        ) : null}
      </BlockShell>
    );
  }

  if (p.layout === "carousel") {
    // A horizontal scroller rather than an auto-advancing carousel: reviews are
    // read, and text that slides away mid-sentence is worse than one someone
    // can push along themselves. Scroll-snap makes it feel deliberate.
    return (
      <BlockShell p={p} s={s} footer={false}>
        <div className="aba-scroll-x -mx-5 px-5 pb-2" style={{ scrollSnapType: "x mandatory" }}>
          <div className="flex min-w-max gap-6">
            {items.map((t) => (
              <div
                key={t._id}
                className="w-[85vw] max-w-sm shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <TestimonialCard testimonial={t} />
              </div>
            ))}
          </div>
        </div>
      </BlockShell>
    );
  }

  // "google" and "grid" are the same grid; the card itself carries the source
  // mark and the verification label, which is what makes one look like the
  // other.
  return (
    <BlockShell p={p} s={s} footer={false}>
      <RevealStagger className={gridClass(p.columns)}>
        {items.map((t) => (
          <TestimonialCard key={t._id} testimonial={t} />
        ))}
      </RevealStagger>
    </BlockShell>
  );
}

/** The map merged into BlockRenderer's own RENDERERS. */
export const TRAINING_RENDERERS = {
  courseGrid: CourseGridBlock,
  scheduleList: ScheduleListBlock,
  awardingBodyLogos: AwardingBodyLogosBlock,
  accreditationLogos: AccreditationLogosBlock,
  consultantList: ConsultantListBlock,
  teamGrid: TeamGridBlock,
  reviewWall: ReviewWallBlock,
};

export default TRAINING_RENDERERS;
