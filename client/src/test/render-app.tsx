import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { App } from "../App";
import { ActorProvider } from "../features/identity/ActorProvider";

type Handler = (req: { method: string; path: string; body: unknown; headers: Record<string, string> }) => {
  status?: number;
  body: unknown;
};

/**
 * Renders the whole app at `url` with fetch answered by `handler`.
 * Returns the fetch mock so tests can assert on what was sent.
 */
export function renderApp(url: string, handler: Handler) {
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const { status = 200, body } = handler({
      method: init.method ?? "GET",
      path: input.replace(/^\/api/, ""),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      headers: (init.headers ?? {}) as Record<string, string>,
    });
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={client}>
      <ActorProvider>
        <MemoryRouter initialEntries={[url]}>
          <App />
        </MemoryRouter>
      </ActorProvider>
    </QueryClientProvider>,
  );
  return { ...utils, fetchMock };
}

export const ok = (data: unknown) => ({ body: { data } });
export const fail = (status: number, code: string, message: string, details?: unknown) => ({
  status,
  body: { error: { code, message, details } },
});

export const LOCATIONS = [
  { id: 1, name: "Harborview Grill", area: "Waterfront" },
  { id: 2, name: "Poolside Bar", area: "Resort Pool Deck" },
];
