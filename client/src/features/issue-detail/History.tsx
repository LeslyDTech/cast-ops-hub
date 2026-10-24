import type { IssueEvent } from "../../api/types";
import { sectionHeadingClass } from "../../lib/ui";
import { formatAge, formatDateTime } from "../../lib/time";
import { eventSentence } from "./wording";

/** The audit log, oldest first, so it reads as the story of the issue. */
export function History({ events }: { events: IssueEvent[] }) {
  const now = Date.now();
  return (
    <section aria-labelledby="history-heading">
      <h3 id="history-heading" className={`${sectionHeadingClass} mb-3`}>
        History
      </h3>
      <ol className="relative">
        {events.map((e, i) => {
          const last = i === events.length - 1;
          return (
            <li key={e.id} className="relative pb-5 pl-6 last:pb-0">
              {/* Rail and marker; the latest step is filled. */}
              {!last && <span aria-hidden="true" className="absolute top-3 bottom-0 left-[4px] w-px bg-line-strong" />}
              <span
                aria-hidden="true"
                className={`absolute top-[7px] left-0 size-[9px] rounded-[2px] border ${last ? "border-ink bg-ink" : "border-ink-muted bg-paper"}`}
              />
              <p className="text-sm">
                <span className="font-medium">{e.changedBy}</span> {eventSentence(e.fromStatus, e.toStatus)}
              </p>
              <p className="font-mono text-2xs text-ink-muted">
                <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, </span>
                {formatAge(e.createdAt, now) === "now" ? "just now" : `${formatAge(e.createdAt, now)} ago`}
              </p>
              {e.note && (
                <blockquote className="mt-1.5 border-l-2 border-line-strong pl-3 text-sm text-ink-muted">{e.note}</blockquote>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
