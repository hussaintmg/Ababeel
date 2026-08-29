"use client";

import Link from "next/link";
import { ArrowRight, Download, ExternalLink, FileText } from "lucide-react";
import { cn } from "@/Components/ui/cn";
import { Badge, Card, ImageWell } from "@/Components/ui/Primitives";
import { formatDate } from "@/lib/training/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/training/constants";

/**
 * A resource card.
 *
 * The action follows what the resource actually is, rather than always being
 * "read more": a PDF offers a download, an external link opens off-site, and
 * anything with its own content links to its page. A resource with none of
 * those has no action at all, and says so by simply not showing one.
 */
export function resourceAction(resource) {
  if (!resource) return null;

  const hasContent = !!String(resource.content || "").trim();
  const detailHref = resource.slug ? `/resources/${resource.slug}` : "";

  // Content wins: if there is something to read on our own page, send them
  // there — the file is offered on that page too, so nothing is lost.
  if (hasContent && detailHref) {
    return { kind: "detail", href: detailHref, label: "Read more", icon: ArrowRight };
  }
  if (resource.file) {
    return {
      kind: "file",
      href: resource.file,
      label: resource.fileLabel || "Download",
      icon: Download,
      external: true,
      download: true,
    };
  }
  if (resource.externalUrl) {
    return {
      kind: "external",
      href: resource.externalUrl,
      label: resource.fileLabel || "Open resource",
      icon: ExternalLink,
      external: true,
    };
  }
  if (detailHref) {
    return { kind: "detail", href: detailHref, label: "View", icon: ArrowRight };
  }
  return null;
}

export function ResourceCard({ resource, featured = false }) {
  if (!resource?.title) return null;

  const action = resourceAction(resource);
  const typeLabel = RESOURCE_TYPE_LABELS[resource.type] || "Resource";

  const inner = (
    <>
      <ImageWell
        src={resource.featuredImage}
        alt=""
        fallbackText={resource.title}
        ratio={featured ? "16/9" : "3/2"}
      />
      <div className={cn("flex flex-1 flex-col p-5", featured && "sm:p-7")}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="brand" size="sm">
            {typeLabel}
          </Badge>
          {resource.publishedDate ? (
            <span className="t-caption text-ink-500">{formatDate(resource.publishedDate)}</span>
          ) : null}
        </div>

        <h3 className={cn("text-ink-900 aba-clamp-2", featured ? "t-h3" : "t-h4")}>
          {resource.title}
        </h3>

        {resource.shortDescription ? (
          <p className={cn("mt-2 text-ink-600 aba-clamp-3", featured ? "t-body" : "t-small")}>
            {resource.shortDescription}
          </p>
        ) : null}

        {action ? (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 t-small font-semibold text-brand-700">
            {action.label}
            <action.icon size={15} aria-hidden="true" className="aba-arrow" />
          </span>
        ) : (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 t-caption text-ink-500">
            <FileText size={14} aria-hidden="true" />
            Coming soon
          </span>
        )}
      </div>
    </>
  );

  if (!action) {
    return <Card className="flex h-full flex-col">{inner}</Card>;
  }

  // An off-site link and a download are real anchors, not next/link — one
  // leaves the app and the other is a file, and the router should handle
  // neither.
  if (action.external) {
    return (
      <Card hover className="flex h-full flex-col">
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          {...(action.download ? { download: "" } : {})}
          aria-label={`${action.label}: ${resource.title}`}
          className="aba-focus flex h-full flex-col"
        >
          {inner}
        </a>
      </Card>
    );
  }

  return (
    <Card hover className="flex h-full flex-col">
      <Link
        href={action.href}
        aria-label={resource.title}
        className="aba-focus flex h-full flex-col"
      >
        {inner}
      </Link>
    </Card>
  );
}

export default ResourceCard;
