import { describe, expect, it } from "vitest";
import { cloneDateRange, validateDateRange, withRangeTime } from "./date-range";

describe("date range boundary", () => {
  const start = new Date(2026, 9, 19, 10, 20, 30);
  const end = new Date(2026, 9, 19, 11, 20, 30);

  it("clones Dates and rejects incomplete or invalid incoming ranges", () => {
    const result = cloneDateRange([start, end])!;
    expect(result).toEqual([start, end]);
    expect(result[0]).not.toBe(start);
    result[0].setHours(0);
    expect(start.getHours()).toBe(10);
    for (const value of [
      undefined,
      [],
      [start],
      [start, new Date(NaN)],
      ["2026-10-19", end],
    ]) {
      expect(cloneDateRange(value)).toBeUndefined();
    }
  });

  it("validates exact datetime limits but day-only date limits", () => {
    expect(
      validateDateRange([start, end], {
        showTime: true,
        minDate: start,
        maxDate: end,
      }),
    ).toBeUndefined();
    expect(
      validateDateRange([start, end], { showTime: true, minDate: end }),
    ).toBe("beforeMin");
    expect(
      validateDateRange([start, end], { showTime: true, maxDate: start }),
    ).toBe("afterMax");
    expect(
      validateDateRange([start, end], { minDate: end, maxDate: start }),
    ).toBeUndefined();
    expect(validateDateRange([end, start], { showTime: true })).toBe(
      "reversed",
    );
    expect(validateDateRange(undefined)).toBe("incomplete");
  });

  it("keeps valid clock seconds without mutating a date or rolling invalid times over", () => {
    const result = withRangeTime(start, "23:59:58")!;
    expect([
      result.getDate(),
      result.getHours(),
      result.getMinutes(),
      result.getSeconds(),
    ]).toEqual([19, 23, 59, 58]);
    expect(withRangeTime(start, "09:30")?.getSeconds()).toBe(0);
    expect(start.getHours()).toBe(10);
    for (const value of ["", "24:00", "10:60", "10:30:60", "nonsense"]) {
      expect(withRangeTime(start, value)).toBeUndefined();
    }
  });
});
