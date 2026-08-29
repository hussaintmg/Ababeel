"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Phone, Mail, MessageCircle, Info, Landmark } from "lucide-react";
import {
  Container,
  Card,
  Button,
  LinkButton,
  Badge,
  TextInput,
  TextArea,
  SelectField,
  RadioGroup,
  Checkbox,
  DateField,
  FileField,
  ErrorState,
  EmptyState,
} from "@/Components/ui";
import { COUNTRIES } from "@/lib/training/countries";

/**
 * The public registration form.
 *
 * Fields come from the CMS, and the browser's copy of the rules is a courtesy —
 * the server rebuilds and revalidates them on every submission.
 *
 * There is no payment step, and this component must never imply one. The side
 * panel is contact information, and the notice under the submit button says
 * plainly that nothing is being charged, so nobody submits expecting a
 * checkout to follow.
 */
export default function RegistrationForm({ data }) {
  const { fields = [], course, session, cta, panel, payment = null, copy = {} } = data || {};

  const [values, setValues] = useState(() => initialValues(fields));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState(null);
  const formTop = useRef(null);

  const set = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear the field's error as soon as it is touched; leaving it there while
    // someone is fixing it is nagging, not feedback.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const canSubmit = !!course && (!session || cta?.available);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFailure("");
    setErrors({});

    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: course._id,
          reference: session?._id || "",
          values,
          sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const payload = await res.json();

      if (payload?.success) {
        setDone(payload.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (payload?.fieldErrors) {
        setErrors(payload.fieldErrors);
        // Send focus to the first field the server rejected, so a keyboard or
        // screen-reader user is taken to the problem instead of hunting.
        const firstKey = Object.keys(payload.fieldErrors)[0];
        document.getElementById(`field-${firstKey}`)?.focus();
        formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setFailure(payload?.error || "Something went wrong. Please try again.");
    } catch {
      setFailure("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Success result={done} copy={copy} payment={payment} />;

  if (!course) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Choose a course first"
          message="This registration link is missing its course, or that course is no longer available. Browse the catalogue and register from the course you want."
          action={<LinkButton href="/courses">Browse courses</LinkButton>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="min-w-0" ref={formTop}>
          <CourseSummary course={course} session={session} cta={cta} />

          {session && !cta?.available ? (
            <div className="mt-8">
              <ErrorState
                title={cta?.label || "Registration closed"}
                message="This session is no longer accepting registrations. Choose another date from the schedule, or contact our team."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <LinkButton href="/schedule" variant="outline">
                      See other dates
                    </LinkButton>
                    <LinkButton href="/contact-us">Contact the team</LinkButton>
                  </div>
                }
              />
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-10">
              <h2 className="t-h3 text-ink-900">Your information</h2>
              <p className="t-small mt-2 text-ink-500">
                Fields marked with an asterisk are required.
              </p>

              {failure ? (
                <p
                  role="alert"
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 t-small text-red-700"
                >
                  {failure}
                </p>
              ) : null}

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <FormField
                    key={field.key}
                    field={field}
                    value={values[field.key]}
                    onChange={(v) => set(field.key, v)}
                    error={errors[field.key]}
                  />
                ))}
              </div>

              {!fields.length ? (
                <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 t-small text-amber-800">
                  The registration form has not been set up yet. Please contact our team directly.
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button type="submit" size="lg" loading={submitting} disabled={!fields.length}>
                  {copy.submitLabel || "Submit Registration"}
                </Button>
                {/* The honest statement about payment. Nothing on this page
                    takes money, and nobody should submit expecting a checkout. */}
                <p className="t-caption flex items-center gap-1.5 text-ink-500">
                  <Info size={14} aria-hidden="true" />
                  {copy.paymentNotice ||
                    "No payment is taken at this stage. Our team will contact you to confirm your place."}
                </p>
              </div>
            </form>
          )}
        </div>

        <aside className="mt-10 lg:mt-0">
          <div className="space-y-6 lg:sticky lg:top-24">
            <HelpPanel panel={panel} />
            <BankDetailsCard payment={payment} />
          </div>
        </aside>
      </div>
    </Container>
  );
}

/* ----------------------------------------------------------------- summary */

function CourseSummary({ course, session, cta }) {
  const body = course.awardingBody;
  const rows = [
    ["Course", course.name],
    ["Course reference", session?.referenceName || session?.referenceCode],
    ["Start date", session?.startDate ? fmt(session.startDate) : ""],
    ["End date", session?.endDate ? fmt(session.endDate) : ""],
    ["Exam date", session?.examDate ? fmt(session.examDate) : ""],
    ["Mode", session ? modeText(session) : ""],
    ["Duration", session?.duration || course.duration],
    ["Awarding body", body?.name],
  ].filter(([, value]) => value);

  return (
    <Card className="p-6 sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="t-eyebrow mb-2 text-brand-700">You are registering for</p>
          <h2 className="t-h3 text-ink-900">{course.name}</h2>
        </div>
        {cta?.available ? <Badge tone="success">Open for registration</Badge> : null}
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-ink-100 py-2.5"
          >
            <dt className="t-small text-ink-500">{label}</dt>
            <dd className="t-small text-right font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>

      {!session ? (
        <p className="mt-5 rounded-lg bg-ink-50 px-4 py-3 t-small text-ink-600">
          No specific session was selected. Our team will contact you with the next available
          dates — or{" "}
          <Link href="/schedule" className="font-semibold text-brand-700 underline">
            pick a date from the schedule
          </Link>
          .
        </p>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------- help panel */

/**
 * The side panel. Contact and reassurance — deliberately not a payment or
 * order summary, because registration takes no payment.
 */
function HelpPanel({ panel }) {
  if (!panel?.enabled) return null;

  return (
    <Card className="bg-ink-50 p-6">
          <h2 className="t-h4 text-ink-900">{panel.title || "Need Help With Registration?"}</h2>
          {panel.body ? <p className="t-small mt-2 text-ink-600">{panel.body}</p> : null}

          <ul className="mt-5 space-y-3">
            {panel.phone ? (
              <ContactRow icon={Phone} href={`tel:${panel.phone}`} label="Call us" value={panel.phone} />
            ) : null}
            {panel.whatsapp ? (
              <ContactRow
                icon={MessageCircle}
                href={`https://wa.me/${String(panel.whatsapp).replace(/[^0-9]/g, "")}`}
                label="WhatsApp"
                value={panel.whatsapp}
                external
              />
            ) : null}
            {panel.email ? (
              <ContactRow
                icon={Mail}
                href={`mailto:${panel.email}`}
                label="Email us"
                value={panel.email}
              />
            ) : null}
          </ul>

          {panel.hours ? <p className="t-caption mt-4 text-ink-500">{panel.hours}</p> : null}
      {panel.footnote ? (
        <p className="t-caption mt-4 border-t border-ink-200 pt-4 text-ink-500">
          {panel.footnote}
        </p>
      ) : null}
    </Card>
  );
}

/**
 * The company's own bank-transfer details, shown so a registrant knows how the
 * fee is settled after their place is confirmed. Purely informational: the
 * website never collects money or anyone's banking credentials.
 */
function BankDetailsCard({ payment }) {
  if (!payment?.showBankDetails) return null;
  const rows = [
    ["Bank", payment.bankName],
    ["Account title", payment.accountTitle],
    ["Account number", payment.accountNumber],
    ["IBAN", payment.iban],
    ["Sort code", payment.sortCode],
    ["SWIFT / BIC", payment.swiftBic],
  ].filter(([, v]) => v);
  if (!rows.length) return null;

  return (
    <Card className="p-6">
      <h2 className="t-h4 flex items-center gap-2 text-ink-900">
        <Landmark size={17} className="text-brand-700" aria-hidden="true" />
        {payment.bankTitle || "Pay by bank transfer"}
      </h2>
      {payment.bankIntro ? (
        <p className="t-small mt-2 text-ink-600">{payment.bankIntro}</p>
      ) : null}
      <dl className="mt-4 divide-y divide-ink-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="t-small text-ink-500">{label}</dt>
            <dd className="t-small text-right font-mono font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
      {payment.footnote ? (
        <p className="t-caption mt-3 text-ink-500">{payment.footnote}</p>
      ) : null}
    </Card>
  );
}

function ContactRow({ icon: Icon, href, label, value, external }) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="aba-focus flex items-center gap-3 rounded-lg bg-white p-3 transition-colors hover:bg-white/70"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Icon size={16} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block t-caption text-ink-500">{label}</span>
          <span className="block truncate t-small font-semibold text-ink-900">{value}</span>
        </span>
      </a>
    </li>
  );
}

/* --------------------------------------------------------------- success */

function Success({ result, copy, payment }) {
  return (
    <Container size="normal" className="py-20">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-500" aria-hidden="true" />
        <h1 className="t-h2 mt-6 text-ink-900">{copy.successTitle || "Registration received"}</h1>
        <p className="t-body-lg mt-4 text-ink-600">
          {copy.successMessage ||
            "Thank you. Your registration has been received and our training team will contact you shortly."}
        </p>

        <div className="mt-8 rounded-xl border border-ink-100 bg-ink-50 p-5">
          <p className="t-caption text-ink-500">Your reference</p>
          <p className="t-h3 mt-1 font-mono text-ink-900">{result.reference}</p>
          {result.courseName ? (
            <p className="t-small mt-3 text-ink-600">
              {result.courseName}
              {result.sessionName ? ` — ${result.sessionName}` : ""}
            </p>
          ) : null}
        </div>

        <div className="mt-8 text-left">
          <BankDetailsCard payment={payment} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/courses" variant="outline">
            Browse more courses
          </LinkButton>
          <LinkButton href="/">Back to home</LinkButton>
        </div>
      </div>
    </Container>
  );
}

/* ---------------------------------------------------------------- fields */

function FormField({ field, value, onChange, error }) {
  const span = field.width === "half" ? "sm:col-span-1" : "sm:col-span-2";
  const common = {
    id: `field-${field.key}`,
    label: field.label,
    required: field.required,
    help: field.helpText,
    error,
    className: span,
  };

  switch (field.type) {
    case "textarea":
      return (
        <TextArea {...common} value={value || ""} onChange={onChange} placeholder={field.placeholder} />
      );
    case "select":
      return (
        <SelectField {...common} value={value || ""} onChange={onChange} options={field.options || []} />
      );
    case "country":
      return (
        <SelectField
          {...common}
          value={value || ""}
          onChange={onChange}
          options={COUNTRIES.map((c) => ({ value: c, label: c }))}
          placeholder="Select a country…"
        />
      );
    case "radio":
      return (
        <RadioGroup
          {...common}
          name={field.key}
          value={value || ""}
          onChange={onChange}
          options={field.options || []}
        />
      );
    case "checkbox":
      return <Checkbox {...common} checked={!!value} onChange={onChange} />;
    case "date":
      return <DateField {...common} value={value || ""} onChange={onChange} />;
    case "file":
      return <FileField {...common} onChange={onChange} />;
    case "email":
    case "phone":
    case "number":
    case "text":
    default:
      return (
        <TextInput
          {...common}
          type={inputType(field.type)}
          value={value || ""}
          onChange={onChange}
          placeholder={field.placeholder}
          // The right keyboard on a phone: a numeric pad for a phone number
          // rather than a full QWERTY.
          inputMode={field.type === "phone" ? "tel" : field.type === "number" ? "numeric" : undefined}
          autoComplete={autoCompleteFor(field.key, field.type)}
        />
      );
  }
}

function inputType(type) {
  if (type === "email") return "email";
  if (type === "phone") return "tel";
  if (type === "number") return "number";
  return "text";
}

/** Let a browser fill in the fields it already knows. */
function autoCompleteFor(key, type) {
  const byKey = {
    firstName: "given-name",
    lastName: "family-name",
    email: "email",
    phone: "tel",
    company: "organization",
    jobTitle: "organization-title",
    city: "address-level2",
    address: "street-address",
    country: "country-name",
  };
  return byKey[key] || (type === "email" ? "email" : type === "phone" ? "tel" : undefined);
}

function initialValues(fields) {
  const out = {};
  for (const field of fields) out[field.key] = field.type === "checkbox" ? false : "";
  return out;
}

/* --------------------------------------------------------------- helpers */

// Dates arrive as ISO strings and are day-precise; see lib/training/format.js
// for why they are read in UTC.
function fmt(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function modeText(session) {
  if (session.modeLabel) return session.modeLabel;
  const map = { online: "Online", physical: "In Person", hybrid: "Hybrid", other: "Other" };
  return map[session.mode] || "Online";
}
