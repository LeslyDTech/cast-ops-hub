import type { Status } from "../../lib/domain";

// Words for moves, from the point of view of the person doing them. The server
// decides which moves exist; this only decides what they're called.

export function actionLabel(from: Status, to: Status): string {
  if (to === "in_progress") return "Start work";
  if (to === "resolved") return "Mark resolved";
  return from === "resolved" ? "Reopen" : "Back to open";
}

/** Forward moves are primary; going back to open is secondary. */
export const isForward = (to: Status) => to !== "open";

export function eventSentence(from: Status | null, to: Status): string {
  if (from === null) return "reported this";
  if (to === "in_progress") return "started work";
  if (to === "resolved") return "marked it resolved";
  return from === "resolved" ? "reopened it" : "moved it back to open";
}
