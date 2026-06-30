import { describe, expect, it } from "vitest";
import {
  buildReminderNotifications,
  getReminderDateTimeIso,
  isReminderOverdue,
} from "./reminders";

describe("reminders", () => {
  it("calculates reminder at due time", () => {
    expect(
      getReminderDateTimeIso(
        "2026-06-30",
        "15:00",
        0,
        "America/Sao_Paulo",
      ),
    ).toBe("2026-06-30T18:00:00.000Z");
  });

  it("calculates 15 minutes before", () => {
    expect(
      getReminderDateTimeIso(
        "2026-06-30",
        "15:00",
        15,
        "America/Sao_Paulo",
      ),
    ).toBe("2026-06-30T17:45:00.000Z");
  });

  it("calculates 1 hour before", () => {
    expect(
      getReminderDateTimeIso(
        "2026-06-30",
        "15:00",
        60,
        "America/Sao_Paulo",
      ),
    ).toBe("2026-06-30T17:00:00.000Z");
  });

  it("calculates 1 day before", () => {
    expect(
      getReminderDateTimeIso(
        "2026-06-30",
        "15:00",
        1440,
        "America/Sao_Paulo",
      ),
    ).toBe("2026-06-29T18:00:00.000Z");
  });

  it("does not generate reminders without due_time", () => {
    expect(
      buildReminderNotifications({
        dueDate: "2026-06-30",
        dueTime: null,
        offsets: [15],
        taskId: "task-1",
        taskTitle: "Revisar relatório",
        timezone: "America/Sao_Paulo",
      }),
    ).toEqual([]);
  });

  it("classifies reminders before now as overdue", () => {
    expect(
      isReminderOverdue(
        "2026-06-30T17:45:00.000Z",
        "2026-06-30T18:00:00.000Z",
      ),
    ).toBe(true);
  });
});
