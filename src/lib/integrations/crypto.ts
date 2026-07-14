import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const algorithm = "aes-256-gcm";
const encryptionVersion = "v1";

export type EncryptedSecret = `${typeof encryptionVersion}:${string}:${string}:${string}`;

export function getIntegrationEncryptionKeyFromEnv() {
  return process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim() || null;
}

export function normalizeIntegrationEncryptionKey(rawKey: string): Buffer {
  const trimmed = rawKey.trim();

  if (!trimmed) {
    throw new Error("INTEGRATIONS_ENCRYPTION_KEY nao configurada.");
  }

  const base64 = Buffer.from(trimmed, "base64");
  if (base64.length === 32) {
    return base64;
  }

  const base64Url = Buffer.from(
    trimmed.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );
  if (base64Url.length === 32) {
    return base64Url;
  }

  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  return createHash("sha256").update(trimmed).digest();
}

export function encryptSecret(plaintext: string, rawKey: string) {
  const key = normalizeIntegrationEncryptionKey(rawKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    encryptionVersion,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":") as EncryptedSecret;
}

export function decryptSecret(payload: string, rawKey: string) {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(":");

  if (version !== encryptionVersion || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Formato de segredo criptografado invalido.");
  }

  const key = normalizeIntegrationEncryptionKey(rawKey);
  const decipher = createDecipheriv(
    algorithm,
    key,
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function safeStringEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
