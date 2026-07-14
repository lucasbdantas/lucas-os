import "server-only";

export type WebPushEnv = {
  privateKey: string;
  publicKey: string;
  subject: string;
};

export function getWebPushEnv(): WebPushEnv | null {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    return null;
  }

  return {
    privateKey,
    publicKey,
    subject,
  };
}

export function getWebPushPublicKey() {
  return process.env.WEB_PUSH_PUBLIC_KEY?.trim() || null;
}
