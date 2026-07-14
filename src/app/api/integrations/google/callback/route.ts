import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { encryptSecret } from "@/lib/integrations/crypto";
import { googleOAuthStateCookie } from "@/lib/integrations/google/constants";
import {
  normalizeGoogleConnectedAccount,
} from "@/lib/integrations/google/connected-account";
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleUserInfo,
  getGoogleOAuthEnv,
} from "@/lib/integrations/google/oauth";
import { validateGoogleOAuthState } from "@/lib/integrations/google/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExistingConnectedAccount = {
  id: string;
  refresh_token_encrypted: string | null;
};

function redirectWithStatus(request: NextRequest, key: "error" | "connected", value: string) {
  const url = new URL("/settings/integrations", request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(request.url);
  const oauthError = callbackUrl.searchParams.get("error");

  if (oauthError) {
    return redirectWithStatus(request, "error", "google_oauth_denied");
  }

  const code = callbackUrl.searchParams.get("code");
  const state = callbackUrl.searchParams.get("state");

  if (!code || !state) {
    return redirectWithStatus(request, "error", "google_callback_invalid");
  }

  const env = getGoogleOAuthEnv();
  if (!env) {
    return redirectWithStatus(request, "error", "google_env_missing");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", "/settings/integrations");
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  const cookieState = cookieStore.get(googleOAuthStateCookie)?.value;

  if (!cookieState || cookieState !== state) {
    return redirectWithStatus(request, "error", "google_state_invalid");
  }

  const stateValidation = validateGoogleOAuthState(state, env.encryptionKey, {
    expectedUserId: user.id,
  });

  if (!stateValidation.ok) {
    return redirectWithStatus(request, "error", "google_state_invalid");
  }

  try {
    const tokenResponse = await exchangeGoogleCodeForTokens({ code, env });

    if (!tokenResponse.access_token) {
      return redirectWithStatus(request, "error", "google_token_missing");
    }

    const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
    const normalized = normalizeGoogleConnectedAccount({
      tokenResponse,
      userInfo,
    });

    const existingResult = await supabase
      .from("connected_accounts")
      .select("id,refresh_token_encrypted")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("provider_account_id", normalized.providerAccountId)
      .maybeSingle<ExistingConnectedAccount>();

    if (existingResult.error) {
      throw new Error(existingResult.error.message);
    }

    const encryptedAccessToken = encryptSecret(
      tokenResponse.access_token,
      env.encryptionKey,
    );
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptSecret(tokenResponse.refresh_token, env.encryptionKey)
      : existingResult.data?.refresh_token_encrypted ?? null;

    const values = {
      access_token_encrypted: encryptedAccessToken,
      account_email: normalized.accountEmail,
      display_name: normalized.displayName,
      expires_at: normalized.expiresAt,
      provider: normalized.provider,
      provider_account_id: normalized.providerAccountId,
      refresh_token_encrypted: encryptedRefreshToken,
      scopes: normalized.scopes,
      status: normalized.status,
      user_id: user.id,
    };

    const writeResult = existingResult.data
      ? await supabase
          .from("connected_accounts")
          .update(values)
          .eq("id", existingResult.data.id)
          .eq("user_id", user.id)
      : await supabase.from("connected_accounts").insert(values);

    if (writeResult.error) {
      throw new Error(writeResult.error.message);
    }

    cookieStore.delete(googleOAuthStateCookie);

    return redirectWithStatus(request, "connected", "google");
  } catch {
    return redirectWithStatus(request, "error", "google_connect_failed");
  }
}
