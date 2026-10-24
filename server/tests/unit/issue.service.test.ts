import { beforeEach, describe, expect, it, vi } from "vitest";

// Unit-level check of the status-change orchestration: the repository and the
// transaction helper are replaced with fakes, so this runs without a database.
// The API tests cover the same flow against real Postgres.
const tx = { query: vi.fn() };

vi.mock("../../src/db/pool.js", () => ({
  pool: { query: vi.fn() },
  withTransaction: vi.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
}));

vi.mock("../../src/issues/issue.repository.js", () => ({
  lockIssueStatus: vi.fn(),
  setStatus: vi.fn(),
  insertEvent: vi.fn(),
  findIssue: vi.fn(),
  listEvents: vi.fn(),
  insertIssue: vi.fn(),
  listIssues: vi.fn(),
}));

const repo = await import("../../src/issues/issue.repository.js");
const { withTransaction } = await import("../../src/db/pool.js");
const { changeStatus } = await import("../../src/issues/issue.service.js");

const actor = { name: "Ana R." };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repo.findIssue).mockResolvedValue({ id: 7, status: "in_progress" } as never);
  vi.mocked(repo.listEvents).mockResolvedValue([]);
});

describe("changeStatus", () => {
  it("locks, updates, then records the event with the previous status, all in one transaction", async () => {
    vi.mocked(repo.lockIssueStatus).mockResolvedValue("open");

    const result = await changeStatus(7, { status: "in_progress", note: "On it" }, actor);

    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(repo.lockIssueStatus).toHaveBeenCalledWith(tx, 7);
    expect(repo.setStatus).toHaveBeenCalledWith(tx, 7, "in_progress");
    expect(repo.insertEvent).toHaveBeenCalledWith(tx, {
      issueId: 7,
      fromStatus: "open",
      toStatus: "in_progress",
      note: "On it",
      changedBy: "Ana R.",
    });

    // The lock must come first, or the "from" status could be stale.
    const order = (fn: unknown) => vi.mocked(fn as () => void).mock.invocationCallOrder[0]!;
    expect(order(repo.lockIssueStatus)).toBeLessThan(order(repo.setStatus));
    expect(order(repo.setStatus)).toBeLessThan(order(repo.insertEvent));

    expect(result.allowedTransitions).toEqual(["open", "resolved"]);
  });

  it("rejects a disallowed transition with 409 and writes nothing", async () => {
    vi.mocked(repo.lockIssueStatus).mockResolvedValue("resolved");

    await expect(changeStatus(7, { status: "in_progress" }, actor)).rejects.toMatchObject({
      status: 409,
      details: { currentStatus: "resolved", allowedTransitions: ["open"] },
    });
    expect(repo.setStatus).not.toHaveBeenCalled();
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });

  it("rejects setting the same status with 409", async () => {
    vi.mocked(repo.lockIssueStatus).mockResolvedValue("open");
    await expect(changeStatus(7, { status: "open" }, actor)).rejects.toMatchObject({ status: 409 });
    expect(repo.setStatus).not.toHaveBeenCalled();
  });

  it("returns 404 when the issue doesn't exist", async () => {
    vi.mocked(repo.lockIssueStatus).mockResolvedValue(undefined);
    await expect(changeStatus(99, { status: "resolved" }, actor)).rejects.toMatchObject({ status: 404 });
    expect(repo.setStatus).not.toHaveBeenCalled();
  });
});
