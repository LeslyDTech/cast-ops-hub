import type { NewIssue } from "../../api/queries";
import { ACTOR_NAME_MAX } from "../identity/ActorProvider";
import type { Category, Priority } from "../../lib/domain";

// Same limits as the server's zod schema; the server stays the authority,
// this just gives instant, human-worded feedback.
export const LIMITS = { titleMin: 3, titleMax: 120, descriptionMax: 2000 } as const;

export interface FormValues {
  title: string;
  description: string;
  category: Category | "";
  priority: Priority;
  locationId: string; // <select> value
  name: string;
}

export type FieldName = keyof FormValues;
export type FieldErrors = Partial<Record<FieldName, string>>;

// Order matters: the first field with an error receives focus.
export const FIELD_ORDER: FieldName[] = ["title", "locationId", "category", "priority", "description", "name"];

export function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const title = values.title.trim();
  if (title.length < LIMITS.titleMin) errors.title = "Describe the problem in a few words.";
  else if (title.length > LIMITS.titleMax) errors.title = `Keep the title under ${LIMITS.titleMax} characters.`;
  if (!values.locationId) errors.locationId = "Choose where this is happening.";
  if (!values.category) errors.category = "Choose a category.";
  if (values.description.trim().length > LIMITS.descriptionMax) {
    errors.description = `Keep details under ${LIMITS.descriptionMax} characters.`;
  }
  const name = values.name.trim();
  if (!name) errors.name = "Add your name so the team knows who reported it.";
  else if (name.length > ACTOR_NAME_MAX) errors.name = `Keep your name under ${ACTOR_NAME_MAX} characters.`;
  return errors;
}

/** Only call after validate() returned no errors. */
export function toNewIssue(values: FormValues): NewIssue {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category as Category,
    priority: values.priority,
    locationId: Number(values.locationId),
  };
}

/** Maps the server's zod `details` (path → message) onto form fields. */
export function serverFieldErrors(details: unknown): FieldErrors {
  if (!Array.isArray(details)) return {};
  const errors: FieldErrors = {};
  for (const d of details) {
    const path = typeof d?.path === "string" ? d.path : "";
    if ((FIELD_ORDER as string[]).includes(path)) errors[path as FieldName] = String(d.message);
  }
  return errors;
}
