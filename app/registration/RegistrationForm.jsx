"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Phone,
  Mail,
  MessageCircle,
  Info,
  Landmark,
  Upload,
  FileCheck,
  Calendar,
  BookOpen,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
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
} from "@/Components/ui";
import { COUNTRIES } from "@/lib/training/countries";
import axios from "axios";

export default function RegistrationForm({ data }) {
  const {
    fields = [],
    course: initialCourse = null,
    session: initialSession = null,
    courses = [],
    cta: initialCta = null,
    panel,
    payment = null,
    copy = {},
  } = data || {};

  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [selectedSession, setSelectedSession] = useState(initialSession);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableSessions, setAvailableSessions] = useState(initialSession ? [initialSession] : []);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [values, setValues] = useState(() => initialValues(fields));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState(null);
  const formTop = useRef(null);

  // When selectedCourse changes, fetch available sessions for that course
  useEffect(() => {
    if (!selectedCourse?._id) {
      setAvailableSessions([]);
      setSelectedSession(null);
      return;
    }

    let isMounted = true;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await axios.get(`/api/courses/${selectedCourse._id}/sessions`);
        if (res.data?.success && isMounted) {
          const list = res.data.data || [];
          setAvailableSessions(list);
          if (initialSession && list.some((s) => s._id === initialSession._id)) {
            setSelectedSession(initialSession);
          } else if (list.length > 0) {
            setSelectedSession(list[0]);
            setSelectedMonth(list[0].referenceName || formatDateMonth(list[0].startDate));
          } else {
            setSelectedSession(null);
          }
        }
      } catch (err) {
        console.error("Failed to load course sessions:", err);
      } finally {
        if (isMounted) setLoadingSessions(false);
      }
    };

    fetchSessions();
    return () => {
      isMounted = false;
    };
  }, [selectedCourse, initialSession]);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const found = courses.find((c) => c._id === courseId);
    setSelectedCourse(found || null);
    setSelectedSession(null);
    setSelectedMonth("");
    setErrors((prev) => ({ ...prev, course: "" }));
  };

  const handleSessionSelect = (sessionId) => {
    if (sessionId === "flexible") {
      setSelectedSession(null);
      setSelectedMonth("Flexible / Next Available Intake");
    } else {
      const found = availableSessions.find((s) => s._id === sessionId);
      setSelectedSession(found || null);
      if (found) {
        setSelectedMonth(found.referenceName || formatDateMonth(found.startDate));
      }
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("/api/registration/upload-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data?.data?.url) {
        setReceiptUrl(res.data.data.url);
        setReceiptName(file.name);
        setReceiptFile(file);
      } else {
        setUploadError(res.data?.error || "Failed to upload receipt file");
      }
    } catch (err) {
      console.error("Receipt upload error:", err);
      setUploadError(err.response?.data?.error || "Failed to upload payment receipt");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl("");
    setReceiptName("");
    setReceiptFile(null);
    setUploadError("");
  };

  const set = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      setErrors((prev) => ({ ...prev, course: "Please select a course to register" }));
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setFailure("");
    setErrors({});

    try {
      const payload = {
        course: selectedCourse._id,
        reference: selectedSession?._id || "",
        selectedMonth: selectedMonth || (selectedSession?.referenceName || "Next Available Intake"),
        receiptUrl,
        receiptName,
        values,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
      };

      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (resData?.success) {
        setDone({
          ...resData.data,
          selectedMonth: payload.selectedMonth,
          hasReceipt: !!receiptUrl,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (resData?.fieldErrors) {
        setErrors(resData.fieldErrors);
        const firstKey = Object.keys(resData.fieldErrors)[0];
        document.getElementById(`field-${firstKey}`)?.focus();
        formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setFailure(resData?.error || "Something went wrong. Please try again.");
    } catch {
      setFailure("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Success result={done} copy={copy} payment={payment} />;

  return (
    <Container className="py-12 sm:py-16">
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="min-w-0" ref={formTop}>
          {/* Section 1: Course Selection & Summary */}
          <Card className="p-6 sm:p-7 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-bold text-ink-900 mb-2">
                Step 1: Select Your Course <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCourse?._id || ""}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500 bg-white text-ink-900 font-medium text-sm sm:text-base appearance-none pr-10"
                >
                  <option value="">-- Click to choose a course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.code ? `(${c.code})` : ""} {c.price ? `— ${c.currencySymbol || "£"}${c.price}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 pointer-events-none" />
              </div>
              {errors.course && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.course}</p>
              )}
            </div>

            {selectedCourse ? (
              <div className="pt-4 border-t border-ink-100">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="t-eyebrow mb-1 text-brand-700">Course Overview</p>
                    <h3 className="t-h3 text-ink-900">{selectedCourse.name}</h3>
                  </div>
                  <Badge tone="success">Selected</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {selectedCourse.awardingBody?.name && (
                    <div className="flex justify-between py-1.5 border-b border-ink-50">
                      <span className="text-ink-500">Awarding Body:</span>
                      <span className="font-semibold text-ink-900">{selectedCourse.awardingBody.name}</span>
                    </div>
                  )}
                  {selectedCourse.level?.name && (
                    <div className="flex justify-between py-1.5 border-b border-ink-50">
                      <span className="text-ink-500">Level:</span>
                      <span className="font-semibold text-ink-900">{selectedCourse.level.name}</span>
                    </div>
                  )}
                  {selectedCourse.duration && (
                    <div className="flex justify-between py-1.5 border-b border-ink-50">
                      <span className="text-ink-500">Duration:</span>
                      <span className="font-semibold text-ink-900">{selectedCourse.duration}</span>
                    </div>
                  )}
                  {selectedCourse.price ? (
                    <div className="flex justify-between py-1.5 border-b border-ink-50">
                      <span className="text-ink-500">Fee:</span>
                      <span className="font-semibold text-ink-900">
                        {selectedCourse.currencySymbol || "£"}{selectedCourse.price}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>

          {/* Section 2: Intake Month / Session Selector */}
          {selectedCourse && (
            <Card className="p-6 sm:p-7 mb-8">
              <label className="block text-sm font-bold text-ink-900 mb-2">
                Step 2: Choose Available Intake / Month <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-ink-500 mb-4">
                Select your preferred start date or choose flexible intake for our team to schedule with you.
              </p>

              {loadingSessions ? (
                <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  Loading available sessions...
                </div>
              ) : availableSessions.length > 0 ? (
                <div className="space-y-3">
                  {availableSessions.map((sess) => {
                    const isSelected = selectedSession?._id === sess._id;
                    const dateStr = sess.startDate ? fmtDate(sess.startDate) : "Flexible Dates";
                    return (
                      <div
                        key={sess._id}
                        onClick={() => handleSessionSelect(sess._id)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/40 ring-1 ring-brand-600"
                            : "border-ink-200 hover:border-ink-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="font-semibold text-ink-900 text-sm">
                              {sess.referenceName || `${dateStr} Intake`}
                            </div>
                            <div className="text-xs text-ink-500 flex items-center gap-2 mt-0.5">
                              <span>📅 Starts {dateStr}</span>
                              <span>•</span>
                              <span className="capitalize">{sess.modeLabel || sess.mode || "Online"}</span>
                              {sess.location && <span>• {sess.location}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge tone={isSelected ? "primary" : "neutral"} size="sm">
                          {sess.seats ? `${sess.seats} Seats` : "Available"}
                        </Badge>
                      </div>
                    );
                  })}

                  <div
                    onClick={() => handleSessionSelect("flexible")}
                    className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      !selectedSession
                        ? "border-brand-600 bg-brand-50/40 ring-1 ring-brand-600"
                        : "border-ink-200 hover:border-ink-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          !selectedSession ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300"
                        }`}
                      >
                        {!selectedSession && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-ink-900 text-sm">
                          Flexible / Next Available Intake
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          Our team will coordinate the earliest convenient dates with you.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-ink-50 rounded-xl text-sm text-ink-600">
                  <p className="font-medium text-ink-900 mb-1">No fixed calendar dates published yet</p>
                  <p className="text-xs text-ink-500">
                    You can register now and our training coordinator will confirm the next intake month with you directly.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Section 3: Payment Receipt / Deposit Slip Upload */}
          <Card className="p-6 sm:p-7 mb-8">
            <h3 className="text-sm font-bold text-ink-900 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-600" />
              Step 3: Payment Receipt / Deposit Slip (Optional)
            </h3>
            <p className="text-xs text-ink-500 mb-4">
              If you have already paid or transferred the course fee, upload your deposit slip or receipt for faster enrollment verification (PDF, PNG, JPG, WEBP up to 25MB).
            </p>

            {receiptUrl ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 truncate max-w-xs sm:max-w-md">
                      {receiptName || "Payment Receipt Uploaded"}
                    </p>
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-emerald-700 underline"
                    >
                      View uploaded receipt
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="p-1 text-ink-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Remove receipt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-ink-200 hover:border-brand-400 rounded-xl cursor-pointer bg-ink-50/50 hover:bg-brand-50/20 transition-all">
                  <Upload className="w-8 h-8 text-ink-400 mb-2" />
                  <span className="text-sm font-semibold text-ink-900">
                    {uploadingReceipt ? "Uploading receipt..." : "Click to select or drag & drop receipt file"}
                  </span>
                  <span className="text-xs text-ink-500 mt-1">PDF, JPG, PNG, WEBP up to 25MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    onChange={handleReceiptUpload}
                    disabled={uploadingReceipt}
                    className="hidden"
                  />
                </label>
                {uploadError && (
                  <p className="mt-2 text-xs text-red-600 font-medium">{uploadError}</p>
                )}
              </div>
            )}
          </Card>

          {/* Section 4: Candidate Information Form */}
          <form onSubmit={submit} noValidate>
            <Card className="p-6 sm:p-7">
              <h3 className="t-h3 text-ink-900">Step 4: Candidate Information</h3>
              <p className="t-small mt-1 text-ink-500">
                Please enter your personal details. Required fields are marked with an asterisk (*).
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
                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  disabled={!selectedCourse || !fields.length}
                >
                  {copy.submitLabel || "Submit Registration Request"}
                </Button>
                <p className="t-caption flex items-center gap-1.5 text-ink-500">
                  <Info size={14} aria-hidden="true" />
                  {copy.paymentNotice ||
                    "Our training team will review your application and confirm your enrollment place."}
                </p>
              </div>
            </Card>
          </form>
        </div>

        {/* Sidebar Help & Bank Info */}
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

/* ------------------------------------------------------------- help panel */

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
          <ContactRow icon={Mail} href={`mailto:${panel.email}`} label="Email us" value={panel.email} />
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
        <h1 className="t-h2 mt-6 text-ink-900">{copy.successTitle || "Registration Request Received"}</h1>
        <p className="t-body-lg mt-4 text-ink-600">
          {copy.successMessage ||
            "Thank you. Your registration request has been received and our training team will review and confirm your place shortly."}
        </p>

        <div className="mt-8 rounded-xl border border-ink-100 bg-ink-50 p-5">
          <p className="t-caption text-ink-500">Your Registration Reference</p>
          <p className="t-h3 mt-1 font-mono text-ink-900">{result.reference}</p>
          {result.courseName ? (
            <p className="t-small mt-3 text-ink-700 font-medium">
              Course: {result.courseName}
            </p>
          ) : null}
          {result.selectedMonth ? (
            <p className="text-xs mt-1 text-ink-500">
              Intake Month / Session: {result.selectedMonth}
            </p>
          ) : null}
          {result.hasReceipt && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
              <FileCheck className="w-3.5 h-3.5" /> Receipt Attached
            </div>
          )}
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

function fmtDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateMonth(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}
