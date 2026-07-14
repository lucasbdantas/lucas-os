import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { googleOAuthStateCookie } from "@/lib/integrations/google/constants";
import { createGoogleOAuthState } from "@/lib/integrations/google/state";
import {
  buildGoogleAuthorizationUrl,
  getGoogleOAuthEnv,
} from "@/lib/integrations/google/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const settingsUrl = new URL("/settings/integrations", request.url);

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

  const env = getGoogleOAuthEnv();
  if (!env) {
    settingsUrl.searchParams.set("error", "google_env_missing");
    return NextResponse.redirect(settingsUrl);
  }

  const state = createGoogleOAuthState(
    { returnTo: "/settings/integrations", userId: user.id },
    env.encryptionKey,
  );
  const cookieStore = await cookies();
  cookieStore.set(googleOAuthStateCookie, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(
    buildGoogleAuthorizationUrl({
      env,
      state,
    }),
  );
}
