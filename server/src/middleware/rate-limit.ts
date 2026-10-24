import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

const WINDOW_MS = 15 * 60_000;
const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface RateLimits {
  /** Status changes and reports combined, per IP per 15 minutes. 0 = off. */
  writes: number;
  /** New reports only, per IP per 15 minutes. 0 = off. */
  reports: number;
}

function limiter(limit: number, message: string, skip?: (method: string) => boolean): RequestHandler {
  if (limit === 0) return (_req, _res, next) => next();
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: "draft-8", // RateLimit and RateLimit-Policy headers
    legacyHeaders: false,
    skip: skip ? (req) => skip(req.method) : undefined,
    // Same error shape as every other API error, so the UI shows the message.
    handler: (_req, res) => {
      res.status(429).json({ error: { code: "rate_limited", message } });
    },
  });
}

/**
 * The demo is public, so writes are throttled per client IP. Reads stay
 * unlimited: the board polls every 30 seconds.
 */
export function writeRateLimits({ writes, reports }: RateLimits) {
  return {
    writes: limiter(
      writes,
      "Too many changes from this device. Try again in a few minutes.",
      (method) => READ_METHODS.has(method),
    ),
    reports: limiter(reports, "Too many new reports from this device. Try again in a few minutes."),
  };
}
