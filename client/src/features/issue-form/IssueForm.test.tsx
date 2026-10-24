import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeIssue } from "../../test/fixtures";
import { fail, LOCATIONS, ok, renderApp } from "../../test/render-app";

afterEach(() => vi.unstubAllGlobals());

type Reply = { status?: number; body: unknown };

function handler(onCreate?: (body: unknown, headers: Record<string, string>) => Reply) {
  return ({ method, path, body, headers }: { method: string; path: string; body: unknown; headers: Record<string, string> }) => {
    if (path === "/locations") return ok(LOCATIONS);
    if (method === "POST" && path === "/issues") {
      return onCreate?.(body, headers) ?? ok({ ...makeIssue({ id: 31 }), events: [], allowedTransitions: [] });
    }
    if (path === "/issues/31") return ok({ ...makeIssue({ id: 31, title: "Ice machine slushy" }), events: [], allowedTransitions: ["in_progress", "resolved"] });
    return ok([]);
  };
}

describe("Report an issue", () => {
  it("shows field errors and focuses the first one instead of submitting", async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp("/issues/new", handler());
    await screen.findByRole("dialog", { name: "Report an issue" });

    await user.click(screen.getByRole("button", { name: "Report issue" }));

    expect(screen.getByText("Describe the problem in a few words.")).toBeInTheDocument();
    expect(screen.getByText("Choose where this is happening.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(screen.getByLabelText("What's wrong?")).toHaveFocus();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("submits a trimmed report with the reporter's name, then opens the new issue", async () => {
    const user = userEvent.setup();
    let sent: { body: unknown; headers: Record<string, string> } | undefined;
    renderApp(
      "/issues/new",
      handler((body, headers) => {
        sent = { body, headers };
        return ok({ ...makeIssue({ id: 31, title: "Ice machine slushy" }), events: [], allowedTransitions: ["in_progress", "resolved"] });
      }),
    );
    await screen.findByRole("option", { name: "Poolside Bar (Resort Pool Deck)" });

    await user.type(screen.getByLabelText("What's wrong?"), "  Ice machine slushy  ");
    await user.selectOptions(screen.getByLabelText("Where?"), "2");
    await user.click(screen.getByRole("radio", { name: "Equipment" }));
    await user.click(screen.getByRole("radio", { name: /^High/ }));
    await user.type(screen.getByLabelText("Your name"), "Zoë K.");
    await user.click(screen.getByRole("button", { name: "Report issue" }));

    expect(await screen.findByRole("dialog", { name: "Ice machine slushy" })).toBeInTheDocument();
    expect(sent?.body).toEqual({
      title: "Ice machine slushy",
      description: "",
      category: "equipment",
      priority: "high",
      locationId: 2,
    });
    expect(sent?.headers["X-Actor-Name"]).toBe(encodeURIComponent("Zoë K."));
    expect(localStorage.getItem("cast-ops-hub.actor-name")).toBe("Zoë K.");
  });

  it("skips the name field for a returning reporter, with a way to change it", async () => {
    localStorage.setItem("cast-ops-hub.actor-name", "Ana R.");
    const user = userEvent.setup();
    renderApp("/issues/new", handler());
    const dialog = await screen.findByRole("dialog", { name: "Report an issue" });

    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
    expect(within(dialog).getByText(/Reporting as/)).toHaveTextContent("Reporting as Ana R.");

    await user.click(screen.getByRole("button", { name: "Change name" }));
    expect(screen.getByLabelText("Your name")).toHaveValue("");
  });

  it("shows server-side field errors next to the field", async () => {
    localStorage.setItem("cast-ops-hub.actor-name", "Ana R.");
    const user = userEvent.setup();
    renderApp(
      "/issues/new",
      handler(() => fail(400, "validation_error", "Request is invalid", [{ path: "title", message: "Title is not allowed" }])),
    );
    await screen.findByRole("option", { name: "Harborview Grill (Waterfront)" });

    await user.type(screen.getByLabelText("What's wrong?"), "Something odd");
    await user.selectOptions(screen.getByLabelText("Where?"), "1");
    await user.click(screen.getByRole("radio", { name: "Stock" }));
    await user.click(screen.getByRole("button", { name: "Report issue" }));

    expect(await screen.findByText("Title is not allowed")).toBeInTheDocument();
    expect(screen.getByLabelText("What's wrong?")).toHaveAttribute("aria-invalid", "true");
  });
});
