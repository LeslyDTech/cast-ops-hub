import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { STATUS_LABEL, type Status } from "../lib/domain";

// Each status has its own shape, not just its own color.
const ICON = { open: CircleDashed, in_progress: CircleDot, resolved: CircleCheck } as const;
const TONE: Record<Status, string> = {
  open: "text-ink",
  in_progress: "text-ink",
  resolved: "text-accent",
};

export function StatusPill({ status }: { status: Status }) {
  const Icon = ICON[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${TONE[status]}`}>
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={2} />
      <span className="sr-only">Status: </span>
      {STATUS_LABEL[status]}
    </span>
  );
}
