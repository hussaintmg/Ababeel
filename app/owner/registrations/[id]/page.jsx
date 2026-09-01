"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Send,
  FileDown,
  CheckCircle,
  FileCheck,
  ExternalLink,
  Users,
} from "lucide-react";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { StatusPill } from "@/Components/owner/training/ResourceTable";
import { formatDate, formatDateRange } from "@/lib/training/format";
import { modeLabel } from "@/lib/training/status";

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

  const handleApprove = async () => {
    await patch({ status: "confirmed" }, "Registration Approved & Candidate Enrolled into Course!");
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
          {reg.status !== "confirmed" ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Approve & Enroll Candidate
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
              <CheckCircle size={14} /> Approved & Enrolled
            </span>
          )}

          <label htmlFor="reg-status" className="sr-only">
            Status
          </label>
          <select
            id="reg-status"
            value={reg.status}
            disabled={saving}
            onChange={(e) => patch({ status: e.target.value }, "Status updated")}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 bg-white"
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
          {/* Payment Receipt Card */}
          {reg.receiptUrl ? (
            <Panel title="Candidate Payment Receipt / Deposit Slip">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-700" />
                    <span className="font-semibold text-emerald-950 text-sm">
                      {reg.receiptName || "Deposit Slip Uploaded"}
                    </span>
                  </div>
                  <a
                    href={reg.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink size={13} /> View / Download Slip
                  </a>
                </div>
                {reg.receiptUrl.match(/\.(jpeg|jpg|png|webp)($|\?)/i) ? (
                  <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200 max-h-80 bg-white flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reg.receiptUrl}
                      alt="Payment Receipt"
                      className="max-h-72 object-contain rounded"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 mt-1">
                    Document file attached. Click above to open PDF receipt in a new tab.
                  </p>
                )}
              </div>
            </Panel>
          ) : null}

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
              placeholder="Called the candidate — verified payment and confirmed place."
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
          <Panel title="Enrollment Status">
            <div className="flex items-center gap-2">
              <StatusPill value={reg.status} />
              {reg.enrolledCandidate && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Enrolled Candidate
                </span>
              )}
            </div>
          </Panel>

          <InvoicePanel registrationId={id} />

          <Panel title="Selected Course">
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

          <Panel title="Intake Month / Session">
            {reg.selectedMonth ? (
              <p className="font-semibold text-gray-900 text-sm mb-2">
                Requested Intake: {reg.selectedMonth}
              </p>
            ) : null}
            {session ? (
              <>
                <p className="font-medium text-gray-900 text-sm">
                  {session.referenceName || session.referenceCode || "—"}
                </p>
                <dl className="mt-2 space-y-1.5 text-sm text-gray-600">
                  {(session.startDate || session.endDate) && (
                    <div>{formatDateRange(session.startDate, session.endDate)}</div>
                  )}
                  {session.examDate && <div>Exam: {formatDate(session.examDate)}</div>}
                  <div>Mode: {modeLabel(session)}</div>
                  {session.location && <div>{session.location}</div>}
                </dl>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {reg.sessionNameSnapshot ||
                  "No specific session selected — flexible intake requested."}
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

function InvoicePanel({ registrationId }) {
  const [inv, setInv] = useState({ number: "", amount: "", currency: "GBP", dueDate: "", notes: "" });
  const set = (key) => (e) => setInv((prev) => ({ ...prev, [key]: e.target.value }));

  const download = () => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(inv)) if (v) params.set(k, v);
    window.open(`/api/owner/registrations/${registrationId}/invoice?${params}`, "_blank");
  };

  const field = "h-9 w-full rounded-lg border border-gray-300 px-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Panel title="Invoice">
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Invoice number</span>
          <input className={field} value={inv.number} onChange={set("number")} placeholder="INV-2026-0001" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Due date</span>
          <input type="date" className={field} value={inv.dueDate} onChange={set("dueDate")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Amount</span>
          <input className={field} value={inv.amount} onChange={set("amount")} placeholder="350.00" inputMode="decimal" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-500">Currency</span>
          <input className={field} value={inv.currency} onChange={set("currency")} placeholder="GBP" />
        </label>
      </div>
      <label className="mt-2.5 block">
        <span className="mb-1 block text-xs font-medium text-gray-500">Notes (optional)</span>
        <input className={field} value={inv.notes} onChange={set("notes")} placeholder="Course fee for one delegate." />
      </label>
      <button
        type="button"
        onClick={download}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
      >
        <FileDown size={15} />
        Download invoice PDF
      </button>
      <p className="mt-2 text-xs text-gray-400">
        Uses the active template from PDF Templates → Registration Invoice.
      </p>
    </Panel>
  );
}

function formatAnswer(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === "" || value === null || value === undefined) return "—";
  return String(value);
}
