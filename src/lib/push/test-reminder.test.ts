import { describe, expect, test } from "vitest";
import { getPushTestSchedule } from "./test-reminder";

describe("push test reminder schedule", () => {
  test("schedules two minutes ahead in the configured timezone", () => {
    expect(
      getPushTestSchedule(
        "America/Sao_Paulo",
        new Date("2026-07-14T18:30:00.000Z"),
      ),
    ).toEqual({
      dueDate: "2026-07-14",
      dueTime: "15:32",
    });
  });

  test("handles crossing midnight", () => {
    expect(
      getPushTestSchedule(
        "America/Sao_Paulo",
        new Date("2026-07-15T02:59:00.000Z"),
      ),
    ).toEqual({
      dueDate: "2026-07-15",
      dueTime: "00:01",
    });
  });
});
