// An error that knows which HTTP status it maps to. Services throw these;
// the central error handler turns them into JSON responses.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (message: string) => new HttpError(404, "not_found", message);
export const conflict = (message: string, details?: unknown) =>
  new HttpError(409, "conflict", message, details);
