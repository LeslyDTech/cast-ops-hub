import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

// Builds the app without calling listen(), so tests can drive it with supertest.
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
