import { describe, expect, test } from "vitest";
import {
  createGoogleOAuthState,
  validateGoogleOAuthState,
} from "./state";

describe("google oauth state", () => {
  test("validates a signed state", () => {
    const state = createGoogleOAuthState(
      { userId: "user-1", returnTo: "/settings/integrations" },
      "state-secret",
    );

    const result = validateGoogleOAuthState(state, "state-secret", {
      expectedUserId: "user-1",
    });

    expect(result.ok).toBe(true);
  });

  test("rejects tampered state", () => {
    const state = createGoogleOAuthState({ userId: "user-1" }, "state-secret");

    expect(
      validateGoogleOAuthState(`${state}x`, "state-secret", {
        expectedUserId: "user-1",
      }),
    ).toEqual({ ok: false, reason: "invalid" });
  });

  test("rejects a user mismatch", () => {
    const state = createGoogleOAuthState({ userId: "user-1" }, "state-secret");

    expect(
      validateGoogleOAuthState(state, "state-secret", {
        expectedUserId: "user-2",
      }),
    ).toEqual({ ok: false, reason: "user_mismatch" });
  });

  test("rejects expired state", () => {
    const createdAt = Date.now();
    const state = createGoogleOAuthState({ userId: "user-1" }, "state-secret");

    expect(
      validateGoogleOAuthState(state, "state-secret", {
        expectedUserId: "user-1",
        now: createdAt + 11 * 60 * 1000,
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });
});
