import { DatabaseError } from "pg";
import { pool, withTransaction, type Queryable } from "../db/pool.js";
import { conflict, HttpError, notFound } from "../http-error.js";
import type { Actor } from "../middleware/actor.js";
import type { Status } from "./domain.js";
import * as repo from "./issue.repository.js";
import type { CreateIssueInput, IssueFilters, UpdateStatusInput } from "./issue.schemas.js";
import { allowedTransitions, canTransition } from "./status-transitions.js";

export interface IssueDetail extends repo.Issue {
  events: repo.IssueEvent[];
  // The server owns the workflow; the UI renders buttons from this list.
  allowedTransitions: readonly Status[];
}

export function listIssues(filters: IssueFilters) {
  return repo.listIssues(pool, filters);
}

async function loadDetail(db: Queryable, id: number): Promise<IssueDetail> {
  const issue = await repo.findIssue(db, id);
  if (!issue) throw notFound(`Issue ${id} not found`);
  const events = await repo.listEvents(db, id);
  return { ...issue, events, allowedTransitions: allowedTransitions(issue.status) };
}

export function getIssue(id: number) {
  return loadDetail(pool, id);
}

export async function createIssue(input: CreateIssueInput, actor: Actor): Promise<IssueDetail> {
  try {
    // The issue and its "reported" audit event are committed together or not at all.
    return await withTransaction(async (tx) => {
      const id = await repo.insertIssue(tx, input, actor.name);
      await repo.insertEvent(tx, { issueId: id, fromStatus: null, toStatus: "open", changedBy: actor.name });
      return loadDetail(tx, id);
    });
  } catch (err) {
    // Let the foreign key decide whether the location exists, instead of a
    // separate SELECT that could race with a delete.
    if (err instanceof DatabaseError && err.code === "23503" && err.constraint === "issues_location_id_fkey") {
      throw new HttpError(400, "invalid_location", `Location ${input.locationId} does not exist`);
    }
    throw err;
  }
}

/**
 * Changes an issue's status and appends the audit event in one transaction.
 * The row lock means two people acting on the same issue at once can't both
 * read "open" and write conflicting histories: the second waits, then sees
 * the first one's result.
 */
export async function changeStatus(id: number, input: UpdateStatusInput, actor: Actor): Promise<IssueDetail> {
  return withTransaction(async (tx) => {
    const current = await repo.lockIssueStatus(tx, id);
    if (!current) throw notFound(`Issue ${id} not found`);

    if (!canTransition(current, input.status)) {
      throw conflict(`Can't move an issue from ${current} to ${input.status}`, {
        currentStatus: current,
        allowedTransitions: allowedTransitions(current),
      });
    }

    await repo.setStatus(tx, id, input.status);
    await repo.insertEvent(tx, {
      issueId: id,
      fromStatus: current,
      toStatus: input.status,
      note: input.note,
      changedBy: actor.name,
    });
    return loadDetail(tx, id);
  });
}
