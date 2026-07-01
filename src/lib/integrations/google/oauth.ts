import "server-only";

import {
  type GoogleTokenResponse,
  type GoogleUserInfo,
  googleIdentityScopes,
} from "@/lib/integrations/google/connected-account";

export type GoogleOAuthEnv = {
  clientId: string;
  clientSecret: string;
  encryptionKey: string;
  redirectUri: string;
};

export function getGoogleOAuthEnv(): GoogleOAuthEnv | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  const encryptionKey = process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim();

  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    encryptionKey,
    redirectUri,
  };
}

export function buildGoogleAuthorizationUrl(input: {
  env: GoogleOAuthEnv;
  state: string;
}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", input.env.clientId);
  url.searchParams.set("redirect_uri", input.env.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", googleIdentityScopes.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");

  return url;
}

export async function exchangeGoogleCodeForTokens(input: {
  code: string;
  env: GoogleOAuthEnv;
}): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: input.env.clientId,
      client_secret: input.env.clientSecret,
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.env.redirectUri,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Falha ao trocar codigo Google por tokens.");
  }

  return response.json();
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar perfil Google.");
  }

  return response.json();
}
