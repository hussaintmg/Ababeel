"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Container,
  Select,
  Button,
  SessionCard,
  ScheduleSkeleton,
  EmptyState,
  ErrorState,
  LoadingAnnouncer,
  RevealStagger,
  cn,
} from "@/Components/ui";
import { MONTH_NAMES, MONTH_ABBR, formatMonth } from "@/lib/training/format";

/**
 * The public schedule.
 *
 * The current month is server-rendered and handed in; this component fetches
 * only when the visitor moves to another month or applies a filter.
 *
 * Months with nothing in them are still selectable, on purpose. A schedule that
 * silently hides empty months makes a visitor wonder whether they missed
 * something; one that says "no sessions in March" answers the question.
 */
export default function ScheduleBrowser({ initial, awardingBodies = [], emptyMessage }) {
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [mode, setMode] = useState("");
  const [awardingBody, setAwardingBody] = useState("");

  const [sessions, setSessions] = useState(initial.sessions || []);
  const [monthsWithSessions, setMonthsWithSessions] = useState(initial.months || []);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const pristine = useRef(true);
  const requestId = useRef(0);

  const load = useCallback(async (next) => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams({
        year: String(next.year),
        month: String(next.month),
        withMonths: "1",
      });
      if (next.mode) params.set("mode", next.mode);
      if (next.awardingBody) params.set("awardingBody", next.awardingBody);

      const res = await fetch(`/api/training/schedule?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (id !== requestId.current) return;

      if (data?.success) {
        setSessions(data.data.sessions || []);
        if (data.data.months) setMonthsWithSessions(data.data.months);
      } else {
        setFailed(true);
      }
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pristine.current) return;
    load({ year, month, mode, awardingBody });
  }, [year, month, mode, awardingBody, load]);

  const go = (nextYear, nextMonth) => {
    pristine.current = false;
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const step = (delta) => {
    // December → January rolls the year, which is the whole reason this is not
    // just `setMonth(month + delta)`.
    const zero = month - 1 + delta;
    go(year + Math.floor(zero / 12), ((zero % 12) + 12) % 12 + 1);
  };

  const hasSessions = (m) =>
    monthsWithSessions.includes(`${year}-${String(m).padStart(2, "0")}`);

  return (
    <Container className="py-12 sm:py-16">
      {/* Session cards are h3; this keeps the outline from skipping h2. */}
      <h2 className="sr-only">Training sessions by month</h2>

      {/* Month navigation */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="aba-focus inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
          >
            <ChevronLeft size={18} />
          </button>

          <p className="t-h3 text-ink-900" aria-live="polite">
            {formatMonth(year, month)}
          </p>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="aba-focus inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Twelve months, scrollable on a phone rather than wrapped into a
            three-row block that pushes the results off the screen. */}
        <div className="aba-scroll-x -mx-1 px-1 pb-1">
          <div className="flex min-w-max gap-1.5" role="tablist" aria-label="Choose a month">
            {MONTH_NAMES.map((name, i) => {
              const value = i + 1;
              const active = value === month;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => go(year, value)}
                  className={cn(
                    "aba-focus relative flex h-11 items-center rounded-lg px-4 t-small font-semibold transition-colors",
                    active
                      ? "bg-ink-900 text-white"
                      : "text-ink-600 hover:bg-ink-100",
                  )}
                >
                  <span className="sm:hidden">{MONTH_ABBR[i]}</span>
                  <span className="hidden sm:inline">{name}</span>
                  {/* A dot marks a month that has something in it, so a
                      visitor can find the next available dates at a glance. */}
                  {!active && hasSessions(value) ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 mx-auto h-1 w-1 rounded-full bg-brand-500"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-end gap-3">
        <Select
          label="Delivery mode"
          value={mode}
          onChange={(value) => {
            pristine.current = false;
            setMode(value);
          }}
          className="w-44"
          options={[
            { value: "", label: "All modes" },
            { value: "online", label: "Online" },
            { value: "physical", label: "In person" },
            { value: "hybrid", label: "Hybrid" },
            { value: "other", label: "Other" },
          ]}
        />
        {awardingBodies.length > 0 && (
          <Select
            label="Awarding body"
            value={awardingBody}
            onChange={(value) => {
              pristine.current = false;
              setAwardingBody(value);
            }}
            className="w-56"
            options={[
              { value: "", label: "All awarding bodies" },
              ...awardingBodies.map((b) => ({ value: b.slug, label: b.name })),
            ]}
          />
        )}
        <div className="ml-auto flex items-center gap-3">
          <p className="t-small text-ink-500">
            {loading ? "Updating…" : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date();
              go(now.getUTCFullYear(), now.getUTCMonth() + 1);
            }}
          >
            This month
          </Button>
        </div>
      </div>

      <LoadingAnnouncer loading={loading} label="Updating the schedule" />

      {failed ? (
        <ErrorState
          title="Could not load the schedule"
          message="Something went wrong fetching the session dates. Please try again."
          action={
            <Button variant="outline" onClick={() => load({ year, month, mode, awardingBody })}>
              Try again
            </Button>
          }
        />
      ) : loading ? (
        <ScheduleSkeleton count={4} />
      ) : !sessions.length ? (
        <EmptyState
          title={`Nothing scheduled in ${formatMonth(year, month)}`}
          message={
            mode || awardingBody
              ? "No sessions match these filters this month. Try clearing a filter or looking at another month."
              : emptyMessage || "No training sessions are currently scheduled for this month."
          }
          action={
            <Button variant="outline" onClick={() => step(1)}>
              Look at {MONTH_NAMES[month % 12]}
            </Button>
          }
        />
      ) : (
        // Keyed by month so switching months replays the reveal rather than
        // swapping the text underneath cards that are already on screen.
        <RevealStagger key={`${year}-${month}`} className="space-y-4">
          {sessions.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </RevealStagger>
      )}
    </Container>
  );
}
