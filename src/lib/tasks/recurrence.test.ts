import { describe, expect, it } from "vitest";
import {
  getNextOccurrenceDate,
  hasOpenDuplicateOccurrence,
} from "./recurrence";

describe("getNextOccurrenceDate", () => {
  it("adds 1 day for daily recurrence", () => {
    expect(
      getNextOccurrenceDate({
        dueDate: "2026-06-30",
        recurrenceInterval: 1,
        recurrenceType: "daily",
      }),
    ).toEqual({ nextDueDate: "2026-07-01", shouldCreate: true });
  });

  it("adds 7 days for weekly recurrence", () => {
    expect(
      getNextOccurrenceDate({
        dueDate: "2026-06-30",
        recurrenceInterval: 1,
        recurrenceType: "weekly",
      }),
    ).toEqual({ nextDueDate: "2026-07-07", shouldCreate: true });
  });

  it("adds 1 month for monthly recurrence", () => {
    expect(
      getNextOccurrenceDate({
        dueDate: "2026-06-30",
        recurrenceInterval: 1,
        recurrenceType: "monthly",
      }),
    ).toEqual({ nextDueDate: "2026-07-30", shouldCreate: true });
  });

  it("supports interval 2", () => {
    expect(
      getNextOccurrenceDate({
        dueDate: "2026-06-30",
        recurrenceInterval: 2,
        recurrenceType: "weekly",
      }),
    ).toEqual({ nextDueDate: "2026-07-14", shouldCreate: true });
  });

  it("does not create the next occurrence without due_date", () => {
    expect(
      getNextOccurrenceDate({
        dueDate: null,
        recurrenceInterval: 1,
        recurrenceType: "daily",
      }),
    ).toEqual({ reason: "missing_due_date", shouldCreate: false });
  });

  it("does not create the next occurrence past end_date", () => {
    expect(
      getNextOccurrenceDate({
        dueDate: "2026-06-30",
        recurrenceEndDate: "2026-07-06",
        recurrenceInterval: 1,
        recurrenceType: "weekly",
      }),
    ).toEqual({ reason: "past_end_date", shouldCreate: false });
  });
});

describe("hasOpenDuplicateOccurrence", () => {
  it("detects an existing open occurrence with the same due date", () => {
    expect(
      hasOpenDuplicateOccurrence(["2026-07-01", "2026-07-02"], "2026-07-01"),
    ).toBe(true);
  });
});
