export const googleIdentityScopes = ["openid", "email", "profile"] as const;

export type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type GoogleUserInfo = {
  email?: string;
  name?: string;
  sub?: string;
};

export type NormalizedGoogleConnectedAccount = {
  accountEmail: string;
  displayName: string | null;
  expiresAt: string | null;
  provider: "google";
  providerAccountId: string;
  scopes: string[];
  status: "active";
};

export function normalizeGoogleScopes(scopeValue?: string) {
  if (!scopeValue?.trim()) {
    return [...googleIdentityScopes];
  }

  return Array.from(
    new Set(scopeValue.split(/\s+/).map((scope) => scope.trim()).filter(Boolean)),
  );
}

export function normalizeGoogleConnectedAccount(input: {
  now?: Date;
  tokenResponse: GoogleTokenResponse;
  userInfo: GoogleUserInfo;
}): NormalizedGoogleConnectedAccount {
  const providerAccountId = input.userInfo.sub?.trim();
  const accountEmail = input.userInfo.email?.trim();

  if (!providerAccountId) {
    throw new Error("Google nao retornou identificador da conta.");
  }

  if (!accountEmail) {
    throw new Error("Google nao retornou email da conta.");
  }

  const expiresIn = input.tokenResponse.expires_in;
  const expiresAt =
    typeof expiresIn === "number" && expiresIn > 0
      ? new Date((input.now ?? new Date()).getTime() + expiresIn * 1000).toISOString()
      : null;

  return {
    accountEmail,
    displayName: input.userInfo.name?.trim() || null,
    expiresAt,
    provider: "google",
    providerAccountId,
    scopes: normalizeGoogleScopes(input.tokenResponse.scope),
    status: "active",
  };
}
