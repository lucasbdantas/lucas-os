# Deploy Readiness V1

## Status

Lucas OS esta tecnicamente pronto para preparar um deploy real, desde que o ambiente de producao receba as migrations e as variaveis corretas. Este documento e um checklist pratico; o plano operacional completo esta em `docs/deploy-v1-plan.md`.

## Checklist de codigo

- [ ] `git status --short` sem arquivos inesperados.
- [ ] `npm run lint` passa.
- [ ] `npm run build` passa.
- [ ] `npm run test` passa.
- [ ] `npm run test:e2e` passa.
- [ ] `npx tsc --noEmit` passa.
- [ ] `/api/health` aparece no build.
- [ ] `/api/capture` aparece no build.
- [ ] `/manifest.webmanifest` aparece no build.

## Checklist de secrets

- [ ] `.env.local` esta ignorado pelo Git.
- [ ] `playwright-report` esta ignorado pelo Git.
- [ ] `test-results` esta ignorado pelo Git.
- [ ] Nenhum token real aparece em docs, README, tests ou src.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nao e usado no runtime.
- [ ] `DATABASE_URL` nao aparece em app pages, components ou lib de runtime.
- [ ] `OPENAI_API_KEY` nao aparece em client components.

## Variaveis para producao

Publicas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `OPENAI_API_KEY` opcional.
- `OPENAI_MODEL` opcional, default recomendado `gpt-4.1-nano`.

Nao configurar na plataforma de app, salvo necessidade operacional explicita fora do runtime:

- `DATABASE_URL`
- `SEED_USER_ID`
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `E2E_BASE_URL`
- `E2E_PORT`
- `SUPABASE_SERVICE_ROLE_KEY`

## Checklist de Supabase

- [ ] Projeto Supabase de producao criado.
- [ ] Auth email/senha habilitado conforme uso esperado.
- [ ] Usuario inicial criado e confirmado.
- [ ] Migrations aplicadas em ordem:
  1. `20260629000001_initial_phase_1_schema.sql`
  2. `20260629000002_projects_unique_index.sql`
  3. `20260629000003_pending_captures.sql`
  4. `20260629000004_capture_tokens.sql`
  5. `20260629000005_recurring_tasks.sql`
- [ ] RLS ativa nas tabelas do app.
- [ ] Seed inicial rodado uma vez se o ambiente estiver vazio.

## Checklist manual pos-deploy

- [ ] Abrir `/api/health` e confirmar `{ "ok": true, "service": "lucas-os" }`.
- [ ] Abrir `/login`.
- [ ] Fazer login com usuario inicial.
- [ ] Confirmar acesso a `/today`.
- [ ] Abrir `/quick-capture` e salvar captura autenticada.
- [ ] Abrir `/capture` e confirmar captura pendente.
- [ ] Criar capture token em `/settings`.
- [ ] Testar `POST /api/capture` com token.
- [ ] Revogar token e confirmar que ele deixa de funcionar.
- [ ] Se `OPENAI_API_KEY` estiver configurada, testar AI preview sem criar task automaticamente.

## Rollback basico

1. Reverter o deploy para o ultimo build estavel na plataforma.
2. Nao apagar dados manualmente sem backup.
3. Se o problema for env var, corrigir env e redeploy.
4. Se o problema envolver migration aplicada, pausar novos deploys e revisar backup/SQL antes de qualquer ajuste.

## Proximo passo

Escolher a plataforma de hospedagem, preferencialmente Vercel para o primeiro deploy Next.js, e seguir `docs/deploy-v1-plan.md`.
