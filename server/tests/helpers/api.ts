import request from "supertest";
import { afterAll, beforeEach } from "vitest";
import { createApp } from "../../src/app.js";
import { pool } from "../../src/db/pool.js";
import { assertTestSchema } from "./test-schema.js";

export const app = createApp();
export const ACTOR = "Test Lead";
export const actorHeader = (name = ACTOR) => ({ "X-Actor-Name": encodeURIComponent(name) });

export interface Fixtures {
  grillId: number;
  cafeId: number;
}

/**
 * Gives every test in the file a clean database with two known locations.
 * Each test creates the issues it needs, so tests never depend on each other.
 */
export function useTestDb(): Fixtures {
  assertTestSchema();
  const fixtures: Fixtures = { grillId: 0, cafeId: 0 };

  beforeEach(async () => {
    await pool.query("TRUNCATE issue_events, issues, locations RESTART IDENTITY CASCADE");
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO locations (name, area) VALUES ('Test Grill', 'Dock'), ('Test Café', 'Plaza') RETURNING id`,
    );
    fixtures.grillId = rows[0]!.id;
    fixtures.cafeId = rows[1]!.id;
  });

  afterAll(() => pool.end());
  return fixtures;
}

export function validIssue(locationId: number, overrides: Record<string, unknown> = {}) {
  return {
    title: "Walk-in cooler warm",
    description: "Reading 44°F",
    category: "equipment",
    priority: "high",
    locationId,
    ...overrides,
  };
}

export async function createIssue(locationId: number, overrides: Record<string, unknown> = {}) {
  const res = await request(app).post("/api/issues").set(actorHeader()).send(validIssue(locationId, overrides));
  if (res.status !== 201) throw new Error(`createIssue failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: number; status: string };
}

export function changeStatus(id: number, body: Record<string, unknown>, actor = ACTOR) {
  return request(app).patch(`/api/issues/${id}/status`).set(actorHeader(actor)).send(body);
}
