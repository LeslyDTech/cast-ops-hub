import type { Queryable } from "../db/pool.js";
import type { Category, Priority, Status } from "./domain.js";
import type { CreateIssueInput, IssueFilters } from "./issue.schemas.js";

// Data access only: no business rules, no HTTP. Every function takes a
// Queryable so it can run on the pool or inside a caller's transaction.
// Columns are aliased to camelCase in SQL, so rows are API-shaped already.

export interface Issue {
  id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  locationId: number;
  locationName: string;
  reportedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueEvent {
  id: number;
  fromStatus: Status | null;
  toStatus: Status;
  note: string | null;
  changedBy: string;
  createdAt: Date;
}

const ISSUE_COLUMNS = `
  i.id, i.title, i.description, i.category, i.priority, i.status,
  i.location_id AS "locationId", l.name AS "locationName",
  i.reported_by AS "reportedBy", i.created_at AS "createdAt", i.updated_at AS "updatedAt"`;

// Phase 1 boards are small; this caps a runaway response until pagination lands.
const LIST_LIMIT = 500;

export async function listIssues(db: Queryable, filters: IssueFilters): Promise<Issue[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  // Values are always bound as $n parameters; only fixed SQL fragments are concatenated.
  if (filters.status) {
    params.push(filters.status);
    where.push(`i.status = ANY($${params.length}::text[])`);
  }
  if (filters.priority) {
    params.push(filters.priority);
    where.push(`i.priority = ANY($${params.length}::text[])`);
  }
  if (filters.locationId) {
    params.push(filters.locationId);
    where.push(`i.location_id = ANY($${params.length}::int[])`);
  }

  const { rows } = await db.query<Issue>(
    `SELECT ${ISSUE_COLUMNS}
     FROM issues i
     JOIN locations l ON l.id = i.location_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY array_position(ARRAY['urgent', 'high', 'medium', 'low'], i.priority), i.created_at DESC
     LIMIT ${LIST_LIMIT}`,
    params,
  );
  return rows;
}

export async function findIssue(db: Queryable, id: number): Promise<Issue | undefined> {
  const { rows } = await db.query<Issue>(
    `SELECT ${ISSUE_COLUMNS}
     FROM issues i
     JOIN locations l ON l.id = i.location_id
     WHERE i.id = $1`,
    [id],
  );
  return rows[0];
}

export async function listEvents(db: Queryable, issueId: number): Promise<IssueEvent[]> {
  const { rows } = await db.query<IssueEvent>(
    `SELECT id::int, from_status AS "fromStatus", to_status AS "toStatus", note,
            changed_by AS "changedBy", created_at AS "createdAt"
     FROM issue_events
     WHERE issue_id = $1
     ORDER BY created_at, id`,
    [issueId],
  );
  return rows;
}

export async function insertIssue(db: Queryable, input: CreateIssueInput, reportedBy: string): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO issues (title, description, category, priority, location_id, reported_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [input.title, input.description, input.category, input.priority, input.locationId, reportedBy],
  );
  return rows[0]!.id;
}

/**
 * Reads the current status and takes a row lock until the transaction ends,
 * so concurrent status changes to the same issue run one after another.
 */
export async function lockIssueStatus(db: Queryable, id: number): Promise<Status | undefined> {
  const { rows } = await db.query<{ status: Status }>("SELECT status FROM issues WHERE id = $1 FOR UPDATE", [id]);
  return rows[0]?.status;
}

export async function setStatus(db: Queryable, id: number, status: Status): Promise<void> {
  await db.query("UPDATE issues SET status = $2 WHERE id = $1", [id, status]);
}

export async function insertEvent(
  db: Queryable,
  event: { issueId: number; fromStatus: Status | null; toStatus: Status; note?: string; changedBy: string },
): Promise<void> {
  await db.query(
    `INSERT INTO issue_events (issue_id, from_status, to_status, note, changed_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [event.issueId, event.fromStatus, event.toStatus, event.note ?? null, event.changedBy],
  );
}
