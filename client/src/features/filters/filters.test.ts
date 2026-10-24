import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, isFiltered, parseFilters, toApiQuery, toggle, toSearchParams } from "./filters";

const parse = (qs: string) => parseFilters(new URLSearchParams(qs));

describe("parseFilters", () => {
  it("reads an empty URL as no filters", () => {
    expect(parse("")).toEqual(EMPTY_FILTERS);
  });

  it("reads lists in canonical order regardless of URL order", () => {
    expect(parse("status=resolved,open&priority=low,urgent")).toEqual({
      status: ["open", "resolved"],
      priority: ["urgent", "low"],
      locationId: null,
    });
  });

  it("drops junk from hand-edited URLs instead of failing", () => {
    expect(parse("status=open,done&priority=critical&location=abc")).toEqual({
      status: ["open"],
      priority: [],
      locationId: null,
    });
    expect(parse("location=0").locationId).toBeNull();
  });

  it("reads a location id", () => {
    expect(parse("location=3").locationId).toBe(3);
  });
});

describe("toSearchParams", () => {
  it("round-trips through parseFilters", () => {
    const filters = { status: ["in_progress" as const], priority: ["urgent" as const, "high" as const], locationId: 2 };
    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });

  it("produces the same URL for the same filters in any order", () => {
    const a = toSearchParams({ status: ["resolved", "open"], priority: [], locationId: null }).toString();
    const b = toSearchParams({ status: ["open", "resolved"], priority: [], locationId: null }).toString();
    expect(a).toBe(b);
  });

  it("omits empty filters entirely", () => {
    expect(toSearchParams(EMPTY_FILTERS).toString()).toBe("");
  });
});

describe("toApiQuery", () => {
  it("maps to the API's parameter names", () => {
    expect(toApiQuery({ status: ["open"], priority: ["urgent", "high"], locationId: 4 })).toBe(
      "?status=open&priority=urgent%2Chigh&locationId=4",
    );
  });

  it("is empty with no filters", () => {
    expect(toApiQuery(EMPTY_FILTERS)).toBe("");
  });
});

describe("helpers", () => {
  it("toggle adds and removes", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });

  it("isFiltered", () => {
    expect(isFiltered(EMPTY_FILTERS)).toBe(false);
    expect(isFiltered({ ...EMPTY_FILTERS, locationId: 1 })).toBe(true);
  });
});
