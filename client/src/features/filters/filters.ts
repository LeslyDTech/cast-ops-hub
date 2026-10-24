import { isPriority, isStatus, PRIORITIES, STATUSES, type Priority, type Status } from "../../lib/domain";

// Filters live in the URL, so a filtered board can be bookmarked or shared
// ("everything urgent at Poolside Bar"). These pure functions convert both ways.

export interface BoardFilters {
  status: Status[];
  priority: Priority[];
  locationId: number | null;
}

export const EMPTY_FILTERS: BoardFilters = { status: [], priority: [], locationId: null };

function splitList(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim());
}

/** Lenient: a hand-edited URL with junk values just drops them instead of erroring. */
export function parseFilters(params: URLSearchParams): BoardFilters {
  const status = STATUSES.filter((s) => splitList(params, "status").filter(isStatus).includes(s));
  const priority = PRIORITIES.filter((p) => splitList(params, "priority").filter(isPriority).includes(p));
  const raw = params.get("location");
  const locationId = raw && /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
  return { status, priority, locationId };
}

/** Canonical order, so the same filters always produce the same URL (and query key). */
export function toSearchParams(filters: BoardFilters): URLSearchParams {
  const params = new URLSearchParams();
  const status = STATUSES.filter((s) => filters.status.includes(s));
  const priority = PRIORITIES.filter((p) => filters.priority.includes(p));
  if (status.length) params.set("status", status.join(","));
  if (priority.length) params.set("priority", priority.join(","));
  if (filters.locationId !== null) params.set("location", String(filters.locationId));
  return params;
}

/** The API's query string (its parameter names differ slightly from the page URL's). */
export function toApiQuery(filters: BoardFilters): string {
  const params = new URLSearchParams();
  if (filters.status.length) params.set("status", filters.status.join(","));
  if (filters.priority.length) params.set("priority", filters.priority.join(","));
  if (filters.locationId !== null) params.set("locationId", String(filters.locationId));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function isFiltered(filters: BoardFilters): boolean {
  return filters.status.length > 0 || filters.priority.length > 0 || filters.locationId !== null;
}
