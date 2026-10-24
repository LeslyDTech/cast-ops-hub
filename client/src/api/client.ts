/** Every failed request becomes an ApiError, so the UI handles one shape. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Display name of the person acting; sent URI-encoded (headers are Latin-1 only). */
  actor?: string;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, { method = "GET", body, actor, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (actor) headers["X-Actor-Name"] = encodeURIComponent(actor);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "network_error", "Can't reach the server. Check your connection and try again.");
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const error = payload?.error;
    throw new ApiError(
      res.status,
      error?.code ?? "http_error",
      error?.message ?? `The server responded with ${res.status}.`,
      error?.details,
    );
  }
  return payload.data as T;
}
