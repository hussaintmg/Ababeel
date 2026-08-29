"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";
import { Label, FieldRenderer } from "@/Components/owner/cms/fields";
import { readPath, writePath } from "@/Components/owner/training/fieldSpecs";

/**
 * The owner create/edit screen for any training resource.
 *
 * Rendered from the resource's spec, and built on the CMS's existing field
 * editors (`Components/owner/cms/fields`) rather than a second set: the image
 * picker there already uploads through the owner endpoint and optimises before
 * it does, and the rich-text and list editors are the ones owners already know
 * from the page builder.
 *
 * Two field types the page builder has no use for are added here: `ref`, a
 * select populated from another training resource, and `date`.
 */
export default function ResourceForm({ resource, spec, id = null }) {
  const router = useRouter();
  const isNew = !id;

  const [draft, setDraft] = useState(() => defaultsFor(spec));
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refOptions, setRefOptions] = useState({});

  /* ----- load the document being edited ----- */
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`/api/owner/training/${resource}/${id}`, {
          withCredentials: true,
        });
        if (cancelled) return;
        if (res.data?.success) {
          setDraft(normalise(res.data.data));
        } else {
          setError(res.data?.error || "Could not load this record");
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "Could not load this record");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resource, id, isNew]);

  /* ----- load the options for every `ref` field on this form ----- */
  const refResources = useMemo(() => {
    const set = new Set();
    for (const section of spec.sections) {
      for (const field of section.fields) {
        if (field.type === "ref" && field.resource) set.add(field.resource);
      }
    }
    return [...set];
  }, [spec]);

  useEffect(() => {
    if (!refResources.length) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        refResources.map(async (key) => {
          try {
            const res = await axios.get(`/api/owner/training/${key}`, {
              params: { limit: 200 },
              withCredentials: true,
            });
            const items = res.data?.data?.items || [];
            return [
              key,
              items.map((item) => ({
                value: item._id,
                // Sessions are named after their course when they have no
                // reference name of their own.
                label: item.name || item.referenceName || item.label || item.course?.name || "Untitled",
              })),
            ];
          } catch {
            // A failed option list must not block the whole form: the field
            // renders empty and the rest of the record can still be saved.
            return [key, []];
          }
        }),
      );
      if (!cancelled) setRefOptions(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [refResources]);

  const setValue = useCallback((path, value) => {
    setDraft((prev) => writePath(prev, path, value));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = serialise(draft, spec, { isNew });
      const res = isNew
        ? await axios.post(`/api/owner/training/${resource}`, payload, { withCredentials: true })
        : await axios.patch(`/api/owner/training/${resource}/${id}`, payload, {
            withCredentials: true,
          });

      if (res.data?.success) {
        toast.success(isNew ? `${spec.singular} created` : "Saved");
        if (isNew) router.push(`/owner/training/${resource}/${res.data.data._id}`);
        else setDraft(normalise(res.data.data));
      } else {
        setError(res.data?.error || "Could not save");
      }
    } catch (err) {
      const message = err?.response?.data?.error || "Could not save";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /** The public URL for this record, once it has a slug and is published. */
  const publicHref = publicUrlFor(resource, draft);

  if (loading) return <FormSkeleton />;

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/owner/training/${resource}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={15} /> Back to {spec.label}
        </Link>
        {publicHref ? (
          <a
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
          >
            View on the site <ExternalLink size={13} />
          </a>
        ) : null}
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {isNew ? `New ${spec.singular}` : `Edit ${spec.singular}`}
      </h1>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {spec.sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              {section.title}
            </h2>
            {section.description ? (
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            ) : null}
            <div className="mt-4 space-y-4">
              {section.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={readPath(draft, field.key)}
                  onChange={(v) => setValue(field.key, v)}
                  refOptions={refOptions}
                  locked={!isNew && field.lockOnEdit}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* A save bar that follows the page: these forms are long, and a button
          only at the bottom means scrolling past six sections to save a typo
          fixed at the top. */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/owner/training/${resource}`}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isNew ? `Create ${spec.singular}` : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

function FieldRow({ field, value, onChange, refOptions, locked }) {
  const isBoolean = field.type === "boolean";

  return (
    <div>
      {!isBoolean ? (
        <Label>
          {field.label}
          {field.required ? <span className="ml-1 text-red-500">*</span> : null}
        </Label>
      ) : null}

      {locked ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-500">
          {value || "—"}
        </div>
      ) : (
        <TrainingField field={field} value={value} onChange={onChange} refOptions={refOptions} />
      )}

      {field.help ? <p className="mt-1.5 text-xs text-gray-500">{field.help}</p> : null}
    </div>
  );
}

/**
 * The two field types the page builder does not have, plus a pass-through to
 * the CMS's own renderer for everything else.
 */
function TrainingField({ field, value, onChange, refOptions }) {
  if (field.type === "ref") {
    const options = refOptions[field.resource];
    return (
      <select
        value={value && typeof value === "object" ? value._id : value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          {options === undefined ? "Loading…" : options.length ? "None" : "None available yet"}
        </option>
        {(options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={value ?? ""}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <FieldRenderer
      field={field}
      value={value}
      onChange={onChange}
      renderField={(f, v, set) => (
        <TrainingField field={f} value={v} onChange={set} refOptions={refOptions} />
      )}
    />
  );
}

/* ------------------------------------------------------------------ shaping */

/** A blank draft with every select and boolean at its first sensible value. */
function defaultsFor(spec) {
  const draft = {};
  for (const section of spec.sections) {
    for (const field of section.fields) {
      if (field.type === "boolean") {
        // "Show on the form" and "Show in the schedule" are on by default —
        // an owner creating one has just decided they want it.
        const onByDefault = ["enabled", "showInSchedule", "showInTrustStrip"].includes(field.key);
        writeInto(draft, field.key, onByDefault);
      } else if (field.type === "select" && field.options?.length) {
        writeInto(draft, field.key, field.options[0].value);
      } else if (field.type === "number") {
        writeInto(draft, field.key, 0);
      } else if (field.type === "list") {
        writeInto(draft, field.key, []);
      }
    }
  }
  return draft;
}

function writeInto(obj, path, value) {
  const parts = path.split(".");
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cursor[parts[i]] = cursor[parts[i]] || {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
}

/**
 * Turn a populated document into something the form can edit.
 *
 * The API populates references for the list view, so `course` arrives as an
 * object. A select needs the id, and sending the whole object back would be
 * rejected by the id validation on the server.
 */
function normalise(doc) {
  const out = { ...doc };
  for (const key of ["course", "level", "awardingBody"]) {
    if (out[key] && typeof out[key] === "object") out[key] = out[key]._id;
  }
  return out;
}

/** Only the fields this form actually owns, so nothing else is round-tripped. */
function serialise(draft, spec, { isNew }) {
  const payload = {};
  for (const section of spec.sections) {
    for (const field of section.fields) {
      if (!isNew && field.lockOnEdit) continue;
      const value = readPath(draft, field.key);
      if (value === undefined) continue;
      writeInto(payload, field.key, value);
    }
  }
  return payload;
}

/** `<input type="date">` wants YYYY-MM-DD, and always in UTC — see format.js. */
function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function publicUrlFor(resource, draft) {
  if (draft?.status !== "published" || !draft?.slug) return "";
  const paths = {
    courses: "/courses",
    "awarding-bodies": "/awarding-bodies",
    consultants: "/about/consultants",
  };
  const base = paths[resource];
  return base && resource !== "consultants" ? `${base}/${draft.slug}` : base || "";
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-hidden="true">
      <div className="cms-skeleton h-8 w-56" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
          <div className="cms-skeleton h-4 w-32" />
          <div className="cms-skeleton h-10 w-full" />
          <div className="cms-skeleton h-10 w-full" />
          <div className="cms-skeleton h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
