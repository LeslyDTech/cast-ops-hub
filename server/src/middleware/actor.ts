import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { HttpError } from "../http-error.js";

/**
 * Who is performing a request. Phase 1 only knows a display name; Phase 3 SSO
 * will add fields like `id` and `email`, populated from the session instead.
 */
export interface Actor {
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      actor?: Actor;
    }
  }
}

export const ACTOR_HEADER = "X-Actor-Name";

const actorNameSchema = z.string().trim().min(1).max(80);

/**
 * Phase 1 actor resolution: the client sends a self-reported name in a header,
 * URI-encoded so names outside Latin-1 survive (raw HTTP headers can't carry them).
 *
 * This is the only place that knows where the actor comes from. Phase 3
 * replaces it with an SSO middleware that sets req.actor from the verified
 * session; routes, services and SQL stay unchanged.
 */
export const resolveActor: RequestHandler = (req, _res, next) => {
  const raw = req.get(ACTOR_HEADER);
  if (raw !== undefined) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      throw new HttpError(400, "invalid_actor", `${ACTOR_HEADER} is not valid URI-encoded text`);
    }
    const parsed = actorNameSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new HttpError(400, "invalid_actor", `${ACTOR_HEADER} must be 1–80 characters`);
    }
    req.actor = { name: parsed.data };
  }
  next();
};

/** For write endpoints: every change in the audit log must have an author. */
export function requireActor(req: Request): Actor {
  if (!req.actor) {
    throw new HttpError(401, "actor_required", `Identify yourself with the ${ACTOR_HEADER} header`);
  }
  return req.actor;
}
