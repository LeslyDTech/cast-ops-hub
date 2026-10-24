import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { actorHeader, useTestDb, validIssue } from "../helpers/api.js";

const db = useTestDb();

describe("rate limiting on writes", () => {
  const limited = () => createApp({ rateLimits: { writes: 3, reports: 2 }, clientDir: null });

  it("limits new reports per client and answers in the API's error shape", async () => {
    const app = limited();
    const post = () => request(app).post("/api/issues").set(actorHeader()).send(validIssue(db.grillId));

    expect((await post()).status).toBe(201);
    expect((await post()).status).toBe(201);
    const blocked = await post();

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("rate_limited");
    expect(blocked.headers["ratelimit-policy"]).toBeDefined();
  });

  it("counts status changes as writes, but never limits reads", async () => {
    const app = limited();
    const created = await request(app).post("/api/issues").set(actorHeader()).send(validIssue(db.grillId));
    const id = created.body.data.id;
    const patch = (status: string) =>
      request(app).patch(`/api/issues/${id}/status`).set(actorHeader()).send({ status });

    expect((await patch("in_progress")).status).toBe(200);
    expect((await patch("resolved")).status).toBe(200);
    expect((await patch("open")).status).toBe(429); // 4th write in the window

    for (let i = 0; i < 10; i++) {
      expect((await request(app).get("/api/issues")).status).toBe(200);
    }
  });

  it("keeps separate budgets per client IP when behind a trusted proxy", async () => {
    // Simulates Render's proxy: with trust proxy set, X-Forwarded-For identifies the client.
    const app = limited();
    app.set("trust proxy", 1);
    const post = (ip: string) =>
      request(app).post("/api/issues").set(actorHeader()).set("X-Forwarded-For", ip).send(validIssue(db.grillId));

    await post("203.0.113.1");
    await post("203.0.113.1");
    expect((await post("203.0.113.1")).status).toBe(429);
    expect((await post("198.51.100.7")).status).toBe(201);
  });
});

describe("serving the built client", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "cast-ops-client-"));
    mkdirSync(path.join(dir, "assets"));
    writeFileSync(path.join(dir, "index.html"), "<!doctype html><title>Cast Ops Hub</title>");
    writeFileSync(path.join(dir, "assets", "index-abc123.js"), "console.log(1)");
    writeFileSync(path.join(dir, "favicon.svg"), "<svg/>");
    app = createApp({ clientDir: dir });
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it.each(["/", "/issues/24", "/issues/new?priority=high"])("serves the app shell for %s", async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.headers["cache-control"]).toBe("no-cache");
    expect(res.text).toContain("<title>Cast Ops Hub</title>");
  });

  it("serves fingerprinted assets with a long, immutable cache", async () => {
    const res = await request(app).get("/assets/index-abc123.js");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("immutable");
  });

  it("serves other static files", async () => {
    expect((await request(app).get("/favicon.svg")).status).toBe(200);
  });

  it.each([
    ["an unknown API route", "get", "/api/nope"],
    ["a missing asset", "get", "/assets/missing.js"],
    ["a non-GET page request", "post", "/issues/24"],
  ] as const)("returns the JSON 404 for %s", async (_label, method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("still answers the API normally", async () => {
    const res = await request(app).get("/api/locations");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
