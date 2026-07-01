# Deploy V1 Plan

## Plataforma recomendada

Recomendacao inicial: Vercel.

Motivos:

- suporte nativo a Next.js App Router;
- deploy por Git sem scripts extras;
- rotas API serverless suficientes para `/api/health` e `/api/capture`;
- configuracao simples de env vars;
- rollback por deploy anterior.

Plataformas equivalentes tambem servem se suportarem Next.js 16, rotas API e variaveis server-side.

## Pre-requisitos

- Repositorio Git com o estado aprovado.
- Projeto Supabase de producao.
- Supabase Auth configurado para email/senha.
- Migrations aplicadas no banco de producao.
- Usuario inicial criado no Supabase Auth.
- Variaveis de ambiente cadastradas na plataforma.
- Build local validado.

Antes de criar o deploy Vercel, siga `docs/supabase-production-setup-v1.md` para preparar o banco de producao.

## Variaveis de ambiente de producao

### Publicas

Estas variaveis sao expostas ao browser e devem apontar para o Supabase de producao:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server-only

Estas variaveis ficam somente no runtime server-side:

- `OPENAI_API_KEY`: opcional. Sem ela, AI preview deve falhar de forma amigavel.
- `OPENAI_MODEL`: opcional. Recomendado: `gpt-4.1-nano`.

### Apenas locais, nao entram na producao do app

Estas variaveis nao devem ser configuradas no runtime da Vercel para o app:

- `DATABASE_URL`
- `SEED_USER_ID`
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `E2E_BASE_URL`
- `E2E_PORT`
- `SUPABASE_SERVICE_ROLE_KEY`

`DATABASE_URL` e `SEED_USER_ID` podem ser usados localmente para rodar seed apontando para um ambiente especifico, com cuidado. `SUPABASE_SERVICE_ROLE_KEY` nao e necessaria para o Lucas OS atual.

## Ordem de aplicacao das migrations

Aplicar no Supabase de producao, nesta ordem:

1. `supabase/migrations/20260629000001_initial_phase_1_schema.sql`
2. `supabase/migrations/20260629000002_projects_unique_index.sql`
3. `supabase/migrations/20260629000003_pending_captures.sql`
4. `supabase/migrations/20260629000004_capture_tokens.sql`
5. `supabase/migrations/20260629000005_recurring_tasks.sql`

Depois, se o ambiente estiver vazio:

1. Criar o usuario inicial em Supabase Auth.
2. Copiar o UUID do usuario.
3. Preencher `DATABASE_URL` e `SEED_USER_ID` localmente, nunca no Git.
4. Rodar:

```powershell
npm run db:seed:phase1
```

## Criar usuario inicial

1. Abrir Supabase Dashboard.
2. Ir em Authentication -> Users.
3. Criar usuario com email real de uso.
4. Confirmar email ou marcar como confirmado no painel.
5. Guardar apenas o UUID para seed local, se necessario.

## Validacao antes de publicar

Rodar localmente:

```powershell
git status --short
git log --oneline -10
npm run lint
npm run build
npm run test
npm run test:e2e
npx tsc --noEmit
```

Tambem verificar:

- `.env.local` ignorado pelo Git;
- `playwright-report` ignorado;
- `test-results` ignorado;
- nenhum token real em docs;
- nenhum secret em README/docs;
- sem `DATABASE_URL` em app pages/components/actions;
- sem `SUPABASE_SERVICE_ROLE_KEY` no runtime.

## Publicacao na Vercel

Nao executar automaticamente sem confirmacao.

Passos recomendados:

1. Criar projeto na Vercel apontando para o repositorio.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Install command: `npm install`.
5. Output: default da Vercel.
6. Configurar env vars de producao.
7. Fazer primeiro deploy.
8. Testar com URL preview antes de apontar dominio real.

## Testar login

1. Abrir `/login` na URL de deploy.
2. Entrar com usuario inicial.
3. Confirmar que redireciona para `/today` ou para a home configurada.
4. Abrir `/settings` e confirmar email logado.
5. Sair e confirmar que rotas protegidas voltam para `/login`.

## Testar `/api/health`

Abrir:

```text
https://<deploy-url>/api/health
```

Resposta esperada:

```json
{ "ok": true, "service": "lucas-os" }
```

## Testar `/quick-capture`

1. Abrir `/quick-capture`.
2. Fazer login se necessario.
3. Salvar captura simples.
4. Abrir `/capture`.
5. Confirmar que a captura apareceu como pendente.
6. Abrir `/today`.
7. Confirmar que o contador de capturas pendentes atualizou.

## Testar `/api/capture` com token

1. Entrar em `/settings`.
2. Criar capture token com nome claro, por exemplo `Deploy test`.
3. Copiar o token completo no momento da criacao.
4. Enviar:

```powershell
curl -X POST https://<deploy-url>/api/capture -H "Authorization: Bearer <TOKEN_COMPLETO>" -H "Content-Type: application/json" -d "{\"text\":\"teste de captura externa\",\"source\":\"webhook\"}"
```

5. Confirmar resposta `{ "ok": true }`.
6. Abrir `/capture` e confirmar pending capture.
7. Revogar o token.
8. Repetir chamada e confirmar falha generica.

Nunca salvar o token real em docs, print, commit ou issue publica.

## Testar AI preview opcional

Se `OPENAI_API_KEY` estiver configurada:

1. Abrir `/capture`.
2. Digitar `revisar relatorio de controle amanha as 15h`.
3. Usar preview IA.
4. Confirmar que o preview aparece editavel.
5. Confirmar que a task nao e criada automaticamente.
6. Confirmar que a confirmacao humana continua obrigatoria.

Se `OPENAI_API_KEY` nao estiver configurada, confirmar que o erro e amigavel e que o fluxo manual continua funcionando.

## Riscos

- Env vars de Supabase apontarem para o projeto errado.
- Rodar seed no banco errado.
- Capture token de producao vazar depois da criacao.
- Dominios/Auth callback URLs do Supabase ficarem incompletos.
- AI preview gerar sugestao errada; mitigacao atual e confirmacao humana obrigatoria.
- Sem backup formal ainda documentado para Supabase.
- Sem monitoramento de erro em producao ainda.

## Rollback basico

1. Na Vercel, voltar para o deploy anterior estavel.
2. Se o problema for env var, corrigir env e redeploy.
3. Se o problema for migration, nao tentar desfazer manualmente sem backup.
4. Pausar criacao de novos dados se houver suspeita de inconsistencia.
5. Exportar/backup do Supabase antes de qualquer SQL corretivo.

## Checklist final antes de apontar dominio real

- [ ] Preview deploy testado.
- [ ] Login testado.
- [ ] `/api/health` testado.
- [ ] `/quick-capture` testado.
- [ ] `/api/capture` testado com token e token revogado.
- [ ] `/today`, `/tasks`, `/projects`, `/capture`, `/settings`, `/notifications`, `/review` abrem autenticados.
- [ ] AI preview testado ou conscientemente deixado desativado.
- [ ] Supabase Auth URL/callback revisado.
- [ ] Backup/rollback minimo decidido.
- [ ] Nenhum secret em Git.
- [ ] Dominio real apontado somente depois do checklist acima.
