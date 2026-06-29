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

## Fora do Escopo Agora

Google Calendar, Gmail, captura por voz, parsing com OpenAI, Health, Finance,
People CRM, TCC avançado, Serena avançado e Observations ficam para fases
posteriores.
