import type { Issue } from "../api/types";

let nextId = 1;

export function makeIssue(overrides: Partial<Issue> = {}): Issue {
  const id = overrides.id ?? nextId++;
  return {
    id,
    title: `Issue ${id}`,
    description: "",
    category: "equipment",
    priority: "medium",
    status: "open",
    locationId: 1,
    locationName: "Harborview Grill",
    reportedBy: "Devon T.",
    createdAt: "2026-10-20T12:00:00.000Z",
    updatedAt: "2026-10-20T12:00:00.000Z",
    ...overrides,
  };
}
