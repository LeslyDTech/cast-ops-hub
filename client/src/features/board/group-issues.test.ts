import { describe, expect, it } from "vitest";
import { makeIssue } from "../../test/fixtures";
import { groupByStatus } from "./group-issues";

const titles = (list: { title: string }[]) => list.map((i) => i.title);

describe("groupByStatus", () => {
  it("puts every issue in its status column", () => {
    const groups = groupByStatus([
      makeIssue({ status: "open" }),
      makeIssue({ status: "resolved" }),
      makeIssue({ status: "in_progress" }),
      makeIssue({ status: "open" }),
    ]);
    expect([groups.open.length, groups.in_progress.length, groups.resolved.length]).toEqual([2, 1, 1]);
  });

  it("orders active columns by priority, then longest waiting", () => {
    const groups = groupByStatus([
      makeIssue({ title: "low old", priority: "low", createdAt: "2026-10-01T00:00:00Z" }),
      makeIssue({ title: "urgent new", priority: "urgent", createdAt: "2026-10-20T00:00:00Z" }),
      makeIssue({ title: "urgent old", priority: "urgent", createdAt: "2026-10-10T00:00:00Z" }),
      makeIssue({ title: "high", priority: "high", createdAt: "2026-10-19T00:00:00Z" }),
    ]);
    expect(titles(groups.open)).toEqual(["urgent old", "urgent new", "high", "low old"]);
  });

  it("orders resolved by most recently updated, ignoring priority", () => {
    const groups = groupByStatus([
      makeIssue({ title: "urgent earlier", status: "resolved", priority: "urgent", updatedAt: "2026-10-18T00:00:00Z" }),
      makeIssue({ title: "low latest", status: "resolved", priority: "low", updatedAt: "2026-10-20T00:00:00Z" }),
    ]);
    expect(titles(groups.resolved)).toEqual(["low latest", "urgent earlier"]);
  });

  it("returns empty columns for no issues", () => {
    expect(groupByStatus([])).toEqual({ open: [], in_progress: [], resolved: [] });
  });
});
