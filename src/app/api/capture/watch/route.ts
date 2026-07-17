import { createClient } from "@supabase/supabase-js";
import {
  handleWatchCaptureRequest,
  type WatchCapturePersistenceInput,
  type WatchCapturePersistenceResult,
} from "@/lib/capture-tokens/watch-capture";
import { getPublicSupabaseRuntimeEnv } from "@/lib/env/server";

async function persistWatchCapture(
  input: WatchCapturePersistenceInput,
): Promise<WatchCapturePersistenceResult> {
  const env = getPublicSupabaseRuntimeEnv();

  if (!env) {
    return { ok: false, reason: "unavailable" };
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc(
    "create_watch_pending_capture_from_token",
    {
      p_captured_at: input.capturedAt,
      p_device_label: input.deviceLabel,
      p_raw_text: input.rawText,
      p_token_hash: input.tokenHash,
    },
  );

  if (error) {
    return { ok: false, reason: "unavailable" };
  }

  if (typeof data !== "string" || !data) {
    return { ok: false, reason: "invalid_token" };
  }

  return { captureId: data, ok: true };
}

export async function POST(request: Request) {
  return handleWatchCaptureRequest(request, persistWatchCapture);
}
