import { describe, expect, it } from "vitest";
import {
  captureTextMaxLength,
  captureTokenPrefix,
  generateCaptureToken,
  getCaptureTokenPrefix,
  hashCaptureToken,
  normalizeCaptureText,
  normalizeExternalCaptureSource,
  parseBearerToken,
} from "./tokens";

describe("capture token helpers", () => {
  it("generates a token with the Lucas OS capture prefix", () => {
    const token = generateCaptureToken();

    expect(token.startsWith(captureTokenPrefix)).toBe(true);
    expect(token.length).toBeGreaterThan(captureTokenPrefix.length + 20);
  });

  it("hashes tokens deterministically without returning the raw token", () => {
    const token = "lcos_cap_example";
    const hash = hashCaptureToken(token);

    expect(hash).toBe(hashCaptureToken(token));
    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64);
  });

  it("returns a short visible prefix", () => {
    expect(getCaptureTokenPrefix("lcos_cap_abcdef123456")).toBe(
      "lcos_cap_abcdef123",
    );
  });

  it("parses bearer tokens safely", () => {
    expect(parseBearerToken("Bearer lcos_cap_abc")).toBe("lcos_cap_abc");
    expect(parseBearerToken("bearer   lcos_cap_abc  ")).toBe("lcos_cap_abc");
    expect(parseBearerToken("Token lcos_cap_abc")).toBeNull();
    expect(parseBearerToken(null)).toBeNull();
  });

  it("normalizes external capture sources", () => {
    expect(normalizeExternalCaptureSource("ios_shortcut")).toBe("ios_shortcut");
    expect(normalizeExternalCaptureSource("android_shortcut")).toBe(
      "android_shortcut",
    );
    expect(normalizeExternalCaptureSource("email")).toBe("webhook");
    expect(normalizeExternalCaptureSource(undefined)).toBe("webhook");
  });

  it("validates captured text", () => {
    expect(normalizeCaptureText("  comprar pilha  ")).toEqual({
      ok: true,
      text: "comprar pilha",
    });
    expect(normalizeCaptureText("   ").ok).toBe(false);
    expect(normalizeCaptureText(123).ok).toBe(false);
    expect(normalizeCaptureText("a".repeat(captureTextMaxLength + 1)).ok).toBe(
      false,
    );
  });
});
