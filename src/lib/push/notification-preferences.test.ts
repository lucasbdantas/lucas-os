import { describe, expect, it } from "vitest";
import {
  defaultNotificationPreferences,
  getNotificationDeliveryBlockReason,
  isInsideQuietHours,
  parseNotificationPreferences,
} from "./notification-preferences";

describe("notification preferences", () => {
  it("usa defaults para entrada inválida", () => {
    expect(parseNotificationPreferences(null)).toEqual(
      defaultNotificationPreferences,
    );
  });

  it("calcula quiet hours no mesmo dia", () => {
    expect(isInsideQuietHours("13:00", "12:00", "14:00")).toBe(true);
    expect(isInsideQuietHours("15:00", "12:00", "14:00")).toBe(false);
  });

  it("calcula janela cruzando meia-noite", () => {
    expect(isInsideQuietHours("23:30", "22:00", "07:00")).toBe(true);
    expect(isInsideQuietHours("06:30", "22:00", "07:00")).toBe(true);
    expect(isInsideQuietHours("12:00", "22:00", "07:00")).toBe(false);
  });

  it("bloqueia push desativado e fim de semana", () => {
    expect(
      getNotificationDeliveryBlockReason({
        ...defaultNotificationPreferences,
        pushEnabled: false,
      }),
    ).toBe("push_disabled");
    expect(
      getNotificationDeliveryBlockReason(
        {
          ...defaultNotificationPreferences,
          pushOnWeekends: false,
          timezone: "UTC",
        },
        new Date("2026-07-18T12:00:00.000Z"),
      ),
    ).toBe("weekend_disabled");
  });

  it("bloqueia dentro de quiet hours na timezone configurada", () => {
    expect(
      getNotificationDeliveryBlockReason(
        {
          ...defaultNotificationPreferences,
          quietHoursEnabled: true,
          timezone: "America/Sao_Paulo",
        },
        new Date("2026-07-17T02:30:00.000Z"),
      ),
    ).toBe("quiet_hours");
  });
});
