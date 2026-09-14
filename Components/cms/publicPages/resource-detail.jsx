// Extracted from app/resources/[slug]/page.jsx; original layouts with typed CMS content.
"use client";

import { notFound } from "next/navigation";
import { Download, ExternalLink, Calendar } from "lucide-react";
import { Section, Container, Breadcrumb, Badge, ImageWell, LinkButton, ResourceCard, RevealStagger, Reveal } from "@/Components/ui";
import { formatDate, stripHtml, truncate } from "@/lib/training/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/training/constants";
import defaults from "./resource-detail.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const {
    resource,
    related,
    typeLabel
  } = {
    ...{
      "resource": {
        "title": "Choose a published resource"
      },
      "related": [],
      "typeLabel": "Resource"
    },
    ...(cmsProps._data || {})
  };
  const cms = {
    ...defaults,
    ...cmsProps
  };
  return <>
    
      {(cmsProps.section == null || cmsProps.section === 0) && <Section tone="dark" size="sm" className="pt-10">
        <Container size="prose">
          <Breadcrumb dark items={[{
          label: cms.label_Home_1,
          href: cms.href___2
        }, {
          label: cms.label_Resources_3,
          href: cms.href__resources_4
        }, {
          label: resource.title
        }]} className="mb-6" />
          

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge tone="light">{typeLabel}</Badge>
            {resource.publishedDate ? <span className="inline-flex items-center gap-1.5 t-caption text-ink-300">
                <Calendar size={13} aria-hidden="true" />
                {formatDate(resource.publishedDate)}
              </span> : null}
          </div>

          <h1 className="t-h1 text-white">{resource.title}</h1>
          {resource.shortDescription ? <p className="t-body-lg mt-4 text-ink-200">{resource.shortDescription}</p> : null}

          {}
          <div className="mt-8 flex flex-wrap gap-3">
            {resource.file ? <LinkButton href={resource.file} external size="lg">
                <Download size={16} aria-hidden="true" />
                {resource.fileLabel || "Download"}
              </LinkButton> : null}
            {resource.externalUrl ? <LinkButton href={resource.externalUrl} external size="lg" variant={resource.file ? "outlineLight" : "primary"}>
              
                <ExternalLink size={16} aria-hidden="true" />{cms.Text_Open_resource_5}</LinkButton> : null}
          </div>
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 1) && <Section tone="light" size="md">
        <Container size="prose">
          {resource.featuredImage ? <Reveal className="mb-10">
              <ImageWell src={resource.featuredImage} alt={cms.alt__6} ratio="16/9" zoom={false} priority className="rounded-xl" />
            
            </Reveal> : null}

          {resource.content ? <Reveal>
              <div className="cms-prose t-body text-ink-700" dangerouslySetInnerHTML={{
            __html: resource.content
          }} />
            
            </Reveal> : <p className="t-body text-ink-600">
              {resource.file || resource.externalUrl ? "Use the button above to open this resource." : "This resource has no content yet."}
            </p>}
        </Container>
      </Section>}

      {(cmsProps.section == null || cmsProps.section === 2) && (related.length ? <Section tone="muted" size="md">
          <Container>
            <h2 className="t-h2 mb-8 text-ink-900">{cms.Heading_More_resources_7}</h2>
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(item => <ResourceCard key={item._id} resource={item} />)}
            </RevealStagger>
          </Container>
        </Section> : null)}
    </>;
}
