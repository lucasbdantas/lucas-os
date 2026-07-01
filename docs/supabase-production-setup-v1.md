# Supabase Production Setup V1

## Objetivo

Guia operacional para preparar o Supabase de producao do Lucas OS antes do deploy na Vercel. Este guia nao aplica migrations automaticamente, nao cria secrets e nao substitui backup/controle de acesso do projeto Supabase.

## Checklist para criar projeto Supabase de producao

1. Criar um novo projeto Supabase para producao.
2. Escolher uma regiao adequada para o uso principal.
3. Guardar a senha do banco em local seguro, fora do Git.
4. Habilitar Auth por email/senha conforme o uso esperado.
5. Revisar URL/callbacks de Auth depois que a URL da Vercel existir.
6. Aplicar migrations em ordem.
7. Criar usuario inicial em Supabase Auth.
8. Rodar seed apenas se o ambiente estiver vazio.
9. Validar RLS com login real.
10. So depois seguir para deploy Vercel.

## Valores para copiar para Vercel

No Supabase Dashboard, copie:

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings -> API -> Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings -> API -> anon public key.

Esses valores sao publicos por natureza no modelo Supabase. Ainda assim, devem apontar para o projeto correto de producao.

## Valores que NAO entram no runtime do app

Nao configurar estas variaveis no runtime da Vercel para o Lucas OS atual:

- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`DATABASE_URL` pode ser usado localmente para migrations/seed, com muito cuidado. `SUPABASE_SERVICE_ROLE_KEY` nao e usada pelo app atual e nao deve ser exposta ao runtime.

## Ordem exata das migrations

Arquivos encontrados em `supabase/migrations`:

1. `20260629000001_initial_phase_1_schema.sql`
2. `20260629000002_projects_unique_index.sql`
3. `20260629000003_pending_captures.sql`
4. `20260629000004_capture_tokens.sql`
5. `20260629000005_recurring_tasks.sql`

Aplicar exatamente nessa ordem.

## Aplicar migrations via SQL Editor

Use este caminho se quiser fazer tudo pelo Supabase Dashboard:

1. Abrir Supabase Dashboard.
2. Entrar no projeto de producao.
3. Ir em SQL Editor.
4. Abrir localmente o primeiro arquivo de migration.
5. Copiar todo o conteudo.
6. Colar no SQL Editor.
7. Executar.
8. Repetir para cada arquivo, na ordem exata.
9. Se qualquer migration falhar, parar e investigar antes de aplicar a proxima.

Nao misture trechos de migrations. Aplique cada arquivo inteiro.

## Alternativa via Supabase CLI

Use esta alternativa apenas se o projeto local estiver linkado ao projeto Supabase correto.

Fluxo conceitual:

```powershell
supabase link --project-ref <PROJECT_REF_DE_PRODUCAO>
supabase db push
```

Antes de rodar, confirme:

- o `project-ref` e de producao;
- voce esta na branch correta;
- as migrations locais sao exatamente as aprovadas;
- existe backup ou ponto de retorno aceitavel.

Este guia nao executa esses comandos automaticamente.

## Validar que as tabelas existem

Depois das migrations, no SQL Editor, rode consultas simples de leitura estrutural:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'domains',
    'projects',
    'milestones',
    'tasks',
    'notifications',
    'app_settings',
    'pending_captures',
    'capture_tokens'
  )
order by table_name;
```

Resultado esperado: todas as tabelas acima aparecem.

Valide tambem colunas criticas:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'tasks' and column_name in ('reminder_offsets', 'recurrence_type', 'due_date', 'due_time'))
    or (table_name = 'pending_captures' and column_name in ('raw_text', 'status', 'source'))
    or (table_name = 'capture_tokens' and column_name in ('token_hash', 'token_prefix', 'revoked_at'))
  )
order by table_name, column_name;
```

## Criar usuario inicial no Supabase Auth

1. Abrir Authentication -> Users.
2. Criar usuario com o email principal.
3. Definir senha segura.
4. Confirmar email ou marcar como confirmado.
5. Copiar o UUID do usuario.
6. Guardar o UUID apenas para rodar seed se necessario.

## Rodar seed apontando para producao

Rodar seed apenas se o ambiente estiver vazio.

No computador local:

1. Conferir que `.env.local` nao sera commitado.
2. Temporariamente apontar `DATABASE_URL` para o banco de producao.
3. Definir `SEED_USER_ID` com o UUID do usuario inicial.
4. Rodar:

```powershell
npm run db:seed:phase1
```

5. Conferir no Supabase que domains/projects foram criados.
6. Remover ou trocar de volta qualquer valor local sensivel se necessario.

Nunca colocar `DATABASE_URL` de producao em `.env.example`, README, docs, issue ou commit.

## Cuidados antes de rodar seed em producao

- Confirmar que o Supabase selecionado e o de producao correto.
- Confirmar que `SEED_USER_ID` e do usuario inicial correto.
- Confirmar que o ambiente esta vazio ou que o seed idempotente e desejado.
- Nao rodar seed para "corrigir" dados manuais sem antes entender o impacto.
- Nao usar service role key.

## Testar RLS com login real

Depois do deploy preview:

1. Abrir `/login`.
2. Entrar com o usuario inicial.
3. Abrir `/domains` e confirmar domains do usuario.
4. Abrir `/projects` e confirmar projects do usuario.
5. Criar uma task simples em `/tasks`.
6. Confirmar que ela aparece em `/today`.
7. Sair da conta.
8. Tentar abrir `/today` e confirmar redirect para `/login`.

Opcional para auditoria no Supabase:

- verificar que linhas criadas usam `user_id` do usuario autenticado;
- confirmar que outro usuario nao enxerga esses dados, se voce criar usuario descartavel de teste.

## Checklist final antes de ir para Vercel

- [ ] Projeto Supabase de producao criado.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` copiado.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` copiado.
- [ ] `DATABASE_URL` nao configurado no runtime da Vercel.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nao configurada no runtime da Vercel.
- [ ] Migrations aplicadas em ordem.
- [ ] Tabelas validadas.
- [ ] Usuario inicial criado e confirmado.
- [ ] Seed rodado apenas se o ambiente estava vazio.
- [ ] RLS validada com login real.
- [ ] Auth URL/callback revisado depois que houver URL Vercel.
- [ ] Pronto para seguir `docs/deploy-v1-plan.md`.
