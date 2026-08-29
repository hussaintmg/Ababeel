import { Section, Container, Breadcrumb } from "@/Components/ui";
import {
  getScheduleForMonth,
  getScheduleMonths,
  listAwardingBodies,
} from "@/lib/training/queries";
import { getTrainingSettings } from "@/lib/training/settings";
import { trainingMetadata } from "@/lib/training/metadata";
import ScheduleBrowser from "@/app/schedule/ScheduleBrowser";

/**
 * The public training schedule.
 *
 * Built from course references, not from a separate schedule collection: a
 * session appears here when `showInSchedule` is on and its status is publicly
 * valid, so there is nothing to keep in step and no way for the two to
 * disagree.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return trainingMetadata("Training Schedule", null, {
    title: "Training Schedule",
    description:
      "Upcoming dates for our accredited safety training courses, with start, end and examination dates.",
  });
}

export default async function SchedulePage() {
  // UTC throughout: a session on the 1st belongs to that month for every
  // visitor, not just the ones east of Greenwich.
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const [sessions, months, bodies, training] = await Promise.all([
    getScheduleForMonth({ year, month }),
    getScheduleMonths(),
    listAwardingBodies(),
    getTrainingSettings(),
  ]);

  const copy = training?.schedule || {};

  return (
    <>
      <Section tone="dark" size="sm" className="pt-10">
        <Container>
          <Breadcrumb
            dark
            items={[{ label: "Home", href: "/" }, { label: "Schedule" }]}
            className="mb-6"
          />
          <p className="t-eyebrow mb-3 text-brand-400">Upcoming dates</p>
          <h1 className="t-h1 max-w-3xl text-white">{copy.title || "Training Schedule"}</h1>
          <p className="t-body-lg mt-4 max-w-2xl text-ink-200">
            {copy.intro || "Upcoming sessions across all of our accredited programmes."}
          </p>
        </Container>
      </Section>

      <ScheduleBrowser
        initial={{ year, month, sessions, months }}
        awardingBodies={bodies}
        emptyMessage={copy.emptyMessage}
      />
    </>
  );
}
