import { describe, expect, it } from "vitest";
import {
  defaultAppPreferences,
  parseAppPreferences,
  parseAppPreferencesForm,
  toDateOnlyInTimezone,
} from "./preferences";

describe("app preferences", () => {
  it("returns safe defaults for missing settings", () => {
    expect(parseAppPreferences(null)).toEqual(defaultAppPreferences);
  });

  it("keeps valid values from stored json", () => {
    expect(
      parseAppPreferences({
        preferredHome: "/quick-capture",
        showProjectsWithoutNextAction: false,
        timezone: "UTC",
        todayDensity: "compact",
      }),
    ).toEqual({
      preferredHome: "/quick-capture",
      showProjectsWithoutNextAction: false,
      timezone: "UTC",
      todayDensity: "compact",
    });
  });

  it("falls back for invalid stored values", () => {
    expect(
      parseAppPreferences({
        preferredHome: "/admin",
        showProjectsWithoutNextAction: "yes",
        timezone: "Mars/Base",
        todayDensity: "tiny",
      }),
    ).toEqual(defaultAppPreferences);
  });

  it("parses form values", () => {
    const formData = new FormData();
    formData.set("timezone", "America/Sao_Paulo");
    formData.set("todayDensity", "compact");
    formData.set("preferredHome", "/quick-capture");

    expect(
      parseAppPreferencesForm({
        preferredHome: formData.get("preferredHome"),
        showProjectsWithoutNextAction: formData.get(
          "showProjectsWithoutNextAction",
        ),
        timezone: formData.get("timezone"),
        todayDensity: formData.get("todayDensity"),
      }),
    ).toEqual({
      preferredHome: "/quick-capture",
      showProjectsWithoutNextAction: false,
      timezone: "America/Sao_Paulo",
      todayDensity: "compact",
    });
  });

  it("formats date-only values in the configured timezone", () => {
    expect(
      toDateOnlyInTimezone("America/Sao_Paulo", new Date("2026-06-30T03:00:00Z")),
    ).toBe("2026-06-30");
    expect(toDateOnlyInTimezone("UTC", new Date("2026-06-30T03:00:00Z"))).toBe(
      "2026-06-30",
    );
  });
});
