import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const url = new URL("/settings/integrations", request.url);

  if (!supabase) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const accountId = String(formData.get("accountId") ?? "");

  if (!accountId) {
    url.searchParams.set("error", "google_account_missing");
    return NextResponse.redirect(url);
  }

  const result = await supabase
    .from("connected_accounts")
    .update({
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      status: "revoked",
    })
    .eq("id", accountId)
    .eq("user_id", user.id)
    .eq("provider", "google");

  if (result.error) {
    url.searchParams.set("error", "google_disconnect_failed");
    return NextResponse.redirect(url);
  }

  revalidatePath("/settings/integrations");
  url.searchParams.set("disconnected", "google");
  return NextResponse.redirect(url);
}
