import { describe, expect, test } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  normalizeIntegrationEncryptionKey,
} from "./crypto";

describe("integration token crypto", () => {
  test("encrypts and decrypts a token", () => {
    const key = "test-only-encryption-key";
    const encrypted = encryptSecret("google-token-value", key);

    expect(encrypted).not.toContain("google-token-value");
    expect(decryptSecret(encrypted, key)).toBe("google-token-value");
  });

  test("accepts a 32-byte base64 key", () => {
    const rawKey = Buffer.alloc(32, 7).toString("base64");

    expect(normalizeIntegrationEncryptionKey(rawKey)).toHaveLength(32);
  });

  test("rejects invalid encrypted payload format", () => {
    expect(() => decryptSecret("not-valid", "test-key")).toThrow();
  });
});
