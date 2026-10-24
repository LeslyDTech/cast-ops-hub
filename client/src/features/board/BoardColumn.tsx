import type { Issue } from "../../api/types";
import { STATUS_LABEL, type Status } from "../../lib/domain";
import { IssueCard } from "./IssueCard";

const EMPTY_COPY: Record<Status, string> = {
  open: "Nothing waiting. New reports land here.",
  in_progress: "Nobody is working on anything right now.",
  resolved: "Fixed issues show up here.",
};

interface Props {
  status: Status;
  issues: Issue[];
  now: number;
  filtered: boolean;
  /** On phones only one column shows at a time. */
  className?: string;
}

export function BoardColumn({ status, issues, now, filtered, className = "" }: Props) {
  const headingId = `column-${status}`;
  return (
    <section aria-labelledby={headingId} className={`min-w-0 ${className}`}>
      {/* Phones already show the name and count in the column switcher. */}
      <header className="sr-only md:not-sr-only md:mb-2 md:flex md:items-baseline md:justify-between md:border-t-2 md:border-ink md:pt-2">
        <h2 id={headingId} className="text-xs font-medium uppercase tracking-wider">
          {STATUS_LABEL[status]}
        </h2>
        <span className="font-mono text-xs text-ink-muted">
          {issues.length}
          <span className="sr-only"> issues</span>
        </span>
      </header>

      {issues.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-muted">
          {filtered ? "No issues match these filters." : EMPTY_COPY[status]}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {issues.map((issue) => (
            <li key={issue.id}>
              <IssueCard issue={issue} now={now} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BoardColumnSkeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`min-w-0 ${className}`}>
      <div className="mb-2 border-t-2 border-line-strong pt-2">
        <div className="h-4 w-20 rounded-sm bg-sunken" />
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[78px] animate-pulse rounded-md border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
