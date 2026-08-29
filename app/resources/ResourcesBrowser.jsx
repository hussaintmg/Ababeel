"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Container,
  SearchInput,
  Button,
  ResourceCard,
  CardGridSkeleton,
  NoResults,
  ErrorState,
  Pagination,
  LoadingAnnouncer,
  RevealStagger,
  cn,
} from "@/Components/ui";
import { RESOURCE_TYPE_LABELS } from "@/lib/training/constants";

/**
 * The interactive part of /resources.
 *
 * Same shape as CoursesBrowser: the first page is server-rendered and handed
 * in, and this only fetches once someone searches or picks a type.
 */
export default function ResourcesBrowser({ initial, types = [] }) {
  const [state, setState] = useState({
    items: initial.items || [],
    total: initial.total || 0,
    page: initial.page || 1,
    pages: initial.pages || 1,
  });
  const [query, setQuery] = useState({ search: "", type: "", page: 1 });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const pristine = useRef(true);
  const requestId = useRef(0);
  const top = useRef(null);

  const fetchPage = useCallback(async (next) => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
      const res = await fetch(`/api/training/resources?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (id !== requestId.current) return;

      if (data?.success) {
        setState({
          items: data.data.items || [],
          total: data.data.total || 0,
          page: data.data.page || 1,
          pages: data.data.pages || 1,
        });
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
    fetchPage(query);
  }, [query, fetchPage]);

  const update = (patch) => {
    pristine.current = false;
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  };

  const goToPage = (page) => {
    pristine.current = false;
    setQuery((prev) => ({ ...prev, page }));
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clear = () => {
    pristine.current = false;
    setQuery({ search: "", type: "", page: 1 });
  };

  return (
    <Container className="py-12 sm:py-16" >
      <div ref={top}>
        {/* Cards are h3; this keeps the outline from skipping h2. */}
        <h2 className="sr-only">Resource library</h2>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SearchInput
            value={query.search}
            onChange={(value) => update({ search: value })}
            placeholder="Search resources…"
            label="Search resources"
            className="min-w-52 flex-1"
          />
        </div>

        {/* Type chips. Only types with something published are offered — a
            chip that always returns nothing reads as a broken filter. */}
        {types.length > 0 && (
          <div className="aba-scroll-x mb-6 -mx-1 px-1 pb-1">
            <div className="flex min-w-max gap-2" role="group" aria-label="Filter by type">
              <TypeChip active={!query.type} onClick={() => update({ type: "" })} label="All" />
              {types.map((t) => (
                <TypeChip
                  key={t.value}
                  active={query.type === t.value}
                  onClick={() => update({ type: t.value })}
                  label={RESOURCE_TYPE_LABELS[t.value] || t.value}
                  count={t.count}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="t-small text-ink-500">
            {loading ? "Updating…" : `${state.total} resource${state.total === 1 ? "" : "s"}`}
          </p>
          {(query.type || query.search) && (
            <Button variant="link" onClick={clear} className="t-small">
              Clear
            </Button>
          )}
        </div>

        <LoadingAnnouncer loading={loading} label="Updating resources" />

        {failed ? (
          <ErrorState
            title="Could not load resources"
            message="Something went wrong fetching the library. Please try again."
            action={
              <Button variant="outline" onClick={() => fetchPage(query)}>
                Try again
              </Button>
            }
          />
        ) : loading ? (
          <CardGridSkeleton count={6} columns={3} />
        ) : !state.items.length ? (
          <NoResults
            message="No resources match your search. Try a different term, or clear the type filter."
            action={
              query.type || query.search ? (
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {state.items.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </RevealStagger>
        )}

        <Pagination page={state.page} pages={state.pages} onChange={goToPage} className="mt-12" />
      </div>
    </Container>
  );
}

function TypeChip({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "aba-focus flex h-11 items-center gap-1.5 rounded-lg px-4 t-small font-semibold transition-colors",
        active ? "bg-ink-900 text-white" : "border border-ink-200 text-ink-600 hover:bg-ink-50",
      )}
    >
      {label}
      {count !== undefined && (
        <span className={active ? "text-ink-300" : "text-ink-400"}>{count}</span>
      )}
    </button>
  );
}
