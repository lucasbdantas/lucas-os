import { redirect } from "next/navigation";
import { loginWithPassword } from "@/lib/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

function getSafeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, returnTo } = await searchParams;
  const safeReturnTo = getSafeReturnTo(returnTo);
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(safeReturnTo ?? "/today");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <section className="w-full max-w-sm">
        <p className="text-sm font-medium text-zinc-500">Lucas OS</p>
        <h1 className="mt-3 text-3xl font-semibold">Entrar</h1>
        <form action={loginWithPassword} className="mt-8 space-y-4">
          {safeReturnTo ? (
            <input name="returnTo" type="hidden" value={safeReturnTo} />
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Senha</span>
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              name="password"
              required
              type="password"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button className="w-full rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
