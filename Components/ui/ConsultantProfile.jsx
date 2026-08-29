"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/Components/ui/cn";
import { Badge, ImageWell, Card } from "@/Components/ui/Primitives";
import { Reveal } from "@/Components/ui/Reveal";
import { toLines } from "@/lib/training/format";

/**
 * A consultant profile, in the five layouts the CMS offers.
 *
 * The layout is stored on the consultant rather than chosen by the page, so a
 * profile looks the same wherever it appears. Every layout is built from the
 * same three pieces — media, heading, body — so adding a sixth means one more
 * arrangement, not one more component.
 */
export function ConsultantProfile({ consultant, index = 0 }) {
  if (!consultant?.name) return null;

  const layout = consultant.layout || "image-left";
  const images = galleryOf(consultant);
  const useCarousel = consultant.showCarousel && images.length > 1;
  const animation = consultant.animation === "" ? "" : consultant.animation || "fade-up";

  const media = useCarousel ? (
    <Carousel images={images} name={consultant.name} />
  ) : (
    <ImageWell
      src={consultant.profileImage || images[0]?.url}
      alt=""
      fallbackText={consultant.name}
      ratio="4/5"
      zoom={false}
      className="rounded-xl"
    />
  );

  const heading = (
    <div className={consultant.textAlign === "center" ? "text-center" : ""}>
      <h3 className="t-h3 text-ink-900">{consultant.name}</h3>
      {consultant.position ? (
        <p className="t-body mt-1 text-brand-700">{consultant.position}</p>
      ) : null}
    </div>
  );

  const body = <ConsultantBody consultant={consultant} />;

  if (layout === "featured") {
    return (
      <Reveal animation={animation}>
        <Card className="overflow-hidden border-ink-800 bg-ink-900 text-white">
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="min-h-64">{media}</div>
            <div className="p-8 sm:p-10">
              <p className="t-eyebrow mb-3 text-brand-400">Featured consultant</p>
              <h3 className="t-h2 text-white">{consultant.name}</h3>
              {consultant.position ? (
                <p className="t-body-lg mt-2 text-ink-200">{consultant.position}</p>
              ) : null}
              <ConsultantBody consultant={consultant} dark />
            </div>
          </div>
        </Card>
      </Reveal>
    );
  }

  if (layout === "content-carousel-content") {
    return (
      <Reveal animation={animation}>
        <div className="mx-auto max-w-3xl">
          {heading}
          {consultant.bio ? (
            <div
              className="cms-prose t-body mt-4 text-ink-700"
              dangerouslySetInnerHTML={{ __html: consultant.bio }}
            />
          ) : null}
        </div>
        {images.length ? (
          <div className="my-8">
            <Carousel images={images} name={consultant.name} />
          </div>
        ) : null}
        <div className="mx-auto max-w-3xl">
          <Credentials consultant={consultant} />
        </div>
      </Reveal>
    );
  }

  // image-left, image-right and carousel-left are the same two-column
  // arrangement; only which side the media sits on differs.
  const mediaRight = layout === "image-right";

  return (
    <Reveal animation={animation}>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className={cn(mediaRight && "lg:order-2")}>
          {layout === "carousel-left" && images.length ? (
            <Carousel images={images} name={consultant.name} />
          ) : (
            media
          )}
        </div>
        <div className={cn(mediaRight && "lg:order-1")}>
          {heading}
          {body}
        </div>
      </div>
    </Reveal>
  );
}

function ConsultantBody({ consultant, dark = false }) {
  return (
    <>
      {consultant.bio ? (
        <div
          className={cn("cms-prose t-body mt-4", dark ? "text-ink-200" : "text-ink-700")}
          dangerouslySetInnerHTML={{ __html: consultant.bio }}
        />
      ) : null}
      <Credentials consultant={consultant} dark={dark} />
    </>
  );
}

/**
 * Expertise, qualifications and certifications.
 *
 * All three are "one per line" textareas, and any of them may be empty — a
 * consultant added in a hurry has a name and a photo and nothing else, and the
 * profile still has to look finished.
 */
function Credentials({ consultant, dark = false }) {
  const expertise = toLines(consultant.expertise);
  const qualifications = toLines(consultant.qualifications);
  const certifications = toLines(consultant.certifications);

  if (!expertise.length && !qualifications.length && !certifications.length && !consultant.experience) {
    return null;
  }

  return (
    <div className="mt-6 space-y-5">
      {expertise.length ? (
        <div>
          <p className={cn("t-label mb-2", dark ? "text-ink-500" : "text-ink-500")}>
            Areas of expertise
          </p>
          <div className="flex flex-wrap gap-2">
            {expertise.map((item) => (
              <Badge key={item} tone={dark ? "light" : "neutral"}>
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <CredentialList label="Qualifications" items={qualifications} dark={dark} />
      <CredentialList label="Certifications" items={certifications} dark={dark} />

      {consultant.experience ? (
        <div>
          <p className={cn("t-label mb-2", dark ? "text-ink-500" : "text-ink-500")}>Experience</p>
          <p className={cn("t-small whitespace-pre-line", dark ? "text-ink-200" : "text-ink-600")}>
            {consultant.experience}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CredentialList({ label, items, dark }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={cn("t-label mb-2", dark ? "text-ink-500" : "text-ink-500")}>{label}</p>
      <ul className={cn("t-small space-y-1", dark ? "text-ink-200" : "text-ink-600")}>
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A minimal image carousel.
 *
 * No autoplay: this sits inside a biography someone is reading, and a picture
 * that changes while they read is a distraction, not a feature. Arrow keys work
 * and every slide stays in the DOM so the count is honest to a screen reader.
 */
function Carousel({ images, name }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  if (!count) return null;

  const go = (next) => setIndex(((next % count) + count) % count);

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${name} gallery`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="overflow-hidden rounded-xl">
        {images.map((image, i) => (
          <div key={`${image.url}-${i}`} hidden={i !== index}>
            <ImageWell src={image.url} alt={image.alt || ""} ratio="4/3" zoom={false} />
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous image"
            className="aba-focus absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-md hover:bg-white"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next image"
            className="aba-focus absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink-900 shadow-md hover:bg-white"
          >
            <ChevronRight size={17} />
          </button>
          {/* The dot is 6px; the button around it is 44. Padding rather than a
              bigger dot, so the control stays tappable without the row of them
              turning into a design feature of its own. */}
          <div className="mt-1 flex justify-center">
            {images.map((image, i) => (
              <button
                key={`dot-${image.url}-${i}`}
                type="button"
                onClick={() => go(i)}
                aria-label={`Image ${i + 1} of ${count}`}
                aria-current={i === index}
                className="aba-focus group grid h-11 w-6 place-items-center"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-brand-500" : "w-1.5 bg-ink-200 group-hover:bg-ink-300",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Profile photo first, then the gallery — deduplicated. */
function galleryOf(consultant) {
  const images = [];
  const seen = new Set();
  if (consultant.profileImage) {
    images.push({ url: consultant.profileImage, alt: consultant.name });
    seen.add(consultant.profileImage);
  }
  for (const item of consultant.gallery || []) {
    if (item?.url && !seen.has(item.url)) {
      images.push(item);
      seen.add(item.url);
    }
  }
  return images;
}

export default ConsultantProfile;
