import { describe, expect, it } from "vitest";
import {
  createIssueSchema,
  issueIdParamsSchema,
  listIssuesQuerySchema,
  updateStatusSchema,
} from "../../src/issues/issue.schemas.js";

const valid = { title: "Fryer pilot out", category: "equipment", priority: "high", locationId: 1 };

describe("createIssueSchema", () => {
  it("accepts a minimal issue and defaults description to empty", () => {
    expect(createIssueSchema.parse(valid)).toEqual({ ...valid, description: "" });
  });

  it("trims title and description", () => {
    const out = createIssueSchema.parse({ ...valid, title: "  Fryer pilot out  ", description: "  hot  " });
    expect(out.title).toBe("Fryer pilot out");
    expect(out.description).toBe("hot");
  });

  it.each([
    ["title too short after trimming", { title: "  ab  " }],
    ["title too long", { title: "x".repeat(121) }],
    ["description too long", { description: "x".repeat(2001) }],
    ["unknown category", { category: "food" }],
    ["unknown priority", { priority: "critical" }],
    ["locationId as a string", { locationId: "1" }],
    ["locationId as a boolean", { locationId: true }],
    ["locationId zero", { locationId: 0 }],
    ["locationId fractional", { locationId: 1.5 }],
    ["locationId beyond int4", { locationId: 2_147_483_648 }],
  ])("rejects %s", (_label, override) => {
    expect(createIssueSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it.each(["category", "priority", "title", "locationId"])("requires %s", (field) => {
    const input: Record<string, unknown> = { ...valid };
    delete input[field];
    const result = createIssueSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });

  it.each(["status", "reportedBy", "id"])("rejects server-owned field %s", (field) => {
    expect(createIssueSchema.safeParse({ ...valid, [field]: "x" }).success).toBe(false);
  });
});

describe("updateStatusSchema", () => {
  it("accepts a status with a trimmed note", () => {
    expect(updateStatusSchema.parse({ status: "resolved", note: "  fixed  " })).toEqual({
      status: "resolved",
      note: "fixed",
    });
  });

  it.each(["", "   "])("treats note %j as no note", (note) => {
    expect(updateStatusSchema.parse({ status: "open", note }).note).toBeUndefined();
  });

  it.each([
    ["unknown status", { status: "done" }],
    ["missing status", {}],
    ["note too long", { status: "open", note: "x".repeat(501) }],
    ["extra field", { status: "open", changedBy: "someone" }],
  ])("rejects %s", (_label, body) => {
    expect(updateStatusSchema.safeParse(body).success).toBe(false);
  });
});

describe("listIssuesQuerySchema", () => {
  it("treats an empty query as no filters", () => {
    expect(listIssuesQuerySchema.parse({})).toEqual({});
  });

  it("parses comma-separated values", () => {
    expect(listIssuesQuerySchema.parse({ status: "open,in_progress" }).status).toEqual(["open", "in_progress"]);
  });

  it("parses repeated params, mixed with commas, and removes duplicates", () => {
    const out = listIssuesQuerySchema.parse({ priority: ["high,urgent", "high"] });
    expect(out.priority).toEqual(["high", "urgent"]);
  });

  it("turns location ids into numbers", () => {
    expect(listIssuesQuerySchema.parse({ locationId: "3, 4" }).locationId).toEqual([3, 4]);
  });

  it.each(["", ",", " , "])("treats %j as no filter", (status) => {
    expect(listIssuesQuerySchema.parse({ status }).status).toBeUndefined();
  });

  it.each([
    { status: "open,done" },
    { priority: "critical" },
    { locationId: "abc" },
    { locationId: "-1" },
  ])("rejects invalid filter %j", (query) => {
    expect(listIssuesQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe("issueIdParamsSchema", () => {
  it("parses a numeric id", () => {
    expect(issueIdParamsSchema.parse({ id: "42" })).toEqual({ id: 42 });
  });

  it.each(["0", "-1", "1.5", "1e3", "0x10", " 7", "abc", "", "2147483648"])("rejects %j", (id) => {
    expect(issueIdParamsSchema.safeParse({ id }).success).toBe(false);
  });
});
