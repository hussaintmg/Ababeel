"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Loader2, Trash2, Send } from "lucide-react";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { StatusPill } from "@/Components/owner/training/ResourceTable";
import { formatDate, formatDateRange } from "@/lib/training/format";
import { modeLabel } from "@/lib/training/status";

/**
 * One registration.
 *
 * The submitted answers are shown exactly as they were sent and are not
 * editable: this is a record of what a person told us, and an owner's own
 * commentary belongs in the internal notes below it, which are appended so the
 * history stays intact.
 */
const STATUSES = ["pending", "contacted", "confirmed", "rejected", "cancelled", "completed"];

export default function RegistrationDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [reg, setReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`/api/owner/registrations/${id}`, { withCredentials: true });
        if (cancelled) return;
        if (res.data?.success) setReg(res.data.data);
        else setError(res.data?.error || "Could not load this registration");
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "Could not load this registration");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const patch = async (body, successMessage) => {
    setSaving(true);
    try {
      const res = await axios.patch(`/api/owner/registrations/${id}`, body, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setReg(res.data.data);
        toast.success(successMessage);
        return true;
      }
      toast.error(res.data?.error || "Could not save");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not save");
    } finally {
      setSaving(false);
    }
    return false;
  };

  const addNote = async () => {
    if (!note.trim()) return;
    if (await patch({ note }, "Note added")) setNote("");
  };

  const remove = async () => {
    try {
      await axios.delete(`/api/owner/registrations/${id}`, { withCredentials: true });
      toast.success("Registration deleted");
      router.push("/owner/registrations");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete");
    } finally {
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-hidden="true">
        <div className="cms-skeleton h-8 w-64" />
        <div className="cms-skeleton h-40 w-full" />
        <div className="cms-skeleton h-64 w-full" />
      </div>
    );
  }

  if (error || !reg) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
        <p className="font-semibold text-red-900">{error || "Registration not found"}</p>
        <Link href="/owner/registrations" className="mt-4 inline-block text-sm text-red-700 underline">
          Back to registrations
        </Link>
      </div>
    );
  }

  const session = reg.session;

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <Link
        href="/owner/registrations"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={15} /> Back to registrations
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-gray-400">{reg.reference}</p>
          <h1 className="text-2xl font-bold text-gray-900">{reg.fullName || "Registration"}</h1>
          <p className="mt-1 text-sm text-gray-500">Received {formatDate(reg.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="reg-status" className="sr-only">
            Status
          </label>
          <select
            id="reg-status"
            value={reg.status}
            disabled={saving}
            onChange={(e) => patch({ status: e.target.value }, "Status updated")}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete registration"
            className="rounded-lg p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Submitted information">
            {reg.fields?.length ? (
              <dl className="divide-y divide-gray-100">
                {reg.fields.map((f) => (
                  <div key={f.key} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">{f.label || f.key}</dt>
                    <dd className="text-sm text-gray-900 sm:col-span-2 whitespace-pre-wrap break-words">
                      {formatAnswer(f.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">No form answers were recorded.</p>
            )}
          </Panel>

          <Panel title="Internal notes">
            {reg.internalNotes?.length ? (
              <ul className="mb-4 space-y-3">
                {reg.internalNotes.map((n, i) => (
                  <li key={n._id || i} className="rounded-lg bg-gray-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{n.body}</p>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {n.authorEmail || "Owner"} · {formatDate(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-gray-500">No notes yet.</p>
            )}
            <label htmlFor="reg-note" className="sr-only">
              Add a note
            </label>
            <textarea
              id="reg-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Called the candidate — will confirm by Friday."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={saving || !note.trim()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Add note
            </button>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Status">
            <StatusPill value={reg.status} />
          </Panel>

          <Panel title="Course">
            <p className="font-semibold text-gray-900">
              {reg.course?.name || reg.courseNameSnapshot || "—"}
            </p>
            {reg.course?.slug ? (
              <Link
                href={`/courses/${reg.course.slug}`}
                target="_blank"
                className="mt-1 inline-block text-sm text-blue-600 hover:underline"
              >
                View course page
              </Link>
            ) : null}
            {reg.course?.duration ? (
              <p className="mt-2 text-sm text-gray-500">Duration: {reg.course.duration}</p>
            ) : null}
          </Panel>

          <Panel title="Course reference">
            {session ? (
              <>
                <p className="font-semibold text-gray-900">
                  {session.referenceName || session.referenceCode || "—"}
                </p>
                <dl className="mt-2 space-y-1.5 text-sm text-gray-600">
                  {(session.startDate || session.endDate) && (
                    <div>{formatDateRange(session.startDate, session.endDate)}</div>
                  )}
                  {session.examDate && <div>Exam: {formatDate(session.examDate)}</div>}
                  <div>Mode: {modeLabel(session)}</div>
                  {session.location && <div>{session.location}</div>}
                  <div className="pt-1">
                    <StatusPill value={session.status} />
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {reg.sessionNameSnapshot ||
                  "No session was selected — this came from a general course enquiry."}
              </p>
            )}
          </Panel>

          <Panel title="Contact">
            <dl className="space-y-1.5 text-sm">
              {reg.email && (
                <div>
                  <a href={`mailto:${reg.email}`} className="text-blue-600 hover:underline">
                    {reg.email}
                  </a>
                </div>
              )}
              {reg.phone && (
                <div>
                  <a href={`tel:${reg.phone}`} className="text-gray-700">
                    {reg.phone}
                  </a>
                </div>
              )}
              {reg.company && <div className="text-gray-600">{reg.company}</div>}
              {reg.country && <div className="text-gray-600">{reg.country}</div>}
            </dl>
          </Panel>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Delete this registration?"
        message={`${reg.fullName || reg.reference} will be permanently removed. This cannot be undone.`}
        confirmText="Delete"
        type="delete"
      />
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

/** Checkbox answers are stored as booleans; "true" reads badly in a table. */
function formatAnswer(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === "" || value === null || value === undefined) return "—";
  return String(value);
}
