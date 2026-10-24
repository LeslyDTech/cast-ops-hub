import { describe, expect, it } from "vitest";
import { formatAge } from "./time";

const NOW = new Date("2026-10-24T12:00:00Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("formatAge", () => {
  it.each([
    [10_000, "now"],
    [5 * 60_000, "5m"],
    [59 * 60_000, "59m"],
    [3 * 3_600_000, "3h"],
    [26 * 3_600_000, "1d"],
    [6 * 86_400_000, "6d"],
  ])("%i ms ago reads %s", (ms, expected) => {
    expect(formatAge(ago(ms), NOW)).toBe(expected);
  });

  it("switches to a date after a week", () => {
    expect(formatAge(ago(10 * 86_400_000), NOW)).toMatch(/Oct/);
  });

  it("never shows a negative age for slight clock skew", () => {
    expect(formatAge(new Date(NOW + 30_000).toISOString(), NOW)).toBe("now");
  });
});
