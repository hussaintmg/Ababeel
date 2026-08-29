import {
  Section,
  Container,
  Breadcrumb,
  AwardingBodyCard,
  EmptyState,
  LinkButton,
  RevealStagger,
} from "@/Components/ui";
import CmsSlot from "@/Components/cms/CmsSlot";
import { listAwardingBodies } from "@/lib/training/queries";
import { trainingMetadata } from "@/lib/training/metadata";

/**
 * Every published awarding body. Only `status: published` reaches this list —
 * the filter is inside `listAwardingBodies`, not here.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Awarding Bodies", null, {
    title: "Awarding Bodies",
    description:
      "The awarding organisations behind our accredited safety and professional development qualifications.",
  });
}

export default async function AwardingBodiesPage() {
  const bodies = await listAwardingBodies();

  return (
    <CmsSlot pageKey="awarding-bodies">
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[{ label: "Home", href: "/" }, { label: "Awarding Bodies" }]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">Accreditation</p>
          <h1 className="t-h1 max-w-3xl text-white">Our awarding bodies</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            Every qualification we deliver is awarded by a recognised organisation. Here is who
            stands behind each one.
          </p>
        </Container>
      </Section>

      <Section tone="light" size="md">
        <Container>
          {bodies.length ? (
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bodies.map((body) => (
                <AwardingBodyCard key={body._id} body={body} />
              ))}
            </RevealStagger>
          ) : (
            <EmptyState
              title="No awarding bodies published yet"
              message="Our accreditation details will appear here shortly."
              action={<LinkButton href="/courses">Browse courses</LinkButton>}
            />
          )}
        </Container>
      </Section>
    </CmsSlot>
  );
}
