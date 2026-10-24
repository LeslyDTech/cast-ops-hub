import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Issue } from "../../api/types";
import { ErrorNotice } from "../../components/ErrorNotice";
import { STATUS_LABEL, STATUSES, type Status } from "../../lib/domain";
import { isFiltered, type BoardFilters } from "../filters/filters";
import { BoardColumn, BoardColumnSkeleton } from "./BoardColumn";
import { groupByStatus } from "./group-issues";

// Desktop: one grid column per visible status. Phone: a segmented control
// picks one column, because three 110px-wide columns are unreadable.
const GRID_COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3" };

interface Props {
  filters: BoardFilters;
  query: UseQueryResult<Issue[]>;
}

export function Board({ filters, query }: Props) {
  const [mobileStatus, setMobileStatus] = useState<Status>("open");

  const visible: readonly Status[] = filters.status.length ? STATUSES.filter((s) => filters.status.includes(s)) : STATUSES;
  // If the chosen phone column gets filtered out, fall back to the first visible one.
  const activeMobile = visible.includes(mobileStatus) ? mobileStatus : visible[0]!;

  const groups = useMemo(() => groupByStatus(query.data ?? []), [query.data]);
  // Re-read the clock whenever data arrives (every 30s), so ages stay current.
  const now = useMemo(() => Date.now(), [query.dataUpdatedAt]);

  if (query.isError && !query.data) {
    return <ErrorNotice title="Couldn't load the board" error={query.error} onRetry={() => query.refetch()} />;
  }

  return (
    <div>
      <div role="group" aria-label="Column" className="mb-4 grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-sunken p-1 md:hidden">
        {visible.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={status === activeMobile}
            onClick={() => setMobileStatus(status)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-sm text-xs font-medium text-ink-muted transition-colors duration-150 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-[0_0_0_1px_var(--color-line)]"
          >
            {STATUS_LABEL[status]}
            {query.data && <span className="font-mono text-ink-muted">{groups[status].length}</span>}
          </button>
        ))}
      </div>

      {query.isError && (
        <ErrorNotice compact title="Showing the last loaded board" error={query.error} onRetry={() => query.refetch()} />
      )}

      <div className={`grid gap-4 lg:gap-6 ${GRID_COLS[visible.length]}`} aria-busy={query.isPending}>
        {visible.map((status) => {
          const hideOnPhone = status === activeMobile ? "" : "hidden md:block";
          return query.isPending ? (
            <BoardColumnSkeleton key={status} className={hideOnPhone} />
          ) : (
            <BoardColumn
              key={status}
              status={status}
              issues={groups[status]}
              now={now}
              filtered={isFiltered(filters)}
              className={hideOnPhone}
            />
          );
        })}
      </div>
    </div>
  );
}
