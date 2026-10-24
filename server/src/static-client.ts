import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";

// server/src or server/dist → repo root → client/dist
export const DEFAULT_CLIENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");

/**
 * In production one service serves both the API and the built React app.
 * Does nothing if the client hasn't been built (dev uses Vite instead).
 * Returns whether the client is being served.
 */
export function serveClient(app: Express, dir: string): boolean {
  const indexHtml = path.join(dir, "index.html");
  if (!existsSync(indexHtml)) return false;

  // Vite fingerprints asset file names, so they can be cached forever.
  app.use("/assets", express.static(path.join(dir, "assets"), { immutable: true, maxAge: "1y", index: false }));
  app.use(express.static(dir, { index: false, maxAge: "1h" }));

  // Client-side routes (/, /issues/24, /issues/new…) all get the app shell.
  // API paths and missing assets fall through to the JSON 404.
  app.use((req, res, next) => {
    const isPage = (req.method === "GET" || req.method === "HEAD") && !/^\/(api|assets)(\/|$)/.test(req.path);
    if (!isPage) return next();
    res.set("Cache-Control", "no-cache"); // always pick up a new deploy
    res.sendFile(indexHtml);
  });
  return true;
}
