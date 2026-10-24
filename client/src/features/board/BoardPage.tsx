import { Outlet } from "react-router";
import { useIssues } from "../../api/queries";
import { formatClock } from "../../lib/time";
import { FilterBar } from "../filters/FilterBar";
import { useBoardFilters } from "../filters/useBoardFilters";
import { Board } from "./Board";

export function BoardPage() {
  const [filters, setFilters] = useBoardFilters();
  // One subscription for the page (one polling timer); children get the result.
  const issues = useIssues(filters);

  return (
    <>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h1 className="text-lg font-medium tracking-tight">Issue board</h1>
        <p aria-live="polite" className="font-mono text-2xs text-ink-muted">
          {issues.isFetching ? "Updating…" : issues.dataUpdatedAt ? `Updated ${formatClock(issues.dataUpdatedAt)}` : ""}
        </p>
      </div>
      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>
      <Board filters={filters} query={issues} />
      {/* Issue detail and the report form open as panels over the board. */}
      <Outlet />
    </>
  );
}
