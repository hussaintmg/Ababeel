"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Container,
  SearchInput,
  Select,
  FilterGroup,
  FilterTrigger,
  Drawer,
  Button,
  CourseCard,
  CardGridSkeleton,
  NoResults,
  ErrorState,
  Pagination,
  LoadingAnnouncer,
  RevealStagger,
} from "@/Components/ui";

/**
 * The interactive part of /courses.
 *
 * The first page of results is rendered on the server and handed in as
 * `initial`, so the catalogue is in the HTML for search engines and appears
 * without a loading state. This component takes over only once someone
 * actually filters — which is why it starts by rendering exactly what the
 * server already produced rather than fetching it again on mount.
 */
export default function CoursesBrowser({ initial, filters, cardTemplate = "standard", perPage = 12 }) {
  const [state, setState] = useState({
    items: initial.items || [],
    total: initial.total || 0,
    page: initial.page || 1,
    pages: initial.pages || 1,
  });
  const [query, setQuery] = useState({
    search: "",
    level: "",
    awardingBody: "",
    category: "",
    duration: "",
    sort: "recommended",
    page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // True until the visitor touches a control. While it holds, the server's
  // results stand and no request is made.
  const pristine = useRef(true);
  // Guards against an early slow response overwriting a later fast one.
  const requestId = useRef(0);
  const resultsTop = useRef(null);

  const fetchPage = useCallback(async (next) => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
      params.set("limit", String(perPage));

      const res = await fetch(`/api/training/courses?${params}`, { cache: "no-store" });
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
  }, [perPage]);

  useEffect(() => {
    if (pristine.current) return;
    fetchPage(query);
  }, [query, fetchPage]);

  const update = (patch) => {
    pristine.current = false;
    // Any change but paging returns to page 1: staying on page 4 of a result
    // set that now has one page shows an empty grid that reads as a bug.
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
    setDrawerOpen(false);
  };

  const goToPage = (page) => {
    pristine.current = false;
    setQuery((prev) => ({ ...prev, page }));
    resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearAll = () => {
    pristine.current = false;
    setQuery({
      search: "",
      level: "",
      awardingBody: "",
      category: "",
      duration: "",
      sort: "recommended",
      page: 1,
    });
    setDrawerOpen(false);
  };

  const activeCount = ["level", "awardingBody", "category", "duration"].filter(
    (k) => query[k],
  ).length;

  const panel = (
    <FilterPanel filters={filters} query={query} update={update} onClear={clearAll} activeCount={activeCount} />
  );

  return (
    <Container className="py-12 sm:py-16">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block" aria-label="Filter courses">
          <div className="sticky top-24">{panel}</div>
        </aside>

        <div ref={resultsTop}>
          {/* The course cards are h3. Without this the document outline goes
              h1 (hero) straight to h3, which is what a screen-reader user
              navigates by — so the results region names itself, visually
              silently. */}
          <h2 className="sr-only">Course results</h2>

          {/* Search, sort, and the mobile filter trigger */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <SearchInput
              value={query.search}
              onChange={(value) => update({ search: value })}
              placeholder="Search courses…"
              className="min-w-52 flex-1"
            />
            <FilterTrigger
              activeCount={activeCount}
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden"
            />
            <Select
              label="Sort by"
              srOnlyLabel
              value={query.sort}
              onChange={(value) => update({ sort: value })}
              className="w-44"
              options={[
                { value: "recommended", label: "Recommended" },
                { value: "newest", label: "Newest first" },
                { value: "name", label: "Name A–Z" },
                { value: "name-desc", label: "Name Z–A" },
                { value: "duration", label: "Shortest first" },
              ]}
            />
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="t-small text-ink-500">
              {loading
                ? "Updating…"
                : `${state.total} course${state.total === 1 ? "" : "s"}`}
            </p>
            {activeCount > 0 && (
              <Button variant="link" onClick={clearAll} className="t-small">
                Clear filters
              </Button>
            )}
          </div>

          <LoadingAnnouncer loading={loading} label="Updating course results" />

          {failed ? (
            <ErrorState
              title="Could not load courses"
              message="Something went wrong fetching the catalogue. Please try again."
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
              message="No courses match your selected filters. Try removing a filter or searching for something broader."
              action={
                activeCount || query.search ? (
                  <Button variant="outline" onClick={clearAll}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {state.items.map((course) => (
                <CourseCard key={course._id} course={course} template={cardTemplate} />
              ))}
            </RevealStagger>
          )}

          <Pagination page={state.page} pages={state.pages} onChange={goToPage} className="mt-12" />
        </div>
      </div>

      {/* Mobile filters */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter courses"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={clearAll}>
              Clear all
            </Button>
            <Button fullWidth onClick={() => setDrawerOpen(false)}>
              Show {state.total} result{state.total === 1 ? "" : "s"}
            </Button>
          </div>
        }
      >
        {panel}
      </Drawer>
    </Container>
  );
}

function FilterPanel({ filters, query, update }) {
  const levels = filters?.levels || [];
  const bodies = filters?.awardingBodies || [];
  const categories = filters?.categories || [];

  return (
    <div className="space-y-7">
      {levels.length > 0 && (
        <FilterGroup
          title="Level"
          value={query.level}
          onChange={(value) => update({ level: value })}
          allLabel="All levels"
          options={levels.map((l) => ({ value: l.slug, label: l.name }))}
        />
      )}

      {bodies.length > 0 && (
        <FilterGroup
          title="Awarding body"
          value={query.awardingBody}
          onChange={(value) => update({ awardingBody: value })}
          allLabel="All bodies"
          options={bodies.map((b) => ({ value: b.slug, label: b.name }))}
        />
      )}

      <FilterGroup
        title="Duration"
        value={query.duration}
        onChange={(value) => update({ duration: value })}
        allLabel="Any duration"
        options={[
          { value: "short", label: "1–2 days" },
          { value: "medium", label: "3–5 days" },
          { value: "long", label: "6 days or more" },
        ]}
      />

      {categories.length > 0 && (
        <FilterGroup
          title="Category"
          value={query.category}
          onChange={(value) => update({ category: value })}
          allLabel="All categories"
          options={categories.map((c) => ({ value: c, label: c }))}
        />
      )}
    </div>
  );
}
