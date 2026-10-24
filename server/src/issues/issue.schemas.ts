import { z } from "zod";
import { CATEGORIES, PRIORITIES, STATUSES } from "./domain.js";

// Postgres `integer` tops out here; larger ids would be a DB error, not a 404.
const MAX_INT4 = 2_147_483_647;

// JSON bodies must send a real number: no "2", no `true` coerced to 1.
const idSchema = z.number().int().positive().max(MAX_INT4);

// Path and query values are always strings; accept plain digits only
// (coercion would also let through "1e3", "0x10", " 7 ").
const idStringSchema = z
  .string()
  .regex(/^\d+$/, "Must be a positive whole number")
  .transform(Number)
  .pipe(idSchema);

export const issueIdParamsSchema = z.object({ id: idStringSchema });

// strictObject rejects unknown keys, so a client can't sneak in fields like
// `status` or `reported_by` that the server is responsible for setting.
export const createIssueSchema = z.strictObject({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  locationId: idSchema,
});

export const updateStatusSchema = z.strictObject({
  status: z.enum(STATUSES),
  // A blank note means "no note"; optional() is outermost so the type is `note?: string`.
  note: z
    .string()
    .trim()
    .max(500)
    .transform((n) => n || undefined)
    .optional(),
});

/**
 * Accepts `?status=open,in_progress`, `?status=open&status=resolved`, or a mix.
 * Empty values are treated as "no filter". Duplicates are removed.
 */
function listParam<T extends z.ZodType>(item: T) {
  return z.preprocess((value) => {
    if (value === undefined) return undefined;
    const parts = (Array.isArray(value) ? value : [value])
      .flatMap((v) => String(v).split(","))
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? [...new Set(parts)] : undefined;
  }, z.array(item).max(20).optional());
}

export const listIssuesQuerySchema = z.object({
  status: listParam(z.enum(STATUSES)),
  priority: listParam(z.enum(PRIORITIES)),
  locationId: listParam(idStringSchema),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type IssueFilters = z.infer<typeof listIssuesQuerySchema>;
