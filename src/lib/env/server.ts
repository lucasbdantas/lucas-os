import "server-only";

export const defaultOpenAIModel = "gpt-4.1-nano";

export type PublicSupabaseRuntimeEnv = {
  supabaseAnonKey: string;
  supabaseUrl: string;
};

export function getPublicSupabaseRuntimeEnv(): PublicSupabaseRuntimeEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseAnonKey,
    supabaseUrl,
  };
}

export function getServerEnvironmentStatus() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    missing,
    ok: missing.length === 0,
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    openAIModel: process.env.OPENAI_MODEL?.trim() || defaultOpenAIModel,
  };
}
