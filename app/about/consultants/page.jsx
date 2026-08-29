import {
  Section,
  Container,
  Breadcrumb,
  ConsultantProfile,
  EmptyState,
  LinkButton,
} from "@/Components/ui";
import { listConsultants } from "@/lib/training/queries";
import { trainingMetadata } from "@/lib/training/metadata";

/**
 * Our consultants.
 *
 * Each profile renders in the layout stored on the consultant, so the page is
 * an editorial sequence rather than a uniform grid — which is the point of
 * giving each one a layout in the first place.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Our Consultants", null, {
    title: "Our Consultants",
    description:
      "Independent safety consultants and subject-matter experts working with ABA Safety.",
  });
}

export default async function ConsultantsPage() {
  const consultants = await listConsultants();

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[
              { label: "Home", href: "/" },
              { label: "About", href: "/about-us" },
              { label: "Our Consultants" },
            ]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">Expertise</p>
          <h1 className="t-h1 max-w-3xl text-white">Our consultants</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            Subject-matter specialists who advise, audit and train across industry.
          </p>
        </Container>
      </Section>

      <Section tone="light" size="md">
        <Container>
          {consultants.length ? (
            <div className="space-y-20 lg:space-y-28">
              {consultants.map((consultant, index) => (
                <ConsultantProfile key={consultant._id} consultant={consultant} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Consultant profiles coming soon"
              message="We are preparing profiles for our consultant team. Contact us and we will connect you with the right specialist."
              action={<LinkButton href="/contact-us">Contact us</LinkButton>}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
