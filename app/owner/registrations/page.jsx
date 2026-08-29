"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { Search, Eye, X } from "lucide-react";
import { StatusPill } from "@/Components/owner/training/ResourceTable";
import { formatDateShort } from "@/lib/training/format";

/**
 * Registrations received from the public site.
 *
 * There is no payment column and no payment filter, because registration takes
 * no payment — see lib/payments/provider.js. What the owner needs here is who
 * asked, for what, and whether anyone has followed up.
 */
const STATUSES = ["pending", "contacted", "confirmed", "rejected", "cancelled", "completed"];

export default function RegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [courses, setCourses] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/owner/registrations", {
        params: { search, status, course: courseId, from, to, page, limit: 25 },
        withCredentials: true,
      });
      if (res.data?.success) {
        const d = res.data.data;
        setRows(d.items || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setCounts(d.counts || {});
      } else {
        toast.error(res.data?.error || "Could not load registrations");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not load registrations");
    } finally {
      setLoading(false);
    }
  }, [search, status, courseId, from, to, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  // The course filter's options. A failure here leaves the filter empty rather
  // than blocking the list it filters.
  useEffect(() => {
    axios
      .get("/api/owner/training/courses", { params: { limit: 200 }, withCredentials: true })
      .then((res) => setCourses(res.data?.data?.items || []))
      .catch(() => setCourses([]));
  }, []);

  // Any filter change puts you back on page 1 — staying on page 4 of a result
  // set that now has one page shows an empty table that looks like a bug.
  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const hasFilters = search || status || courseId || from || to;

  const clearAll = () => {
    setSearch("");
    setStatus("");
    setCourseId("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading ? "Loading…" : `${total} registration${total === 1 ? "" : "s"}`}
        </p>
      </header>

      {/* Status counts double as one-click filters. */}
      <div className="mb-5 flex flex-wrap gap-2">
        <CountChip
          label="All"
          count={Object.values(counts).reduce((a, b) => a + b, 0)}
          active={!status}
          onClick={() => changeFilter(setStatus)("")}
        />
        {STATUSES.map((s) => (
          <CountChip
            key={s}
            label={s}
            count={counts[s] || 0}
            active={status === s}
            onClick={() => changeFilter(setStatus)(s)}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => changeFilter(setSearch)(e.target.value)}
            placeholder="Search name, email, phone or reference…"
            aria-label="Search registrations"
            className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={courseId}
          onChange={(e) => changeFilter(setCourseId)(e.target.value)}
          aria-label="Filter by course"
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-500">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => changeFilter(setFrom)(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-500">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => changeFilter(setTo)(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-gray-500 hover:bg-gray-100"
          >
            <X size={14} /> Clear
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-4 last:border-0">
              {Array.from({ length: 6 }, (_, c) => (
                <div key={c} className="cms-skeleton h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : !rows.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-gray-900">
            {hasFilters ? "Nothing matches those filters" : "No registrations yet"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {hasFilters
              ? "Try widening the date range or clearing the course filter."
              : "Registrations submitted from the public site will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="aba-scroll-x">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["Reference", "Name", "Contact", "Course", "Session", "Received", "Status", ""].map(
                    (h, i) => (
                      <th key={h || i} className="px-4 py-3 font-semibold text-gray-600">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.reference}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/owner/registrations/${r._id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {r.fullName || "—"}
                      </Link>
                      {r.company ? (
                        <p className="text-xs text-gray-500">{r.company}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.email ? (
                        <a href={`mailto:${r.email}`} className="hover:text-blue-600">
                          {r.email}
                        </a>
                      ) : null}
                      {r.phone ? <p className="text-xs text-gray-500">{r.phone}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {/* The snapshot is the fallback: a course that was later
                          deleted must not blank the row that recorded it. */}
                      {r.course?.name || r.courseNameSnapshot || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.session?.referenceName || r.sessionNameSnapshot || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateShort(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusPill value={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/owner/registrations/${r._id}`}
                        aria-label={`View registration ${r.reference}`}
                        className="inline-flex rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CountChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
        active ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
      <span className={active ? "text-gray-300" : "text-gray-400"}>{count}</span>
    </button>
  );
}
