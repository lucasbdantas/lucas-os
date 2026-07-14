import { createHmac, randomBytes } from "node:crypto";
import { safeStringEquals } from "../crypto";

const stateVersion = "v1";
const maxAgeMs = 10 * 60 * 1000;

export type GoogleOAuthStatePayload = {
  createdAt: number;
  nonce: string;
  returnTo: string;
  userId: string;
};

export type GoogleOAuthStateValidation =
  | { ok: true; payload: GoogleOAuthStatePayload }
  | { ok: false; reason: "expired" | "invalid" | "user_mismatch" };

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signStatePayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createGoogleOAuthState(
  input: { returnTo?: string; userId: string },
  secret: string,
) {
  const payload: GoogleOAuthStatePayload = {
    createdAt: Date.now(),
    nonce: randomBytes(16).toString("base64url"),
    returnTo: input.returnTo || "/settings/integrations",
    userId: input.userId,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signStatePayload(encodedPayload, secret);

  return `${stateVersion}.${encodedPayload}.${signature}`;
}

export function validateGoogleOAuthState(
  state: string,
  secret: string,
  options: { expectedUserId?: string; now?: number } = {},
): GoogleOAuthStateValidation {
  const [version, encodedPayload, signature] = state.split(".");

  if (version !== stateVersion || !encodedPayload || !signature) {
    return { ok: false, reason: "invalid" };
  }

  const expectedSignature = signStatePayload(encodedPayload, secret);
  if (!safeStringEquals(signature, expectedSignature)) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));

    if (
      typeof payload?.createdAt !== "number" ||
      typeof payload?.nonce !== "string" ||
      typeof payload?.returnTo !== "string" ||
      typeof payload?.userId !== "string"
    ) {
      return { ok: false, reason: "invalid" };
    }

    if (options.expectedUserId && payload.userId !== options.expectedUserId) {
      return { ok: false, reason: "user_mismatch" };
    }

    if ((options.now ?? Date.now()) - payload.createdAt > maxAgeMs) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
