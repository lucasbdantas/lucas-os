# Lucas OS

Personal Operations Dashboard self-hosted para Lucas Batista Dantas.

Este repositório segue o escopo em `SCOPE.md` e será construído em fases. A
Fase 1 entrega apenas a espinha operacional: auth, layout, domains, projects,
milestones, tasks, inbox, notificações simples, app settings, Today básico e
seed inicial.

## Stack Inicial

- Next.js App Router
- TypeScript
- Tailwind CSS
- npm
- Supabase
- Drizzle

## Getting Started

Instale as dependências e rode o servidor local:

```powershell
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Sem variáveis Supabase configuradas, `/` redireciona para `/login`. Com
Supabase configurado, `/` verifica a sessão e redireciona para `/today` quando
o usuário estiver autenticado.

## Environment

Crie um arquivo `.env.local` com base em `.env.example`.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

Nunca commitar `.env.local`.

## Comandos

```powershell
npm run dev
npm run lint
npm run build
```

## Seed Inicial

Antes de rodar o seed da Fase 1, aplique as migrations no Supabase e preencha
`.env.local` com `DATABASE_URL` e `SEED_USER_ID`. O `SEED_USER_ID` é o UUID do
usuário em Supabase Dashboard -> Authentication -> Users.

O script carrega `.env.local` automaticamente:

```powershell
npm run db:seed:phase1
```

O seed é idempotente para domínios e projetos. Ele cria apenas a estrutura
inicial da Fase 1; tarefas, projects, milestones e domains podem ser criados
manualmente pelo app depois do login.

## Checklist Fase 1

- Auth com Supabase email/senha.
- Rotas operacionais protegidas por sessão.
- Seed inicial de domains e projects.
- Leitura real via Supabase Auth + RLS.
- CRUD manual mínimo de tasks.
- CRUD manual mínimo de projects e milestones.
- CRUD manual mínimo de domains, sem delete.
- Today básico com contadores, Inbox, tasks e projects próximos.

## Fora do Escopo Agora

Google Calendar, Gmail, captura por voz, parsing com OpenAI, Health, Finance,
People CRM, TCC avançado, Serena avançado e Observations ficam para fases
posteriores.
