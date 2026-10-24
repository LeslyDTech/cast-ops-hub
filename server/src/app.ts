import express from "express";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { issuesRouter } from "./issues/issue.routes.js";
import { locationsRouter } from "./locations/location.routes.js";
import { resolveActor } from "./middleware/actor.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { writeRateLimits, type RateLimits } from "./middleware/rate-limit.js";
import { DEFAULT_CLIENT_DIR, serveClient } from "./static-client.js";

export interface AppOptions {
  rateLimits?: RateLimits;
  /** Built client to serve; null to serve the API only. */
  clientDir?: string | null;
}

// Builds the app without calling listen(), so tests can drive it with supertest.
export function createApp({
  rateLimits = { writes: config.WRITE_RATE_LIMIT, reports: config.REPORT_RATE_LIMIT },
  clientDir = config.CLIENT_DIST_DIR ?? DEFAULT_CLIENT_DIR,
}: AppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  // Behind Render's proxy, req.ip must be the client's address, not the proxy's,
  // or every visitor would share one rate-limit bucket.
  app.set("trust proxy", config.TRUST_PROXY);

  const limits = writeRateLimits(rateLimits);
  app.use("/api", limits.writes);
  app.post("/api/issues", limits.reports);

  app.use(express.json({ limit: "100kb" }));
  app.use(resolveActor);

  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", database: "ok" });
    } catch {
      res.status(503).json({ status: "degraded", database: "unreachable" });
    }
  });

  app.use("/api/locations", locationsRouter);
  app.use("/api/issues", issuesRouter);

  if (clientDir) serveClient(app, clientDir);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
