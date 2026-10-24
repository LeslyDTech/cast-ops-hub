import type { Issue } from "../../api/types";
import { PriorityTag } from "../../components/PriorityTag";
import { CATEGORY_LABEL, type Priority } from "../../lib/domain";
import { formatAge, formatDateTime } from "../../lib/time";

// A heavier left edge for the two priorities that need action now.
const EDGE: Record<Priority, string> = {
  urgent: "border-l-urgent",
  high: "border-l-high",
  medium: "border-l-line",
  low: "border-l-line",
};

export function IssueCard({ issue, now }: { issue: Issue; now: number }) {
  const resolved = issue.status === "resolved";
  // Active issues: how long it's been waiting. Resolved: how long since the fix.
  const [stampLabel, stamp] = resolved ? ["Resolved", issue.updatedAt] : ["Reported", issue.createdAt];
  return (
    <article
      aria-labelledby={`issue-${issue.id}-title`}
      className={`rounded-md border border-line border-l-[3px] bg-surface px-3 py-2.5 ${resolved ? "border-l-line" : EDGE[issue.priority]}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-2xs font-medium text-ink-muted">#{issue.id}</span>
        <PriorityTag priority={issue.priority} quiet={resolved} />
        <time
          dateTime={stamp}
          title={`${stampLabel} ${formatDateTime(stamp)}`}
          className="ml-auto font-mono text-2xs text-ink-muted"
        >
          <span className="sr-only">{stampLabel} </span>
          {formatAge(stamp, now)}
        </time>
      </div>
      <h3 id={`issue-${issue.id}-title`} className="mt-1.5 font-medium leading-snug text-ink">
        {issue.title}
      </h3>
      <p className="mt-1 truncate text-xs text-ink-muted">
        {issue.locationName}
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>
        {CATEGORY_LABEL[issue.category]}
      </p>
    </article>
  );
}
