import { createHash, randomBytes } from "crypto";

export const captureTokenPrefix = "lcos_cap_";
export const captureTokenVisiblePrefixLength = 18;
export const captureTextMaxLength = 5000;

const allowedExternalSources = [
  "ios_shortcut",
  "android_shortcut",
  "webhook",
] as const;

export type ExternalCaptureSource = (typeof allowedExternalSources)[number];

export function generateCaptureToken() {
  return `${captureTokenPrefix}${randomBytes(32).toString("base64url")}`;
}

export function hashCaptureToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getCaptureTokenPrefix(token: string) {
  return token.slice(0, captureTokenVisiblePrefixLength);
}

export function normalizeExternalCaptureSource(
  source: unknown,
): ExternalCaptureSource {
  return allowedExternalSources.includes(source as ExternalCaptureSource)
    ? (source as ExternalCaptureSource)
    : "webhook";
}

export function parseBearerToken(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  return token || null;
}

export function normalizeCaptureText(value: unknown) {
  if (typeof value !== "string") {
    return { ok: false as const, text: "", reason: "invalid" };
  }

  const text = value.trim();

  if (!text) {
    return { ok: false as const, text, reason: "empty" };
  }

  if (text.length > captureTextMaxLength) {
    return { ok: false as const, text, reason: "too_long" };
  }

  return { ok: true as const, text };
}
