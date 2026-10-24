import { useId, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../api/client";
import { useCreateIssue, useLocations } from "../../api/queries";
import type { IssueDetail } from "../../api/types";
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, type Priority } from "../../lib/domain";
import {
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  textInputClass,
} from "../../lib/ui";
import { ActingAs } from "../identity/ActingAs";
import { useActor } from "../identity/ActorProvider";
import { FIELD_ORDER, LIMITS, serverFieldErrors, toNewIssue, validate, type FieldErrors, type FormValues } from "./validate";

// Plain-language guidance so priority means the same thing on every shift.
const PRIORITY_HINT: Record<Priority, string> = {
  urgent: "Safety risk, or service has stopped",
  high: "Hurts service today",
  medium: "Fix this week",
  low: "When there's time",
};

const PRIORITY_SELECTED: Record<Priority, string> = {
  urgent: "has-checked:border-urgent has-checked:bg-urgent-soft",
  high: "has-checked:border-high has-checked:bg-high-soft",
  medium: "has-checked:border-ink has-checked:bg-sunken",
  low: "has-checked:border-ink has-checked:bg-sunken",
};

// Big, whole-tile radio options: easier to hit with a thumb than a dropdown.
const tile =
  "relative flex cursor-pointer rounded-sm border border-line-strong bg-surface px-3 text-sm transition-colors duration-150 " +
  "hover:border-ink-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

export function IssueForm({ onCreated }: { onCreated: (issue: IssueDetail) => void }) {
  const actor = useActor();
  const locations = useLocations();
  const create = useCreateIssue();
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();
  // Ask for a name only if we didn't already know it when the form opened.
  const [askName, setAskName] = useState(() => !actor.name.trim());

  const [values, setValues] = useState<FormValues>({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    locationId: "",
    name: actor.name,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);

    const name = values.name.trim();
    actor.setName(name);
    try {
      onCreated(await create.mutateAsync({ input: toNewIssue(values), actor: name }));
    } catch (err) {
      const fieldErrs = err instanceof ApiError ? serverFieldErrors(err.details) : {};
      if (Object.keys(fieldErrs).length) {
        setErrors(fieldErrs);
        focusFirstError(fieldErrs);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Couldn't save the report.");
      }
    }
  }

  const fieldProps = (field: keyof FormValues) => ({
    id: `${id}-${field}`,
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
  });

  const fieldError = (field: keyof FormValues) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className={errorTextClass}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <label htmlFor={`${id}-title`} className={labelClass}>
          What's wrong?
        </label>
        <input
          {...fieldProps("title")}
          className={textInputClass}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Walk-in cooler reading 45°F"
          maxLength={LIMITS.titleMax + 20}
          autoComplete="off"
          enterKeyHint="next"
        />
        {fieldError("title")}
      </div>

      <div>
        <label htmlFor={`${id}-locationId`} className={labelClass}>
          Where?
        </label>
        <select
          {...fieldProps("locationId")}
          className={`${textInputClass} pr-8`}
          value={values.locationId}
          onChange={(e) => set("locationId", e.target.value)}
          disabled={!locations.data}
        >
          <option value="">{locations.isError ? "Couldn't load locations" : "Choose a location"}</option>
          {locations.data?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.area})
            </option>
          ))}
        </select>
        {fieldError("locationId")}
      </div>

      <fieldset aria-describedby={errors.category ? `${id}-category-error` : undefined}>
        <legend className={labelClass}>Category</legend>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <label key={c} className={`${tile} h-12 items-center has-checked:border-ink has-checked:bg-sunken`}>
              <input
                type="radio"
                name="category"
                value={c}
                checked={values.category === c}
                onChange={() => set("category", c)}
                aria-invalid={errors.category ? true : undefined}
                className="size-4 accent-[var(--color-ink)]"
              />
              <span className="ml-2.5 font-medium">{CATEGORY_LABEL[c]}</span>
            </label>
          ))}
        </div>
        {fieldError("category")}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Priority</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRIORITIES.map((p) => (
            <label key={p} className={`${tile} min-h-14 items-center py-2 ${PRIORITY_SELECTED[p]}`}>
              <input
                type="radio"
                name="priority"
                value={p}
                checked={values.priority === p}
                onChange={() => set("priority", p)}
                className="size-4 shrink-0 accent-[var(--color-ink)]"
              />
              <span className="ml-2.5 flex flex-col leading-tight">
                <span className="font-medium">{PRIORITY_LABEL[p]}</span>
                <span className="text-xs text-ink-muted">{PRIORITY_HINT[p]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${id}-description`} className={labelClass}>
          Details <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea
          {...fieldProps("description")}
          className={`${inputClass} min-h-28 py-2.5`}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What you saw, what you've already tried, anything the next person should know."
          rows={4}
        />
        {fieldError("description")}
      </div>

      {askName && (
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            Your name
          </label>
          <input
            {...fieldProps("name")}
            className={textInputClass}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Sam O."
            autoComplete="name"
            enterKeyHint="done"
          />
          {errors.name ? fieldError("name") : <p className={hintClass}>Saved on this device for next time.</p>}
        </div>
      )}

      {!askName && (
        <ActingAs
          verb="Reporting"
          name={values.name}
          onChange={() => {
            set("name", "");
            setAskName(true);
          }}
        />
      )}

      {submitError && (
        <p role="alert" className="rounded-sm border border-danger/30 bg-urgent-soft px-3 py-2 text-sm">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={create.isPending} className={`${primaryButtonClass} w-full sm:w-auto sm:self-start`}>
        {create.isPending ? "Sending…" : "Report issue"}
      </button>
    </form>
  );
}
