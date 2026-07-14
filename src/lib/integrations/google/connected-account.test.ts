import { describe, expect, test } from "vitest";
import {
  googleCalendarReadonlyScope,
  googleGmailReadonlyScope,
  normalizeGoogleConnectedAccount,
  normalizeGoogleScopes,
} from "./connected-account";

describe("google connected account normalization", () => {
  test("normalizes account identity and scopes", () => {
    const account = normalizeGoogleConnectedAccount({
      now: new Date("2026-07-01T12:00:00.000Z"),
      tokenResponse: {
        expires_in: 3600,
        scope: "openid email profile email",
      },
      userInfo: {
        email: "lucas@example.com",
        name: "Lucas",
        sub: "google-123",
      },
    });

    expect(account).toEqual({
      accountEmail: "lucas@example.com",
      displayName: "Lucas",
      expiresAt: "2026-07-01T13:00:00.000Z",
      provider: "google",
      providerAccountId: "google-123",
      scopes: ["openid", "email", "profile"],
      status: "active",
    });
  });

  test("uses identity scopes when token response omits scopes", () => {
    expect(normalizeGoogleScopes()).toEqual([
      "openid",
      "email",
      "profile",
      googleCalendarReadonlyScope,
      googleGmailReadonlyScope,
    ]);
  });

  test("rejects missing provider account id", () => {
    expect(() =>
      normalizeGoogleConnectedAccount({
        tokenResponse: {},
        userInfo: { email: "lucas@example.com" },
      }),
    ).toThrow("identificador");
  });
});
