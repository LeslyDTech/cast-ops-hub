import type { Issue } from "../../api/types";

export interface BoardSummary {
  urgentOpen: number;
  /** createdAt of the longest-waiting issue nobody has picked up, or null. */
  oldestOpenAt: string | null;
}

/**
 * "Open" here means the Open column: reported but not yet picked up. That's the
 * signal a lead acts on; in-progress urgent issues already have an owner.
 * Filters on status client-side too, because optimistic updates can briefly
 * leave a moved issue in an open-only cache.
 */
export function summarize(issues: readonly Issue[]): BoardSummary {
  const open = issues.filter((i) => i.status === "open");
  const oldest = open.reduce<string | null>(
    (min, i) => (min === null || new Date(i.createdAt) < new Date(min) ? i.createdAt : min),
    null,
  );
  return { urgentOpen: open.filter((i) => i.priority === "urgent").length, oldestOpenAt: oldest };
}
