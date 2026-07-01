# Backup & Recovery V1

## Objetivo

Plano minimo de backup e recuperacao para o Lucas OS em producao. Esta versao e apenas operacional: nao cria automacao, nao altera schema e nao adiciona integracoes externas.

## O que precisa ser protegido

### Supabase producao

Proteger o projeto Supabase de producao, incluindo:

- dados de `domains`;
- dados de `projects`;
- dados de `milestones`;
- dados de `tasks`;
- dados de `pending_captures`;
- dados de `capture_tokens`;
- dados de `notifications`;
- dados de `app_settings`;
- usuarios do Supabase Auth;
- funcoes SQL e policies RLS aplicadas pelas migrations.

### Vercel

Proteger configuracao operacional:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `OPENAI_API_KEY`, se configurada;
- `OPENAI_MODEL`, se configurada;
- historico de deploys e rollback.

### GitHub

Proteger:

- repositorio GitHub;
- historico de commits;
- migrations;
- documentacao operacional;
- branch principal.

## Backup manual recomendado antes do dominio final

Antes de apontar dominio real:

1. Confirmar que o deploy preview esta funcionando.
2. Exportar dados principais do Supabase.
3. Registrar quais migrations foram aplicadas.
4. Confirmar que o repositorio GitHub contem o ultimo estado aprovado.
5. Confirmar que as env vars da Vercel estao documentadas em local seguro, sem colar valores em Git.
6. Confirmar que o usuario inicial do Supabase Auth existe e esta confirmado.

## Como exportar dados pelo Supabase

Opcoes conceituais:

- Supabase Dashboard: usar recursos de exportacao/backup disponiveis no painel do projeto.
- Table Editor: exportar tabelas criticas como CSV quando o volume ainda for pequeno.
- SQL Editor: gerar consultas de leitura para validar contagens antes/depois.
- CLI ou `pg_dump`: usar apenas se voce souber exatamente qual banco esta acessando.

Tabelas iniciais para exportacao manual:

- `domains`;
- `projects`;
- `milestones`;
- `tasks`;
- `pending_captures`;
- `capture_tokens`;
- `notifications`;
- `app_settings`.

Nao salve exports com dados sensiveis dentro do repositorio.

## Como restaurar em caso de erro grave

1. Parar novas mudancas no app.
2. Identificar o tipo de erro:
   - deploy quebrado;
   - env var errada;
   - dados alterados;
   - migration aplicada de forma incorreta.
3. Se for deploy quebrado, usar rollback da Vercel para o deploy anterior.
4. Se for env var errada, corrigir env vars na Vercel e redeploy.
5. Se for dados alterados, restaurar a partir do backup/export mais recente.
6. Se for migration errada, nao tentar corrigir manualmente sem backup e plano SQL revisado.
7. Depois da restauracao, validar:
   - `/api/health`;
   - login;
   - `/today`;
   - `/tasks`;
   - `/capture`.

## Como recriar ambiente do zero

1. Clonar o repositorio:

```powershell
git clone <REPO_URL>
cd lucas-os
npm install
```

2. Criar novo projeto Supabase.

3. Aplicar migrations em ordem:

```text
20260629000001_initial_phase_1_schema.sql
20260629000002_projects_unique_index.sql
20260629000003_pending_captures.sql
20260629000004_capture_tokens.sql
20260629000005_recurring_tasks.sql
```

4. Criar usuario Auth inicial em Supabase.

5. Rodar seed se o ambiente estiver vazio:

```powershell
npm run db:seed:phase1
```

Use `DATABASE_URL` e `SEED_USER_ID` apenas temporariamente e fora do Git.

6. Configurar env vars na Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `OPENAI_API_KEY`, opcional;
- `OPENAI_MODEL`, opcional.

7. Testar:

- `/api/health`;
- login;
- `/today`.

8. Validar fluxos basicos:

- `/quick-capture`;
- `/capture`;
- `/tasks`;
- `/settings`;
- `/api/capture` com token externo.

## O que nunca deve ir para Git

- `.env.local`;
- `DATABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `OPENAI_API_KEY`;
- capture tokens completos;
- exports de banco com dados reais;
- senhas de usuarios;
- connection strings;
- screenshots contendo secrets.

## Checklist antes de mudancas perigosas

Use este checklist antes de:

- apontar dominio final;
- aplicar migration nova;
- rodar seed em ambiente nao vazio;
- alterar env vars de producao;
- trocar projeto Supabase;
- mexer em Auth Redirect URLs;
- revogar tokens em lote.

Checklist:

- [ ] `git status --short` revisado.
- [ ] Ultimo commit aprovado esta no GitHub.
- [ ] `npm run lint` passou.
- [ ] `npm run build` passou.
- [ ] `npm run test` passou.
- [ ] `npm run test:e2e` passou ou foi conscientemente pulado.
- [ ] Backup/export recente existe.
- [ ] Projeto Supabase correto confirmado.
- [ ] Vercel env vars revisadas.
- [ ] Plano de rollback definido.
- [ ] Nenhum secret sera colado em Git, docs ou issue.

## Limitacoes

- Ainda nao ha backup automatico.
- Ainda nao ha rotina agendada de restore test.
- Ainda nao ha monitoramento formal de erros.
- Backups manuais dependem de disciplina operacional.
- Exports CSV podem ser insuficientes para restauracao completa de Auth, policies e funcoes.

## Recomendacao para proxima iteracao

Depois do dominio final, definir:

- frequencia minima de backup;
- local seguro para armazenar exports;
- teste periodico de restore;
- monitoramento de erro da Vercel;
- estrategia de backup gerenciado no Supabase.
