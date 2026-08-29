"use client";

import { useId, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/Components/ui/cn";

/**
 * Form controls for the public registration form.
 *
 * Every control here is a real labelled input. The registration form is built
 * from CMS definitions, so a field's label is content an owner typed — which
 * makes the label/input association something the component must guarantee
 * rather than something each caller remembers.
 *
 * Errors are wired with `aria-describedby` and `aria-invalid`, so a screen
 * reader announces *which* field failed rather than just that something did.
 */

const CONTROL =
  "aba-focus w-full rounded-lg border bg-white px-3.5 t-body text-ink-900 placeholder:text-ink-400 transition-colors disabled:bg-ink-50 disabled:text-ink-400";

function controlClass(error) {
  return cn(CONTROL, error ? "border-red-400 focus:border-red-500" : "border-ink-200 focus:border-ink-400");
}

/** Label + control + help/error, shared by every field type. */
export function Field({ label, htmlFor, required, help, error, children, className = "" }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="mb-1.5 block t-small font-semibold text-ink-800">
          {label}
          {required && (
            <span className="ml-1 text-brand-600" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 t-caption text-red-600">
          {error}
        </p>
      ) : help ? (
        <p id={`${htmlFor}-help`} className="mt-1.5 t-caption text-ink-500">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id, { help, error }) {
  if (error) return `${id}-error`;
  if (help) return `${id}-help`;
  return undefined;
}

export function TextInput({
  label,
  value = "",
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  help = "",
  error = "",
  id: idProp,
  className = "",
  ...rest
}) {
  const generated = useId();
  const id = idProp || generated;
  return (
    <Field label={label} htmlFor={id} required={required} help={help} error={error} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, { help, error })}
        className={cn(controlClass(error), "h-11")}
        {...rest}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value = "",
  onChange,
  placeholder = "",
  required = false,
  help = "",
  error = "",
  rows = 4,
  id: idProp,
  className = "",
  ...rest
}) {
  const generated = useId();
  const id = idProp || generated;
  return (
    <Field label={label} htmlFor={id} required={required} help={help} error={error} className={className}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, { help, error })}
        className={cn(controlClass(error), "py-2.5 resize-y")}
        {...rest}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value = "",
  onChange,
  options = [],
  placeholder = "Please choose…",
  required = false,
  help = "",
  error = "",
  id: idProp,
  className = "",
}) {
  const generated = useId();
  const id = idProp || generated;
  return (
    <Field label={label} htmlFor={id} required={required} help={help} error={error} className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, { help, error })}
        className={cn(controlClass(error), "h-11 pr-9")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/**
 * A radio group. Wrapped in a fieldset with a legend so the group's question is
 * announced once, rather than repeated before every option.
 */
export function RadioGroup({
  label,
  value = "",
  onChange,
  options = [],
  required = false,
  help = "",
  error = "",
  name: nameProp,
  className = "",
}) {
  const generated = useId();
  const name = nameProp || generated;
  return (
    <fieldset className={cn("border-0 p-0", className)}>
      <legend className="mb-2 t-small font-semibold text-ink-800">
        {label}
        {required && <span className="ml-1 text-brand-600" aria-hidden="true">*</span>}
      </legend>
      <div
        className="space-y-1.5"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : help ? `${name}-help` : undefined}
      >
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2.5 t-body text-ink-700">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange?.(o.value)}
              className="aba-focus h-4 w-4 accent-brand-500"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 t-caption text-red-600">{error}</p>
      ) : help ? (
        <p id={`${name}-help`} className="mt-1.5 t-caption text-ink-500">{help}</p>
      ) : null}
    </fieldset>
  );
}

export function Checkbox({
  label,
  checked = false,
  onChange,
  required = false,
  help = "",
  error = "",
  id: idProp,
  className = "",
}) {
  const generated = useId();
  const id = idProp || generated;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 t-body text-ink-700">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy(id, { help, error })}
          className="aba-focus mt-1 h-4 w-4 shrink-0 accent-brand-500"
        />
        <span>
          {label}
          {required && <span className="ml-1 text-brand-600" aria-hidden="true">*</span>}
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 t-caption text-red-600">{error}</p>
      ) : help ? (
        <p id={`${id}-help`} className="mt-1.5 t-caption text-ink-500">{help}</p>
      ) : null}
    </div>
  );
}

/**
 * A date field.
 *
 * The native picker, on purpose: it is localised, keyboard-operable and
 * familiar on every platform, and a hand-rolled calendar would be a large
 * component to get wrong for no gain on a registration form.
 */
export function DateField(props) {
  return <TextInput {...props} type="date" />;
}

/**
 * File upload.
 *
 * Shows the chosen file with a way to remove it. The size cap is enforced here
 * for the visitor's benefit; the server enforces its own, because this check is
 * a courtesy and not a control.
 */
export function FileField({
  label,
  onChange,
  accept = "",
  required = false,
  help = "",
  error = "",
  maxMb = 10,
  id: idProp,
  className = "",
}) {
  const generated = useId();
  const id = idProp || generated;
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState("");

  const pick = (e) => {
    const next = e.target.files?.[0] || null;
    if (next && next.size > maxMb * 1024 * 1024) {
      setLocalError(`File must be ${maxMb}MB or smaller`);
      setFile(null);
      onChange?.(null);
      e.target.value = "";
      return;
    }
    setLocalError("");
    setFile(next);
    onChange?.(next);
  };

  const clear = () => {
    setFile(null);
    setLocalError("");
    onChange?.(null);
  };

  const shown = error || localError;

  return (
    <Field label={label} htmlFor={id} required={required} help={help} error={shown} className={className}>
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5">
          <span className="truncate t-small text-ink-800">{file.name}</span>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${file.name}`}
            className="aba-focus shrink-0 rounded p-1 text-ink-500 hover:text-ink-900"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed px-3.5 py-3 t-small transition-colors",
            shown ? "border-red-400 text-red-600" : "border-ink-300 text-ink-600 hover:border-ink-400 hover:bg-ink-50",
          )}
        >
          <Upload size={16} aria-hidden="true" />
          Choose a file
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={accept || undefined}
        required={required}
        onChange={pick}
        aria-invalid={shown ? "true" : undefined}
        aria-describedby={describedBy(id, { help, error: shown })}
        className="sr-only"
      />
    </Field>
  );
}
