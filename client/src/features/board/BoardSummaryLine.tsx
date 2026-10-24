import { useMemo } from "react";
import { useIssues, useLocations } from "../../api/queries";
import { formatAge, formatDateTime } from "../../lib/time";
import type { BoardFilters } from "../filters/filters";
import { summarize } from "./board-summary";

/** "waiting 4d", "waiting <1m", or "waiting since Oct 3" for anything over a week. */
function waitingPhrase(iso: string, now: number): [string, string] {
  const age = formatAge(iso, now);
  if (age === "now") return ["waiting ", "<1m"];
  return /^\d+[mhd]$/.test(age) ? ["waiting ", age] : ["waiting since ", age];
}

/**
 * One line a lead can read from across the room. It follows the location
 * filter (a Poolside lead wants Poolside's numbers) but ignores the status and
 * priority filters, so hiding a column never hides an urgent problem.
 */
export function BoardSummaryLine({ filters }: { filters: BoardFilters }) {
  const query = useIssues({ status: ["open"], priority: [], locationId: filters.locationId });
  const locations = useLocations();
  const summary = useMemo(() => summarize(query.data ?? []), [query.data]);
  const now = useMemo(() => Date.now(), [query.dataUpdatedAt]);

  if (!query.data) return <p className="h-5" aria-hidden="true" />;

  const where = filters.locationId ? locations.data?.find((l) => l.id === filters.locationId)?.name : undefined;
  const { urgentOpen, oldestOpenAt } = summary;
  const waiting = oldestOpenAt ? waitingPhrase(oldestOpenAt, now) : null;

  return (
    // Phones stack the two facts; wider screens put them on one line with a dot.
    <p className="flex flex-col text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
      {urgentOpen > 0 ? (
        <span className="inline-flex items-center gap-1.5 font-medium text-urgent">
          <span aria-hidden="true" className="size-2 rounded-[1px] bg-urgent" />
          {urgentOpen} urgent {urgentOpen === 1 ? "issue" : "issues"} open
        </span>
      ) : (
        <span className="text-ink-muted">No urgent issues open</span>
      )}
      <span aria-hidden="true" className="hidden text-line-strong sm:inline">
        ·
      </span>
      {/* Starts its own line on phones, so it gets a capital there. */}
      <span className="text-ink-muted first-letter:uppercase sm:first-letter:normal-case">
        {oldestOpenAt && waiting ? (
          <>
            oldest open issue {waiting[0]}
            <time dateTime={oldestOpenAt} title={formatDateTime(oldestOpenAt)} className="font-mono text-ink">
              {waiting[1]}
            </time>
          </>
        ) : (
          "nothing waiting to be picked up"
        )}
        {where && ` at ${where}`}
      </span>
    </p>
  );
}
