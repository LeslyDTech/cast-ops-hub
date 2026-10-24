import { describe, expect, it } from "vitest";
import { STATUSES, type Status } from "../../src/issues/domain.js";
import { allowedTransitions, canTransition } from "../../src/issues/status-transitions.js";

describe("canTransition", () => {
  // Every (from, to) pair, so adding a status forces a decision about each new edge.
  const table: [Status, Status, boolean][] = [
    ["open", "open", false],
    ["open", "in_progress", true],
    ["open", "resolved", true],
    ["in_progress", "open", true],
    ["in_progress", "in_progress", false],
    ["in_progress", "resolved", true],
    ["resolved", "open", true],
    ["resolved", "in_progress", false],
    ["resolved", "resolved", false],
  ];

  it("covers every pair of statuses", () => {
    expect(table).toHaveLength(STATUSES.length ** 2);
  });

  it.each(table)("%s -> %s is %s", (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});

describe("allowedTransitions", () => {
  it.each(STATUSES)("never lets %s transition to itself", (status) => {
    expect(allowedTransitions(status)).not.toContain(status);
  });

  it("only reopens resolved issues to open", () => {
    expect(allowedTransitions("resolved")).toEqual(["open"]);
  });

  it("can reach every status from every other status", () => {
    for (const start of STATUSES) {
      const seen = new Set<Status>([start]);
      const queue: Status[] = [start];
      while (queue.length) {
        for (const next of allowedTransitions(queue.shift()!)) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect([...seen].sort()).toEqual([...STATUSES].sort());
    }
  });
});
