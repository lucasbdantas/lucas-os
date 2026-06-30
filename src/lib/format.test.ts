import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("format helpers", () => {
  it("keeps date-only formatting for YYYY-MM-DD values", () => {
    expect(formatDate("2026-06-29")).toBe("29/06/2026");
  });

  it("formats valid ISO timestamps without throwing", () => {
    expect(() => formatDateTime("2026-06-29T12:30:00.000Z")).not.toThrow();
    expect(formatDateTime("2026-06-29T12:30:00.000Z")).toContain("29/06/2026");
  });

  it("returns fallback for null or undefined timestamps", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined, "Nunca usado")).toBe("Nunca usado");
  });

  it("returns fallback for invalid timestamps instead of throwing", () => {
    expect(() => formatDateTime("nao-e-data")).not.toThrow();
    expect(formatDateTime("nao-e-data")).toBe("—");
  });
});
