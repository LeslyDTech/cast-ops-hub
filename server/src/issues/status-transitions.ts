import type { Status } from "./domain.js";

// The issue workflow as data. Resolving straight from "open" is allowed (quick
// fixes like restocking paper); reopening always goes back to "open".
const TRANSITIONS: Record<Status, readonly Status[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["open", "resolved"],
  resolved: ["open"],
};

export function allowedTransitions(from: Status): readonly Status[] {
  return TRANSITIONS[from];
}

export function canTransition(from: Status, to: Status): boolean {
  return TRANSITIONS[from].includes(to);
}
