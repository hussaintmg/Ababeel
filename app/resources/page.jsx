import { Section, Container, Breadcrumb, ResourceCard, Reveal } from "@/Components/ui";
import { listPublicResources, getResourceTypes } from "@/lib/training/queries";
import { trainingMetadata } from "@/lib/training/metadata";
import ResourcesBrowser from "@/app/resources/ResourcesBrowser";

/**
 * The resource library.
 *
 * A featured resource is pulled out above the grid when one is flagged, so the
 * page has something to lead with rather than opening on an undifferentiated
 * grid of twelve equal cards.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Resources", null, {
    title: "Resources",
    description:
      "Guides, articles and downloads on workplace safety, competence and professional development.",
  });
}

export default async function ResourcesPage() {
  const [initial, types] = await Promise.all([
    listPublicResources({ limit: 12 }),
    getResourceTypes(),
  ]);

  // Only lead with a featured item on the unfiltered first page, and only when
  // there is enough behind it that pulling one out still leaves a grid.
  const featured = initial.items.length > 3 ? initial.items.find((r) => r.featured) : null;

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[{ label: "Home", href: "/" }, { label: "Resources" }]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">Knowledge</p>
          <h1 className="t-h1 max-w-3xl text-white">Resources</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            Guides, articles and downloads from our training and consultancy work.
          </p>
        </Container>
      </Section>

      {featured ? (
        <Section tone="muted" size="sm">
          <Container>
            <Reveal>
              <p className="t-eyebrow mb-4 text-brand-700">Featured</p>
              <div className="max-w-4xl">
                <ResourceCard resource={featured} featured />
              </div>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      <ResourcesBrowser initial={initial} types={types} />
    </>
  );
}
