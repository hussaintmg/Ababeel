import { ExternalLink } from "lucide-react";
import {
  Section,
  Container,
  Breadcrumb,
  Card,
  LogoTile,
  ImageWell,
  EmptyState,
  LinkButton,
  SectionHeading,
  Reveal,
  RevealStagger,
} from "@/Components/ui";
import { listAccreditations, listAwardingBodies } from "@/lib/training/queries";
import { trainingMetadata } from "@/lib/training/metadata";

/**
 * Accreditations and certifications.
 *
 * Two distinct things on one page: what ABA Safety itself holds
 * (Accreditation records), and who awards the qualifications learners earn
 * (AwardingBody records). Conflating them would overstate the first.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Accreditations & Certifications", null, {
    title: "Accreditations & Certifications",
    description:
      "The approvals, memberships and awarding-body relationships behind ABA Safety's training.",
  });
}

export default async function AccreditationsPage() {
  const [accreditations, bodies] = await Promise.all([
    listAccreditations(),
    listAwardingBodies(),
  ]);

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[
              { label: "Home", href: "/" },
              { label: "About", href: "/about-us" },
              { label: "Accreditations" },
            ]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">Credentials</p>
          <h1 className="t-h1 max-w-3xl text-white">Accreditations &amp; certifications</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            The approvals and memberships that stand behind the training we deliver.
          </p>
        </Container>
      </Section>

      <Section tone="light" size="md">
        <Container>
          {accreditations.length ? (
            <div className="space-y-8">
              {accreditations.map((item) => (
                <Reveal key={item._id}>
                  <Card className="p-6 sm:p-8">
                    <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
                      <div className="space-y-4">
                        <LogoTile src={item.logo} alt="" name={item.name} />
                        {item.image ? (
                          <ImageWell
                            src={item.image}
                            alt={`${item.name} certificate`}
                            ratio="4/3"
                            zoom={false}
                            className="rounded-lg"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <h2 className="t-h3 text-ink-900">{item.name}</h2>
                        {item.referenceNumber ? (
                          <p className="t-caption mt-1 font-mono text-ink-500">
                            {item.referenceNumber}
                          </p>
                        ) : null}
                        {item.description ? (
                          <p className="t-body mt-3 text-ink-700">{item.description}</p>
                        ) : null}
                        {item.details ? (
                          <div
                            className="cms-prose t-small mt-4 text-ink-600"
                            dangerouslySetInnerHTML={{ __html: item.details }}
                          />
                        ) : null}
                        {item.website ? (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aba-focus mt-5 inline-flex items-center gap-1.5 t-small font-semibold text-brand-600 hover:text-brand-700"
                          >
                            Verify with the issuing body
                            <ExternalLink size={14} aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Accreditation details coming soon"
              message="We are preparing this page. Contact us if you need our accreditation details in the meantime."
              action={<LinkButton href="/contact-us">Contact us</LinkButton>}
            />
          )}
        </Container>
      </Section>

      {bodies.length ? (
        <Section tone="muted" size="md">
          <Container>
            <SectionHeading
              eyebrow="Qualifications"
              title="Who awards our qualifications"
              lead="Accreditation of the organisation is one thing; who awards a learner's certificate is another. These are the awarding bodies behind our courses."
            />
            <RevealStagger className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {bodies.map((body) => (
                <a
                  key={body._id}
                  href={`/awarding-bodies/${body.slug}`}
                  className="aba-focus block"
                  aria-label={body.name}
                >
                  <LogoTile src={body.logo} alt="" name={body.name} className="hover:border-ink-200" />
                </a>
              ))}
            </RevealStagger>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
