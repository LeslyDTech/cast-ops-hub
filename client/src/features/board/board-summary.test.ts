import { describe, expect, it } from "vitest";
import { makeIssue } from "../../test/fixtures";
import { summarize } from "./board-summary";

describe("summarize", () => {
  it("counts urgent issues in the Open column only", () => {
    const s = summarize([
      makeIssue({ priority: "urgent", status: "open" }),
      makeIssue({ priority: "urgent", status: "open" }),
      makeIssue({ priority: "urgent", status: "in_progress" }), // already owned
      makeIssue({ priority: "high", status: "open" }),
    ]);
    expect(s.urgentOpen).toBe(2);
  });

  it("finds the longest-waiting open issue, ignoring other statuses", () => {
    const s = summarize([
      makeIssue({ status: "open", createdAt: "2026-10-20T00:00:00Z" }),
      makeIssue({ status: "open", createdAt: "2026-10-18T00:00:00Z" }),
      makeIssue({ status: "resolved", createdAt: "2026-10-01T00:00:00Z" }),
    ]);
    expect(s.oldestOpenAt).toBe("2026-10-18T00:00:00Z");
  });

  it("handles an empty Open column", () => {
    expect(summarize([makeIssue({ status: "resolved" })])).toEqual({ urgentOpen: 0, oldestOpenAt: null });
  });
});
