import { PRIORITY_LABEL, type Priority } from "../lib/domain";

// Urgent and high stand out by fill, color AND an always-visible word, so the
// signal survives color blindness, grayscale screens and glare on the floor.
const STYLE: Record<Priority, string> = {
  urgent: "bg-urgent text-white",
  high: "bg-high-soft text-high ring-1 ring-inset ring-high/30",
  medium: "text-ink-muted ring-1 ring-inset ring-line-strong",
  low: "text-ink-muted",
};

// Color means "needs action". Once resolved, the word stays but the alarm goes.
const QUIET = "text-ink-muted ring-1 ring-inset ring-line";

export function PriorityTag({ priority, quiet = false }: { priority: Priority; quiet?: boolean }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-sm px-1.5 text-2xs font-medium uppercase tracking-wide ${quiet ? QUIET : STYLE[priority]}`}
    >
      <span className="sr-only">Priority: </span>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
