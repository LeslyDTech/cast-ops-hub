import { Link, useLocation } from "react-router";
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
  const { search } = useLocation(); // carry board filters into the panel and back
  return (
    <article
      aria-labelledby={`issue-${issue.id}-title`}
      // Resolved cards step back: plain 1px edge, muted text, outline badge.
      className={`relative rounded-md border border-line bg-surface px-3 py-2.5 transition-colors duration-150 hover:border-line-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${resolved ? "" : `border-l-[3px] ${EDGE[issue.priority]}`}`}
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
      <h3
        id={`issue-${issue.id}-title`}
        className={`mt-1.5 leading-snug ${resolved ? "font-normal text-ink-muted" : "font-medium text-ink"}`}
      >
        {/* The title is the link (a short, clear accessible name); its ::after
            stretches over the card so the whole card is the tap target. */}
        <Link
          to={{ pathname: `/issues/${issue.id}`, search }}
          className="outline-none after:absolute after:inset-0 after:rounded-md"
        >
          {issue.title}
        </Link>
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
