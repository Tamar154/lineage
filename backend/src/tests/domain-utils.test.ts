import { describe, expect, it } from "vitest";
import {
  normalizeOptionalString,
  normalizeTreeName,
} from "../utils/normalization.js";
import {
  isDeathConclusivelyBeforeBirth,
  isPartialDateInFuture,
  partialDateToRange,
} from "../utils/partialDate.js";
import { normalizeRelationship } from "../services/normalizeRelationship.js";

describe("Phase 2 domain utilities", () => {
  it("normalizes tree display and unique names in one place", () => {
    expect(normalizeTreeName("  The\t Cohen\n Family  ")).toEqual({
      name: "The Cohen Family",
      normalizedName: "the cohen family",
    });
  });

  it("preserves omitted optional fields while normalizing explicit values", () => {
    expect(normalizeOptionalString(undefined)).toBeUndefined();
    expect(normalizeOptionalString(null)).toBeNull();
    expect(normalizeOptionalString("  ")).toBeNull();
    expect(normalizeOptionalString(" Tamar ")).toBe("Tamar");
  });

  it("converts partial dates to exact inclusive ranges including leap years", () => {
    expect(partialDateToRange({ value: "1990", precision: "YEAR" })).toEqual({
      start: new Date("1990-01-01T00:00:00.000Z"),
      end: new Date("1990-12-31T00:00:00.000Z"),
    });
    expect(partialDateToRange({ value: "2000-02", precision: "MONTH" })?.end).toEqual(
      new Date("2000-02-29T00:00:00.000Z"),
    );
    expect(partialDateToRange({ value: "1990-02-30", precision: "DAY" })).toBeNull();
    expect(partialDateToRange({ value: "1990-13", precision: "MONTH" })).toBeNull();
    expect(partialDateToRange({ value: "1990-1-2", precision: "DAY" })).toBeNull();
  });

  it("compares ranges without rejecting uncertain overlap", () => {
    expect(isDeathConclusivelyBeforeBirth(
      { value: "2000", precision: "YEAR" },
      { value: "1999-12-31", precision: "DAY" },
    )).toBe(true);
    expect(isDeathConclusivelyBeforeBirth(
      { value: "2000", precision: "YEAR" },
      { value: "2000-01", precision: "MONTH" },
    )).toBe(false);
    expect(isPartialDateInFuture({ value: "2999", precision: "YEAR" })).toBe(true);
    expect(isPartialDateInFuture({ value: "2999-01", precision: "MONTH" })).toBe(true);
    expect(isPartialDateInFuture({ value: "2999-01-01", precision: "DAY" })).toBe(true);
  });

  it("normalizes only spouse ordering", () => {
    expect(normalizeRelationship("b", "a", "SPOUSE")).toEqual({ personAId: "a", personBId: "b" });
    expect(normalizeRelationship("b", "a", "PARENT_CHILD")).toEqual({ personAId: "b", personBId: "a" });
  });
});
