import {
  Section,
  Container,
  Breadcrumb,
  PersonCard,
  EmptyState,
  LinkButton,
  SectionHeading,
  RevealStagger,
} from "@/Components/ui";
import { listTeamMembers } from "@/lib/training/queries";
import { trainingMetadata } from "@/lib/training/metadata";

/**
 * Our team.
 *
 * Leadership sorts first and is shown in a wider grid, so the people who
 * represent the organisation are not lost among twenty equal tiles.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Our Team", null, {
    title: "Our Team",
    description: "The people behind ABA Safety's training and consultancy work.",
  });
}

export default async function TeamPage() {
  const members = await listTeamMembers();
  const leadership = members.filter((m) => m.leadership);
  const rest = members.filter((m) => !m.leadership);

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[{ label: "Home", href: "/" }, { label: "About", href: "/about-us" }, { label: "Our Team" }]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">People</p>
          <h1 className="t-h1 max-w-3xl text-white">Our team</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            Practitioners, trainers and assessors who have done the work they teach.
          </p>
        </Container>
      </Section>

      <Section tone="light" size="md">
        <Container>
          {!members.length ? (
            <EmptyState
              title="Our team page is on its way"
              message="We are putting together profiles for the team. In the meantime, get in touch and we will point you to the right person."
              action={<LinkButton href="/contact-us">Contact us</LinkButton>}
            />
          ) : (
            <>
              {leadership.length ? (
                <>
                  <SectionHeading eyebrow="Leadership" title="Who leads the work" />
                  <RevealStagger className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {leadership.map((person) => (
                      <PersonCard key={person._id} person={person} />
                    ))}
                  </RevealStagger>
                </>
              ) : null}

              {rest.length ? (
                <>
                  {leadership.length ? (
                    <SectionHeading title="The wider team" className="mt-20" />
                  ) : null}
                  <RevealStagger className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {rest.map((person) => (
                      <PersonCard key={person._id} person={person} showBio={false} />
                    ))}
                  </RevealStagger>
                </>
              ) : null}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
