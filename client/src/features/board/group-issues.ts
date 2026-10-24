import type { Issue } from "../../api/types";
import { priorityRank, STATUSES, type Status } from "../../lib/domain";

const time = (iso: string) => new Date(iso).getTime();

// Active columns answer "what needs attention next?": most severe first, and
// within a priority, whoever has been waiting longest.
const byUrgencyThenOldest = (a: Issue, b: Issue) =>
  priorityRank(a.priority) - priorityRank(b.priority) || time(a.createdAt) - time(b.createdAt);

// The resolved column answers "what just got fixed?".
const byRecentlyUpdated = (a: Issue, b: Issue) => time(b.updatedAt) - time(a.updatedAt);

export function groupByStatus(issues: readonly Issue[]): Record<Status, Issue[]> {
  const groups = Object.fromEntries(STATUSES.map((s) => [s, [] as Issue[]])) as Record<Status, Issue[]>;
  for (const issue of issues) groups[issue.status].push(issue);
  groups.open.sort(byUrgencyThenOldest);
  groups.in_progress.sort(byUrgencyThenOldest);
  groups.resolved.sort(byRecentlyUpdated);
  return groups;
}
