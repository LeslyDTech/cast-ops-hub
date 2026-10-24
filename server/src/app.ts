import express from "express";
import { pool } from "./db/pool.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

// Builds the app without calling listen(), so tests can drive it with supertest.
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", database: "ok" });
    } catch {
      res.status(503).json({ status: "degraded", database: "unreachable" });
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
