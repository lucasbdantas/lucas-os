export type SafePushDevice = {
  createdAt: string;
  id: string;
  label: string;
  platform: string;
  revokedAt: string | null;
  updatedAt: string;
};

export function summarizePushDevice(input: {
  created_at: string;
  id: string;
  revoked_at: string | null;
  updated_at: string;
  user_agent: string | null;
}): SafePushDevice {
  const agent = input.user_agent ?? "";
  const platform = /Android/i.test(agent)
    ? "Android"
    : /iPhone|iPad/i.test(agent)
      ? "iOS/iPadOS"
      : /Windows/i.test(agent)
        ? "Windows"
        : /Macintosh|Mac OS/i.test(agent)
          ? "macOS"
          : "Plataforma não identificada";
  const browser = /Edg\//i.test(agent)
    ? "Edge"
    : /Chrome\//i.test(agent)
      ? "Chrome"
      : /Firefox\//i.test(agent)
        ? "Firefox"
        : /Safari\//i.test(agent)
          ? "Safari"
          : "Navegador";

  return {
    createdAt: input.created_at,
    id: input.id,
    label: `${browser} em ${platform}`,
    platform,
    revokedAt: input.revoked_at,
    updatedAt: input.updated_at,
  };
}
