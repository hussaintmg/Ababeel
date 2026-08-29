/**
 * Shimmer skeleton for dashboard content areas (owner / admin / user).
 *
 * Shown by the dashboards' loading.jsx while a page's server payload is on
 * its way. The sidebar and topbar belong to the layout and stay interactive;
 * this fills only the content column with the shape most dashboard pages
 * have: a heading, a stat row, and a table.
 */
export default function DashboardSkeleton() {
  return (
    <div className="w-full p-4 md:p-6" aria-hidden="true" role="status">
      <span className="sr-only">Loading…</span>

      {/* Page heading */}
      <div className="cms-skeleton h-7 w-56" />
      <div className="cms-skeleton mt-2 h-4 w-80 max-w-full" />

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="cms-skeleton h-4 w-20" />
            <div className="cms-skeleton mt-3 h-7 w-14" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="cms-skeleton h-5 w-40" />
          <div className="cms-skeleton h-9 w-28 rounded-lg" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="cms-skeleton h-9 w-9 rounded-full" />
              <div className="cms-skeleton h-4 w-1/3" />
              <div className="cms-skeleton h-4 w-1/4" />
              <div className="cms-skeleton ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
