"use client";

/**
 * Animated shimmer skeleton shown while a page's content loads, so the visitor
 * sees an intentional loading placeholder instead of a blank flash or a jump
 * when CMS/backend data arrives. Purely presentational.
 *
 * Renders a hero band + intro lines + a card row + a text block, which loosely
 * matches the shape of most public pages.
 */
export default function PageSkeleton() {
  return (
    <div className="w-full" aria-hidden="true" role="status">
      <span className="sr-only">Loading…</span>

      {/* Hero band */}
      <div className="relative w-full h-[52vh] min-h-[340px] overflow-hidden bg-slate-900">
        <div className="cms-skeleton cms-skeleton-dark absolute inset-0 !rounded-none" />
        <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-center gap-4">
          <div className="cms-skeleton cms-skeleton-dark h-4 w-28 rounded-full" />
          <div className="cms-skeleton cms-skeleton-dark h-9 w-3/4 max-w-2xl" />
          <div className="cms-skeleton cms-skeleton-dark h-9 w-2/3 max-w-xl" />
          <div className="cms-skeleton cms-skeleton-dark h-4 w-1/2 max-w-md mt-2" />
          <div className="flex gap-3 mt-4">
            <div className="cms-skeleton cms-skeleton-dark h-11 w-36 rounded-xl" />
            <div className="cms-skeleton cms-skeleton-dark h-11 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Intro lines */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex flex-col items-center gap-3">
          <div className="cms-skeleton h-7 w-64" />
          <div className="cms-skeleton h-4 w-full max-w-2xl" />
          <div className="cms-skeleton h-4 w-3/4 max-w-xl" />
        </div>

        {/* Card row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="cms-skeleton h-12 w-12 rounded-xl mb-4" />
              <div className="cms-skeleton h-5 w-2/3 mb-3" />
              <div className="cms-skeleton h-3.5 w-full mb-2" />
              <div className="cms-skeleton h-3.5 w-5/6 mb-2" />
              <div className="cms-skeleton h-3.5 w-4/6" />
            </div>
          ))}
        </div>

        {/* Text block */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <div className="cms-skeleton h-4 w-full max-w-3xl" />
          <div className="cms-skeleton h-4 w-full max-w-3xl" />
          <div className="cms-skeleton h-4 w-2/3 max-w-xl" />
        </div>
      </div>
    </div>
  );
}
