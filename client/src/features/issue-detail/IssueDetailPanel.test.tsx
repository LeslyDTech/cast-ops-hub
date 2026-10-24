import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IssueDetail } from "../../api/types";
import type { Status } from "../../lib/domain";
import { makeIssue } from "../../test/fixtures";
import { fail, LOCATIONS, ok, renderApp } from "../../test/render-app";

function detail(status: Status, allowedTransitions: Status[], overrides: Partial<IssueDetail> = {}): IssueDetail {
  return {
    ...makeIssue({ id: 24, title: "Floor drain backing up", status, priority: "high", reportedBy: "Rosa V." }),
    allowedTransitions,
    events: [
      { id: 1, fromStatus: null, toStatus: "open", note: null, changedBy: "Rosa V.", createdAt: "2026-10-20T12:00:00Z" },
      { id: 2, fromStatus: "open", toStatus: "in_progress", note: "Drain snake booked", changedBy: "Chris P.", createdAt: "2026-10-20T13:00:00Z" },
    ],
    ...overrides,
  };
}

beforeEach(() => localStorage.setItem("cast-ops-hub.actor-name", "Ana R."));
afterEach(() => vi.unstubAllGlobals());

describe("Issue detail", () => {
  it("shows the issue and its audit history in order", async () => {
    renderApp("/issues/24", ({ path }) =>
      path === "/issues/24" ? ok(detail("in_progress", ["open", "resolved"])) : path === "/locations" ? ok(LOCATIONS) : ok([]),
    );
    const dialog = await screen.findByRole("dialog", { name: "Floor drain backing up" });

    const history = within(dialog).getByRole("region", { name: "History" });
    const items = within(history).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Rosa V. reported this"),
      expect.stringContaining("Chris P. started work"),
    ]);
    expect(items[1]).toHaveTextContent("Drain snake booked");
  });

  it.each([
    ["open", ["in_progress", "resolved"], ["Start work", "Mark resolved"]],
    ["in_progress", ["open", "resolved"], ["Mark resolved", "Back to open"]],
    ["resolved", ["open"], ["Reopen"]],
  ] as const)("for %s, offers exactly the server's allowed moves", async (status, allowed, labels) => {
    renderApp("/issues/24", ({ path }) => (path === "/issues/24" ? ok(detail(status, [...allowed])) : ok([])));
    const actions = await screen.findByRole("region", { name: "Update status" });
    const buttons = within(actions)
      .getAllByRole("button")
      .filter((b) => !/change/i.test(b.textContent ?? ""));
    expect(buttons.map((b) => b.textContent)).toEqual(labels);
  });

  it("sends the move with the note and the actor, then shows the server's result", async () => {
    const user = userEvent.setup();
    let current = detail("in_progress", ["open", "resolved"]);
    let sent: { body: unknown; headers: Record<string, string> } | undefined;
    renderApp("/issues/24", ({ method, path, body, headers }) => {
      if (method === "PATCH" && path === "/issues/24/status") {
        sent = { body, headers };
        current = detail("resolved", ["open"], {
          events: [
            ...current.events,
            { id: 3, fromStatus: "in_progress", toStatus: "resolved", note: "Clog cleared", changedBy: "Ana R.", createdAt: new Date().toISOString() },
          ],
        });
        return ok(current);
      }
      return path === "/issues/24" ? ok(current) : ok([]);
    });

    await user.type(await screen.findByLabelText(/Note/), "Clog cleared");
    await user.click(screen.getByRole("button", { name: "Mark resolved" }));

    expect(await screen.findByRole("button", { name: "Reopen" })).toBeInTheDocument();
    expect(sent?.body).toEqual({ status: "resolved", note: "Clog cleared" });
    expect(sent?.headers["X-Actor-Name"]).toBe("Ana%20R.");
    const history = screen.getByRole("region", { name: "History" });
    expect(within(history).getAllByRole("listitem").at(-1)).toHaveTextContent("Ana R. marked it resolved");
    expect(screen.getByLabelText(/Note/)).toHaveValue("");
  });

  it("explains a conflict and refreshes the options when someone else got there first", async () => {
    const user = userEvent.setup();
    let current = detail("in_progress", ["open", "resolved"]);
    renderApp("/issues/24", ({ method, path }) => {
      if (method === "PATCH") {
        current = detail("resolved", ["open"]); // another device resolved it meanwhile
        return fail(409, "conflict", "Can't move an issue from resolved to open", {
          currentStatus: "resolved",
          allowedTransitions: ["open"],
        });
      }
      return path === "/issues/24" ? ok(current) : ok([]);
    });

    await user.click(await screen.findByRole("button", { name: "Back to open" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Someone already updated this issue. It's now Resolved");
    expect(await screen.findByRole("button", { name: "Reopen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to open" })).not.toBeInTheDocument();
  });

  it("asks for a name before recording a change from a new device", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const { fetchMock } = renderApp("/issues/24", ({ path }) => (path === "/issues/24" ? ok(detail("open", ["in_progress", "resolved"])) : ok([])));

    await user.click(await screen.findByRole("button", { name: "Start work" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Add your name");
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(false);
  });

  it("says so when the issue doesn't exist", async () => {
    renderApp("/issues/999", ({ path }) => (path === "/issues/999" ? fail(404, "not_found", "Issue 999 not found") : ok([])));
    expect(await screen.findByRole("heading", { name: "Issue #999 doesn't exist" })).toBeInTheDocument();
  });

  it("opens from a card and returns focus to it on close", async () => {
    const user = userEvent.setup();
    const issue = detail("open", ["in_progress", "resolved"]);
    renderApp("/", ({ path }) => (path === "/issues/24" ? ok(issue) : path === "/issues" ? ok([issue]) : ok([])));

    const link = await screen.findByRole("link", { name: "Floor drain backing up" });
    await user.click(link);
    await screen.findByRole("dialog", { name: "Floor drain backing up" });
    await user.click(screen.getByRole("button", { name: "Close" }));

    await vi.waitFor(() => expect(screen.getByRole("link", { name: "Floor drain backing up" })).toHaveFocus());
  });

  it("closes back to the board, keeping the filters", async () => {
    const user = userEvent.setup();
    renderApp("/issues/24?priority=high", ({ path }) =>
      path === "/issues/24" ? ok(detail("open", ["in_progress", "resolved"])) : path === "/locations" ? ok(LOCATIONS) : ok([]),
    );
    await screen.findByRole("dialog", { name: "Floor drain backing up" });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "High" })).toHaveAttribute("aria-pressed", "true");
  });
});
