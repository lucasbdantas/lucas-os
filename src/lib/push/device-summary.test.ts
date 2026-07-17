import { describe, expect, it } from "vitest";
import { summarizePushDevice } from "./device-summary";

describe("push device summary", () => {
  it("resume user agent sem copiar endpoint ou chaves", () => {
    const result = summarizePushDevice({
      created_at: "2026-07-16T10:00:00Z",
      id: "device-1",
      revoked_at: null,
      updated_at: "2026-07-16T11:00:00Z",
      user_agent: "Mozilla/5.0 (Linux; Android 15) Chrome/140.0",
    });

    expect(result.label).toBe("Chrome em Android");
    expect(result).not.toHaveProperty("endpoint");
    expect(result).not.toHaveProperty("auth");
    expect(result).not.toHaveProperty("p256dh");
  });
});
