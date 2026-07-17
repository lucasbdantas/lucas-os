import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
      <section className="paper-panel w-full max-w-md p-6 sm:p-8">
        <p className="section-kicker">Lucas OS</p>
        <h1 className="mt-3 text-4xl font-semibold">Entrar</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Seu caderno operacional para capturar, decidir e atravessar o dia com
          calma.
        </p>
        <form action={loginWithPassword} className="mt-8 space-y-5">
          {safeReturnTo ? (
            <input name="returnTo" type="hidden" value={safeReturnTo} />
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">Email</span>
            <input
              autoComplete="email"
              className="field-control mt-2 w-full px-3 py-3 text-sm outline-none"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">Senha</span>
            <input
              autoComplete="current-password"
              className="field-control mt-2 w-full px-3 py-3 text-sm outline-none"
              name="password"
              required
              type="password"
            />
          </label>

          {error ? (
            <p className="feedback-panel" data-tone="danger" role="alert">
              {error}
            </p>
          ) : null}

          <button className="primary-button w-full gap-2 px-4 py-3 text-sm font-semibold">
            Entrar <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
