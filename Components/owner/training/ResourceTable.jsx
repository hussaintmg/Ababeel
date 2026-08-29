"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
  Minus,
} from "lucide-react";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { readPath } from "@/Components/owner/training/fieldSpecs";
import { formatDateShort } from "@/lib/training/format";

/**
 * The owner list screen for any training resource.
 *
 * Driven by the resource's spec, so courses, consultants and testimonials get
 * the same search, ordering, duplicate and delete behaviour without three
 * implementations of it.
 *
 * Deletes go through the existing ConfirmationModal, and a delete the server
 * refuses — a course that still has registrations — surfaces its reason rather
 * than a generic failure, because the reason tells the owner what to do
 * instead.
 */
export default function ResourceTable({ resource, spec }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/owner/training/${resource}`, {
        params: { search, status, limit: 200 },
        withCredentials: true,
      });
      if (res.data?.success) {
        setItems(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
      } else {
        toast.error(res.data?.error || "Could not load this list");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not load this list");
    } finally {
      setLoading(false);
    }
  }, [resource, search, status]);

  // Debounced so typing a search term is one request, not one per keystroke.
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const duplicate = async (id) => {
    setBusyId(id);
    try {
      const res = await axios.post(
        `/api/owner/training/${resource}/${id}/duplicate`,
        {},
        { withCredentials: true },
      );
      if (res.data?.success) {
        toast.success(`${spec.singular} duplicated as a draft`);
        load();
      } else {
        toast.error(res.data?.error || "Could not duplicate");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not duplicate");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (item) => {
    setBusyId(item._id);
    try {
      const res = await axios.delete(`/api/owner/training/${resource}/${item._id}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success(`${spec.singular} deleted`);
        setItems((prev) => prev.filter((i) => i._id !== item._id));
      } else {
        toast.error(res.data?.error || "Could not delete");
      }
    } catch (err) {
      // The server explains why a delete was refused ("this course has 4
      // registrations — archive it instead"). That sentence is the whole point,
      // so it is shown rather than replaced with "Delete failed".
      toast.error(err?.response?.data?.error || "Could not delete");
    } finally {
      setBusyId("");
      setConfirming(null);
    }
  };

  /**
   * Move a row and persist the whole new order.
   *
   * Sending the full list rather than a swap means the saved order always
   * matches what is on screen, even if two moves happen quickly.
   */
  const move = async (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await axios.post(
        `/api/owner/training/${resource}/reorder`,
        { ids: next.map((i) => i._id) },
        { withCredentials: true },
      );
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not save the new order");
      load();
    }
  };

  const canReorder = spec.reorderable && !search && !status;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{spec.label}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading…" : `${total} ${total === 1 ? spec.singular.toLowerCase() : "items"}`}
          </p>
        </div>
        <Link
          href={`/owner/training/${resource}/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} /> New {spec.singular}
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${spec.label.toLowerCase()}…`}
            aria-label={`Search ${spec.label}`}
            className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {spec.statusOptions ? (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {spec.statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label.split(" — ")[0]}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {loading ? (
        <TableSkeleton columns={spec.columns.length} />
      ) : !items.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-gray-900">
            {search || status ? "Nothing matches those filters" : `No ${spec.label.toLowerCase()} yet`}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {search || status
              ? "Try a different search term or clear the status filter."
              : `Create your first ${spec.singular.toLowerCase()} to get started.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="aba-scroll-x">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {canReorder && <th className="w-14 px-3 py-3" aria-label="Reorder" />}
                  {spec.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 font-semibold text-gray-600">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    {canReorder && (
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === items.length - 1}
                            aria-label="Move down"
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                    {spec.columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-middle">
                        <Cell item={item} col={col} resource={resource} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/owner/training/${resource}/${item._id}`}
                          aria-label={`Edit ${readPath(item, spec.columns[0].key) || "item"}`}
                          className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => duplicate(item._id)}
                          disabled={busyId === item._id}
                          aria-label="Duplicate"
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
                        >
                          {busyId === item._id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(item)}
                          aria-label="Delete"
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && remove(confirming)}
        title={`Delete this ${spec.singular.toLowerCase()}?`}
        message={`"${confirming ? readPath(confirming, spec.columns[0].key) : ""}" will be permanently removed. This cannot be undone.`}
        confirmText="Delete"
        type="delete"
      />
    </div>
  );
}

function Cell({ item, col, resource }) {
  const value = readPath(item, col.key);

  if (col.type === "status") return <StatusPill value={value} />;
  if (col.type === "boolean") {
    return value ? (
      <Check size={16} className="text-emerald-600" aria-label="Yes" />
    ) : (
      <Minus size={16} className="text-gray-300" aria-label="No" />
    );
  }
  if (col.type === "date") {
    return <span className="text-gray-600">{formatDateShort(value) || "—"}</span>;
  }

  if (col.primary) {
    const image = col.image ? readPath(item, col.image) : "";
    // Sessions often have no reference name of their own; showing the course
    // name is more useful than an empty cell.
    const label = value || readPath(item, "course.name") || "Untitled";
    return (
      <div className="flex items-center gap-3">
        {col.image ? (
          image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-gray-50 object-cover"
            />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
          )
        ) : null}
        <Link
          href={`/owner/training/${resource}/${item._id}`}
          className="font-semibold text-gray-900 hover:text-blue-600"
        >
          {label}
        </Link>
      </div>
    );
  }

  return <span className="text-gray-600">{value === 0 ? "0" : value || "—"}</span>;
}

const STATUS_TONES = {
  published: "bg-emerald-50 text-emerald-700",
  open: "bg-emerald-50 text-emerald-700",
  draft: "bg-gray-100 text-gray-600",
  disabled: "bg-gray-100 text-gray-600",
  archived: "bg-gray-100 text-gray-600",
  closed: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-red-50 text-red-700",
};

export function StatusPill({ value }) {
  if (!value) return <span className="text-gray-400">—</span>;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        STATUS_TONES[value] || "bg-gray-100 text-gray-600"
      }`}
    >
      {value}
    </span>
  );
}

function TableSkeleton({ columns }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white" aria-hidden="true">
      {Array.from({ length: 6 }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-gray-100 px-4 py-4 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <div key={c} className="cms-skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
