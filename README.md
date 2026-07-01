# Lucas OS

Personal Operations Dashboard self-hosted para Lucas Batista Dantas.

O projeto segue `SCOPE.md` e esta sendo construido por fases. O estado atual ja inclui auth, domains, projects, milestones, tasks, capture, AI preview opcional, mobile capture, quick capture, PWA, review, recurring tasks, app settings, reminders e notifications internas.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- npm
- Supabase Auth + Postgres + RLS
- Drizzle
- Vitest

## Setup local

Instale dependencias:

```powershell
npm install
```

Crie `.env.local` a partir de `.env.example`. Nunca commite `.env.local`.

Rode o app:

```powershell
npm run dev
```

Abra `http://localhost:3000`.

## Variaveis de ambiente

Publicas, usadas pelo client Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `OPENAI_API_KEY` opcional para AI capture preview.
- `OPENAI_MODEL` opcional, default documentado em `.env.example`.

Somente scripts locais:

- `DATABASE_URL`
- `SEED_USER_ID`

O app nao usa `SUPABASE_SERVICE_ROLE_KEY` para o runtime.

## Comandos principais

```powershell
npm run dev
npm run lint
npm run build
npm run test
npm run test:e2e
npx tsc --noEmit
```

## Seed inicial

Antes de rodar o seed da Fase 1, aplique as migrations no Supabase e preencha `.env.local` com `DATABASE_URL` e `SEED_USER_ID`. O `SEED_USER_ID` e o UUID do usuario em Supabase Dashboard -> Authentication -> Users.

```powershell
npm run db:seed:phase1
```

O seed e idempotente para domains e projects.

## Docs principais

- `SCOPE.md`
- `docs/current-system-state.md`
- `docs/phase-1-completion.md`
- `docs/phase-2-ai-capture-completion.md`
- `docs/mobile-capture-v1.md`
- `docs/app-settings-v1.md`
- `docs/recurring-tasks-v1.md`
- `docs/reminders-v1.md`
- `docs/deploy-readiness-v1.md`
- `docs/deploy-v1-plan.md`
- `docs/supabase-production-setup-v1.md`
- `docs/e2e-smoke-tests-v1.md`

## Health check

```text
GET /api/health
```

Resposta esperada:

```json
{ "ok": true, "service": "lucas-os" }
```
