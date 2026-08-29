import { notFound } from "next/navigation";
import { Download, ExternalLink, Calendar } from "lucide-react";
import {
  Section,
  Container,
  Breadcrumb,
  Badge,
  ImageWell,
  LinkButton,
  ResourceCard,
  RevealStagger,
  Reveal,
} from "@/Components/ui";
import { getResourceBySlug, getRelatedResources } from "@/lib/training/queries";
import { trainingMetadata } from "@/lib/training/metadata";
import { formatDate, stripHtml, truncate } from "@/lib/training/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/training/constants";

/** One resource. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) return trainingMetadata("Resource not found");

  return trainingMetadata(resource.title, resource, {
    title: resource.title,
    description: resource.shortDescription || truncate(stripHtml(resource.content), 200),
    image: resource.featuredImage,
  });
}

export default async function ResourceDetailPage({ params }) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) notFound();

  const related = await getRelatedResources(resource, 3);
  const typeLabel = RESOURCE_TYPE_LABELS[resource.type] || "Resource";

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container size="prose">
          <Breadcrumb
            dark
            items={[
              { label: "Home", href: "/" },
              { label: "Resources", href: "/resources" },
              { label: resource.title },
            ]}
            className="mb-6"
          />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge tone="light">{typeLabel}</Badge>
            {resource.publishedDate ? (
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-300">
                <Calendar size={13} aria-hidden="true" />
                {formatDate(resource.publishedDate)}
              </span>
            ) : null}
          </div>

          <h1 className="t-h1 text-white">{resource.title}</h1>
          {resource.shortDescription ? (
            <p className="t-body-lg mt-4 text-ink-200">{resource.shortDescription}</p>
          ) : null}

          {/* Both are offered when both exist — the file and the source are
              different things, and a guide can legitimately have each. */}
          <div className="mt-8 flex flex-wrap gap-3">
            {resource.file ? (
              <LinkButton href={resource.file} external size="lg">
                <Download size={16} aria-hidden="true" />
                {resource.fileLabel || "Download"}
              </LinkButton>
            ) : null}
            {resource.externalUrl ? (
              <LinkButton
                href={resource.externalUrl}
                external
                size="lg"
                variant={resource.file ? "outlineLight" : "primary"}
              >
                <ExternalLink size={16} aria-hidden="true" />
                Open resource
              </LinkButton>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section tone="light" size="md">
        <Container size="prose">
          {resource.featuredImage ? (
            <Reveal className="mb-10">
              <ImageWell
                src={resource.featuredImage}
                alt=""
                ratio="16/9"
                zoom={false}
                priority
                className="rounded-xl"
              />
            </Reveal>
          ) : null}

          {resource.content ? (
            <Reveal>
              <div
                className="cms-prose t-body text-ink-700"
                dangerouslySetInnerHTML={{ __html: resource.content }}
              />
            </Reveal>
          ) : (
            <p className="t-body text-ink-600">
              {resource.file || resource.externalUrl
                ? "Use the button above to open this resource."
                : "This resource has no content yet."}
            </p>
          )}
        </Container>
      </Section>

      {related.length ? (
        <Section tone="muted" size="md">
          <Container>
            <h2 className="t-h2 mb-8 text-ink-900">More resources</h2>
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ResourceCard key={item._id} resource={item} />
              ))}
            </RevealStagger>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
