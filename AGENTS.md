# AGENTS.md — Lucas OS

## Produto

Este repositório implementa o Lucas OS: um Personal Operations Dashboard self-hosted, mobile-first e voice-first para Lucas Batista Dantas.

Leia `SCOPE.md` antes de tomar decisões relevantes de produto.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Prisma ou Drizzle, preferencialmente Drizzle se o projeto ainda estiver vazio
- OpenAI API para parsing estruturado de capturas
- PWA mobile-first

## Regras de construção

- Não construir o full scope de uma vez.
- Construir por fases.
- A Fase 1 deve entregar apenas:
  - auth
  - layout
  - domains
  - projects
  - milestones
  - tasks
  - inbox
  - notifications simples
  - app_settings
  - Today básico
  - seed inicial com domínios e projetos do Lucas
- Não avançar para Google Calendar, Gmail, Health, Finance, People CRM ou Observations antes da Fase 1 estar funcional.
- Tudo incerto deve cair em Inbox ou pending_captures.
- Não criar ações sensíveis sem modo approval-first.
- Não deletar dados sem confirmação explícita.
- Priorizar confiabilidade sobre beleza.

## Convenções

- Use componentes pequenos e legíveis.
- Use nomes claros.
- Comente decisões não óbvias.
- Toda tabela deve ter `id`, `created_at` e, quando fizer sentido, `updated_at`.
- Use RLS no Supabase, mesmo sendo single-user.
- Nunca commitar `.env`.
- Criar `.env.example`.

## Comandos esperados

Depois que o projeto existir:

- `npm run dev`
- `npm run lint`
- `npm run build`

Antes de considerar uma etapa pronta, rode lint e build quando possível.

## Definição de pronto

Uma etapa só está pronta quando:

1. O app roda localmente.
2. A tela relacionada abre sem erro.
3. O fluxo principal foi testado manualmente.
4. O schema/migration está claro.
5. Existe sugestão de commit git.