import type { Status } from "../issues/domain.js";
import { withTransaction } from "./pool.js";
import { issues, locations } from "./seed-data.js";

interface EventRow {
  issueId: number;
  from: Status | null;
  to: Status;
  note: string | null;
  by: string;
  at: Date;
}

/** Replaces all data with the sample set. Runs in one transaction: all or nothing. */
export async function seed(log: (msg: string) => void = console.log) {
  const now = Date.now();

  await withTransaction(async (client) => {
    await client.query("TRUNCATE issue_events, issues, locations RESTART IDENTITY CASCADE");

    // unnest() turns parallel arrays into rows: one round trip for all locations.
    const loc = await client.query<{ id: number; name: string }>(
      `INSERT INTO locations (name, area)
       SELECT * FROM unnest($1::text[], $2::text[])
       RETURNING id, name`,
      [locations.map((l) => l.name), locations.map((l) => l.area)],
    );
    const locationId = new Map(loc.rows.map((r) => [r.name, r.id]));

    const events: EventRow[] = [];
    for (const issue of issues) {
      const createdAt = new Date(now - issue.hoursAgo * 3_600_000);
      const history = issue.history ?? [];

      let status: Status = "open";
      let updatedAt = createdAt;
      const issueEvents: Omit<EventRow, "issueId">[] = [
        { from: null, to: "open", note: null, by: issue.reportedBy, at: createdAt },
      ];
      for (const h of history) {
        const at = new Date(createdAt.getTime() + h.at * 60_000);
        if (at <= updatedAt || at.getTime() > now) {
          throw new Error(`Seed history out of order for "${issue.title}"`);
        }
        issueEvents.push({ from: status, to: h.to, note: h.note ?? null, by: h.by, at });
        status = h.to;
        updatedAt = at;
      }

      const id = locationId.get(issue.location);
      if (id === undefined) throw new Error(`Unknown seed location "${issue.location}"`);

      // updated_at is set explicitly; the trigger only fires on UPDATE, not INSERT.
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO issues
           (title, description, category, priority, status, location_id, reported_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [issue.title, issue.description, issue.category, issue.priority, status, id, issue.reportedBy, createdAt, updatedAt],
      );
      const issueId = rows[0]!.id;
      events.push(...issueEvents.map((e) => ({ ...e, issueId })));
    }

    await client.query(
      `INSERT INTO issue_events (issue_id, from_status, to_status, note, changed_by, created_at)
       SELECT * FROM unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::timestamptz[])`,
      [
        events.map((e) => e.issueId),
        events.map((e) => e.from),
        events.map((e) => e.to),
        events.map((e) => e.note),
        events.map((e) => e.by),
        events.map((e) => e.at),
      ],
    );

    log(`  seeded ${loc.rowCount} locations, ${issues.length} issues, ${events.length} events`);
  });
}
