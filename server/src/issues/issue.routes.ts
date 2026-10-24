import { Router } from "express";
import { requireActor } from "../middleware/actor.js";
import { createIssueSchema, issueIdParamsSchema, listIssuesQuerySchema, updateStatusSchema } from "./issue.schemas.js";
import * as service from "./issue.service.js";

// HTTP only: parse input, call the service, shape the response.
// zod errors thrown here become 400s in the central error handler.
export const issuesRouter = Router();

issuesRouter.get("/", async (req, res) => {
  const filters = listIssuesQuerySchema.parse(req.query);
  res.json({ data: await service.listIssues(filters) });
});

issuesRouter.get("/:id", async (req, res) => {
  const { id } = issueIdParamsSchema.parse(req.params);
  res.json({ data: await service.getIssue(id) });
});

issuesRouter.post("/", async (req, res) => {
  const actor = requireActor(req);
  const input = createIssueSchema.parse(req.body);
  const issue = await service.createIssue(input, actor);
  res.status(201).location(`/api/issues/${issue.id}`).json({ data: issue });
});

issuesRouter.patch("/:id/status", async (req, res) => {
  const actor = requireActor(req);
  const { id } = issueIdParamsSchema.parse(req.params);
  const input = updateStatusSchema.parse(req.body);
  res.json({ data: await service.changeStatus(id, input, actor) });
});
