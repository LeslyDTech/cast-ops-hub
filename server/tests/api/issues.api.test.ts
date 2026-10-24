import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { pool } from "../../src/db/pool.js";
import { ACTOR, actorHeader, app, changeStatus, createIssue, useTestDb, validIssue } from "../helpers/api.js";

const db = useTestDb();

async function eventsFor(issueId: number) {
  const { rows } = await pool.query(
    `SELECT from_status, to_status, note, changed_by FROM issue_events WHERE issue_id = $1 ORDER BY id`,
    [issueId],
  );
  return rows;
}

describe("POST /api/issues", () => {
  it("creates an open issue and its initial audit event", async () => {
    const res = await request(app)
      .post("/api/issues")
      .set(actorHeader())
      .send(validIssue(db.grillId, { title: "  Ice machine slushy  " }));

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/issues/${res.body.data.id}`);
    expect(res.body.data).toMatchObject({
      title: "Ice machine slushy",
      status: "open",
      locationId: db.grillId,
      locationName: "Test Grill",
      reportedBy: ACTOR,
      allowedTransitions: ["in_progress", "resolved"],
    });
    expect(res.body.data.events).toHaveLength(1);
    expect(await eventsFor(res.body.data.id)).toEqual([
      { from_status: null, to_status: "open", note: null, changed_by: ACTOR },
    ]);
  });

  it("keeps non-Latin-1 names intact through the URI-encoded actor header", async () => {
    const res = await request(app).post("/api/issues").set(actorHeader("Zoë Đorđević")).send(validIssue(db.cafeId));
    expect(res.status).toBe(201);
    expect(res.body.data.reportedBy).toBe("Zoë Đorđević");
  });

  it("requires an actor (401) and writes nothing", async () => {
    const res = await request(app).post("/api/issues").send(validIssue(db.grillId));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("actor_required");
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM issues");
    expect(rows[0].n).toBe(0);
  });

  it.each([
    ["blank", "%20%20"],
    ["badly encoded", "%E0%A4%A"],
    ["too long", "x".repeat(81)],
  ])("rejects a %s actor header with 400", async (_label, value) => {
    const res = await request(app).post("/api/issues").set("X-Actor-Name", value).send(validIssue(db.grillId));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_actor");
  });

  it("returns field-level validation details", async () => {
    const res = await request(app)
      .post("/api/issues")
      .set(actorHeader())
      .send(validIssue(db.grillId, { category: "food", title: "x" }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
    const paths = res.body.error.details.map((d: { path: string }) => d.path).sort();
    expect(paths).toEqual(["category", "title"]);
  });

  it("refuses a client-supplied status", async () => {
    const res = await request(app)
      .post("/api/issues")
      .set(actorHeader())
      .send(validIssue(db.grillId, { status: "resolved" }));
    expect(res.status).toBe(400);
  });

  it("maps an unknown location to 400 and leaves no partial rows", async () => {
    const res = await request(app).post("/api/issues").set(actorHeader()).send(validIssue(9999));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_location");
    const { rows } = await pool.query("SELECT (SELECT count(*) FROM issues)::int AS i, (SELECT count(*) FROM issue_events)::int AS e");
    expect(rows[0]).toEqual({ i: 0, e: 0 });
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await request(app)
      .post("/api/issues")
      .set(actorHeader())
      .set("Content-Type", "application/json")
      .send("{nope");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_json");
  });
});

describe("GET /api/issues", () => {
  async function seedBoard() {
    const a = await createIssue(db.grillId, { title: "Low grill", priority: "low" });
    const b = await createIssue(db.grillId, { title: "Urgent grill", priority: "urgent", category: "safety" });
    const c = await createIssue(db.cafeId, { title: "High café", priority: "high", category: "stock" });
    await changeStatus(c.id, { status: "in_progress" });
    const d = await createIssue(db.cafeId, { title: "Medium café", priority: "medium" });
    await changeStatus(d.id, { status: "resolved" });
    return { a, b, c, d };
  }

  const titles = (res: request.Response) => res.body.data.map((i: { title: string }) => i.title);

  it("lists all issues, most urgent first", async () => {
    await seedBoard();
    const res = await request(app).get("/api/issues");
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(["Urgent grill", "High café", "Medium café", "Low grill"]);
  });

  it.each([
    ["status=open", ["Urgent grill", "Low grill"]],
    ["status=in_progress,resolved", ["High café", "Medium café"]],
    ["priority=urgent&priority=low", ["Urgent grill", "Low grill"]],
    ["status=open&priority=high", []],
  ])("filters by %s", async (query, expected) => {
    await seedBoard();
    const res = await request(app).get(`/api/issues?${query}`);
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(expected);
  });

  it("filters by location", async () => {
    await seedBoard();
    const res = await request(app).get(`/api/issues?locationId=${db.cafeId}`);
    expect(titles(res)).toEqual(["High café", "Medium café"]);
    expect(new Set(res.body.data.map((i: { locationName: string }) => i.locationName))).toEqual(new Set(["Test Café"]));
  });

  it("rejects an invalid filter value with 400", async () => {
    const res = await request(app).get("/api/issues?status=done");
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("status.0");
  });
});

describe("GET /api/issues/:id", () => {
  it("returns the issue with its history and allowed next steps", async () => {
    const { id } = await createIssue(db.grillId);
    await changeStatus(id, { status: "in_progress", note: "Tech called" }, "Ana R.");

    const res = await request(app).get(`/api/issues/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
    expect(res.body.data.allowedTransitions).toEqual(["open", "resolved"]);
    expect(res.body.data.events.map((e: { fromStatus: string | null; toStatus: string }) => [e.fromStatus, e.toStatus])).toEqual([
      [null, "open"],
      ["open", "in_progress"],
    ]);
    expect(res.body.data.events[1]).toMatchObject({ note: "Tech called", changedBy: "Ana R." });
  });

  it("returns 404 for a missing issue and 400 for a malformed id", async () => {
    expect((await request(app).get("/api/issues/12345")).status).toBe(404);
    expect((await request(app).get("/api/issues/abc")).status).toBe(400);
  });
});

describe("PATCH /api/issues/:id/status", () => {
  it("updates the status and appends exactly one audit event", async () => {
    const { id } = await createIssue(db.grillId);
    const before = await request(app).get(`/api/issues/${id}`);

    const res = await changeStatus(id, { status: "in_progress", note: "  On it  " }, "Kenji M.");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(new Date(before.body.data.updatedAt).getTime());
    expect(await eventsFor(id)).toEqual([
      { from_status: null, to_status: "open", note: null, changed_by: ACTOR },
      { from_status: "open", to_status: "in_progress", note: "On it", changed_by: "Kenji M." },
    ]);
  });

  it("supports the full lifecycle including a reopen", async () => {
    const { id } = await createIssue(db.grillId);
    for (const status of ["in_progress", "resolved", "open", "resolved"]) {
      expect((await changeStatus(id, { status })).status).toBe(200);
    }
    const steps = (await eventsFor(id)).map((e) => `${e.from_status ?? "∅"}→${e.to_status}`);
    expect(steps).toEqual(["∅→open", "open→in_progress", "in_progress→resolved", "resolved→open", "open→resolved"]);
  });

  it("rejects a disallowed transition with 409 and changes nothing", async () => {
    const { id } = await createIssue(db.grillId);
    await changeStatus(id, { status: "resolved" });

    const res = await changeStatus(id, { status: "in_progress" });

    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual({ currentStatus: "resolved", allowedTransitions: ["open"] });
    expect((await request(app).get(`/api/issues/${id}`)).body.data.status).toBe("resolved");
    expect(await eventsFor(id)).toHaveLength(2);
  });

  it("rejects a no-op status change with 409", async () => {
    const { id } = await createIssue(db.grillId);
    expect((await changeStatus(id, { status: "open" })).status).toBe(409);
    expect(await eventsFor(id)).toHaveLength(1);
  });

  it("returns 404, 400 and 401 for missing issue, bad body and missing actor", async () => {
    const { id } = await createIssue(db.grillId);
    expect((await changeStatus(4242, { status: "resolved" })).status).toBe(404);
    expect((await changeStatus(id, { status: "done" })).status).toBe(400);
    expect((await request(app).patch(`/api/issues/${id}/status`).send({ status: "resolved" })).status).toBe(401);
  });

  it("rolls back the status update if writing the audit event fails", async () => {
    const { id } = await createIssue(db.grillId);
    // Make the audit insert fail *after* the UPDATE has already run in the same
    // transaction. If the transaction works, the UPDATE must be undone.
    await pool.query(`
      CREATE FUNCTION fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'simulated audit failure'; END; $$;
      CREATE TRIGGER fail_audit BEFORE INSERT ON issue_events
        FOR EACH ROW WHEN (NEW.note = 'boom') EXECUTE FUNCTION fail_audit();`);
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await changeStatus(id, { status: "resolved", note: "boom" });
      expect(res.status).toBe(500);
    } finally {
      quiet.mockRestore();
      await pool.query("DROP TRIGGER fail_audit ON issue_events; DROP FUNCTION fail_audit();");
    }

    expect((await request(app).get(`/api/issues/${id}`)).body.data.status).toBe("open");
    expect(await eventsFor(id)).toHaveLength(1);
  });

  it("keeps the audit trail consistent under concurrent updates", async () => {
    const { id } = await createIssue(db.grillId);

    // Fire conflicting changes at the same moment. Whatever order the row lock
    // serializes them in, every event's from_status must equal the previous to_status.
    const results = await Promise.all(
      ["in_progress", "resolved", "in_progress", "resolved"].map((status, i) => changeStatus(id, { status }, `Person ${i}`)),
    );
    for (const r of results) expect([200, 409]).toContain(r.status);

    const events = await eventsFor(id);
    expect(events).toHaveLength(1 + results.filter((r) => r.status === 200).length);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].from_status).toBe(events[i - 1].to_status);
    }
    const final = await request(app).get(`/api/issues/${id}`);
    expect(final.body.data.status).toBe(events.at(-1).to_status);
  });
});

describe("GET /api/locations", () => {
  it("lists locations alphabetically", async () => {
    const res = await request(app).get("/api/locations");
    expect(res.status).toBe(200);
    expect(res.body.data.map((l: { name: string }) => l.name)).toEqual(["Test Café", "Test Grill"]);
  });
});
