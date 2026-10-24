import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Issue } from "../../api/types";
import { makeIssue } from "../../test/fixtures";
import { BoardPage } from "./BoardPage";

const issues: Issue[] = [
  makeIssue({ id: 7, title: "Walk-in cooler reading 45°F", priority: "urgent" }),
  makeIssue({ id: 8, title: "Low on lemons", priority: "medium" }),
  makeIssue({ id: 9, title: "Fryer pilot out", priority: "high", status: "in_progress" }),
  makeIssue({ id: 10, title: "Receipt paper restocked", priority: "low", status: "resolved" }),
];

const fetchMock = vi.fn();

function respond(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(status < 400 ? { data } : data), { status }));
}

function renderBoard(url = "/") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <BoardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation((url: string) =>
    url.startsWith("/api/locations") ? respond([{ id: 1, name: "Harborview Grill", area: "Waterfront" }]) : respond(issues),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("BoardPage", () => {
  it("shows each issue in its status column with counts", async () => {
    renderBoard();
    const open = await screen.findByRole("region", { name: "Open" });
    expect(within(open).getAllByRole("article")).toHaveLength(2);
    expect(within(screen.getByRole("region", { name: "In progress" })).getByText("Fryer pilot out")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Resolved" })).getByText("Receipt paper restocked")).toBeInTheDocument();
  });

  it("summarizes urgent open issues regardless of the priority filter", async () => {
    renderBoard("/?priority=low");
    expect(await screen.findByText("1 urgent issue open")).toBeInTheDocument();
    expect(screen.getByText(/oldest open issue waiting/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/issues?status=open", expect.anything());
  });

  it("labels priority in text, not color alone", async () => {
    renderBoard();
    const card = await screen.findByRole("article", { name: "Walk-in cooler reading 45°F" });
    expect(within(card).getByText("Urgent")).toBeInTheDocument();
  });

  it("sends filters to the API and keeps them in the URL", async () => {
    const user = userEvent.setup();
    renderBoard();
    await screen.findByRole("region", { name: "Open" });

    await user.click(screen.getByRole("button", { name: "Urgent" }));

    expect(screen.getByRole("button", { name: "Urgent" })).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).toHaveBeenCalledWith("/api/issues?priority=urgent", expect.anything());
  });

  it("reads initial filters from the URL and hides unselected columns", async () => {
    renderBoard("/?status=open&location=1");
    await screen.findByRole("region", { name: "Open" });
    expect(screen.queryByRole("region", { name: "Resolved" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/issues?status=open&locationId=1", expect.anything());
  });

  it("shows the server's error message with a retry", async () => {
    fetchMock.mockImplementation(() =>
      respond({ error: { code: "internal_error", message: "Something went wrong" } }, 500),
    );
    renderBoard();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load the board");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(within(alert).getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
