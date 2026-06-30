import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  hashCaptureToken,
  normalizeCaptureText,
  normalizeExternalCaptureSource,
  parseBearerToken,
} from "@/lib/capture-tokens/tokens";
import { getPublicSupabaseRuntimeEnv } from "@/lib/env/server";

type CaptureRequestBody = {
  source?: unknown;
  text?: unknown;
};

function jsonError(status: number) {
  return NextResponse.json(
    { ok: false, error: "capture_failed" },
    { status },
  );
}

function getSupabaseAnonClient() {
  const env = getPublicSupabaseRuntimeEnv();

  if (!env) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  const token = parseBearerToken(request.headers.get("authorization"));

  if (!token) {
    return jsonError(401);
  }

  let body: CaptureRequestBody;

  try {
    body = (await request.json()) as CaptureRequestBody;
  } catch {
    return jsonError(400);
  }

  const textResult = normalizeCaptureText(body.text);

  if (!textResult.ok) {
    return jsonError(400);
  }

  const supabase = getSupabaseAnonClient();

  if (!supabase) {
    return jsonError(500);
  }

  const { data, error } = await supabase.rpc(
    "create_pending_capture_from_token",
    {
      p_raw_text: textResult.text,
      p_source: normalizeExternalCaptureSource(body.source),
      p_token_hash: hashCaptureToken(token),
    },
  );

  if (error || data !== true) {
    return jsonError(401);
  }

  return NextResponse.json({ ok: true });
}
