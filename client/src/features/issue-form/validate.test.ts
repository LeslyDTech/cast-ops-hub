import { describe, expect, it } from "vitest";
import { serverFieldErrors, toNewIssue, validate, type FormValues } from "./validate";

const valid: FormValues = {
  title: "Ice machine slushy",
  description: "",
  category: "equipment",
  priority: "high",
  locationId: "2",
  name: "Jordan L.",
};

describe("validate", () => {
  it("accepts a complete form", () => {
    expect(validate(valid)).toEqual({});
  });

  it("flags every missing required field", () => {
    const errors = validate({ ...valid, title: " ", category: "", locationId: "", name: "  " });
    expect(Object.keys(errors).sort()).toEqual(["category", "locationId", "name", "title"]);
  });

  it("measures the title after trimming", () => {
    expect(validate({ ...valid, title: "  ab  " }).title).toBeDefined();
    expect(validate({ ...valid, title: "x".repeat(121) }).title).toMatch(/120/);
  });

  it("limits description and name length", () => {
    expect(validate({ ...valid, description: "x".repeat(2001) }).description).toBeDefined();
    expect(validate({ ...valid, name: "x".repeat(81) }).name).toBeDefined();
  });
});

describe("toNewIssue", () => {
  it("trims text and converts the location to a number", () => {
    expect(toNewIssue({ ...valid, title: "  Ice  ", description: " wet " })).toEqual({
      title: "Ice",
      description: "wet",
      category: "equipment",
      priority: "high",
      locationId: 2,
    });
  });
});

describe("serverFieldErrors", () => {
  it("maps zod details onto known fields and ignores the rest", () => {
    expect(
      serverFieldErrors([
        { path: "title", message: "Too short" },
        { path: "", message: "Unrecognized key" },
      ]),
    ).toEqual({ title: "Too short" });
  });

  it("tolerates missing or malformed details", () => {
    expect(serverFieldErrors(undefined)).toEqual({});
    expect(serverFieldErrors("nope")).toEqual({});
  });
});
