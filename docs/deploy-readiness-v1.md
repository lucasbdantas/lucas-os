# Deploy Readiness V1

## Objetivo

Este documento prepara o Lucas OS para um deploy futuro. Ele nao executa deploy real e nao adiciona integracoes externas.

## Checklist antes do deploy

- Confirmar que `npm run lint` passa.
- Confirmar que `npm run build` passa.
- Confirmar que `npm run test` passa.
- Confirmar que `npx tsc --noEmit` passa.
- Confirmar que `.env.local` nao esta no Git.
- Confirmar que o projeto nao usa `SUPABASE_SERVICE_ROLE_KEY` no runtime.
- Confirmar que as migrations foram aplicadas no Supabase de destino.
- Confirmar que Supabase Auth permite login por email/senha para o usuario esperado.
- Confirmar que RLS esta ativa nas tabelas do app.
- Confirmar que `/api/capture` funciona apenas com capture token valido.
- Confirmar que tokens revogados nao funcionam.
- Confirmar que AI preview falha de forma amigavel quando `OPENAI_API_KEY` nao existe.

## Variaveis de ambiente

### Publicas

Estas variaveis sao expostas ao browser e devem conter apenas valores publicos do projeto Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server-only

Estas variaveis devem existir apenas no ambiente server-side:

- `OPENAI_API_KEY`: opcional. Sem ela, AI preview fica indisponivel de forma amigavel.
- `OPENAI_MODEL`: opcional. Default atual: `gpt-4.1-nano`.

### Somente scripts locais

Estas variaveis sao para seed/migrations/scripts locais. Nao devem ser usadas em paginas, componentes, actions ou route handlers do app:

- `DATABASE_URL`
- `SEED_USER_ID`

### Service role

`SUPABASE_SERVICE_ROLE_KEY` nao e necessaria para o app atual. O endpoint externo `/api/capture` usa token hash + Supabase anon client + funcao SQL `SECURITY DEFINER`, sem service role no runtime.

## Ordem de aplicacao das migrations

Aplicar no Supabase de destino, em ordem:

1. `20260629000001_initial_phase_1_schema.sql`
2. `20260629000002_projects_unique_index.sql`
3. `20260629000003_pending_captures.sql`
4. `20260629000004_capture_tokens.sql`
5. `20260629000005_recurring_tasks.sql`

Depois das migrations, criar o usuario em Supabase Auth e rodar o seed apenas se o ambiente for novo:

```powershell
npm run db:seed:phase1
```

## Validar build local

```powershell
npm run lint
npm run build
npm run test
npx tsc --noEmit
```

Tambem validar:

```text
GET /api/health
```

Resposta esperada:

```json
{ "ok": true, "service": "lucas-os" }
```

## Testar auth

1. Abrir `/login`.
2. Entrar com usuario existente no Supabase Auth.
3. Confirmar redirect para `/today` ou para a pagina inicial configurada em App Settings.
4. Abrir `/settings` e confirmar email do usuario logado.
5. Sair e confirmar que rotas protegidas redirecionam para `/login`.

## Testar `/api/capture`

1. Entrar em `/settings`.
2. Criar capture token em "Captura externa".
3. Copiar o token completo no momento da criacao.
4. Enviar request:

```powershell
curl -X POST http://localhost:3000/api/capture -H "Authorization: Bearer <TOKEN_COMPLETO>" -H "Content-Type: application/json" -d "{\"text\":\"comprar pilha amanha\",\"source\":\"android_shortcut\"}"
```

5. Confirmar `{ "ok": true }`.
6. Abrir `/capture` e confirmar a pending capture.
7. Revogar o token e confirmar que a mesma chamada deixa de funcionar.

Nunca registrar token real em docs, logs ou commits.

## Testar `/quick-capture`

1. Rodar em rede local quando for testar pelo celular:

```powershell
npm run dev -- --hostname 0.0.0.0
```

2. Abrir no celular:

```text
http://<IP_DO_PC>:3000/quick-capture
```

3. Fazer login se necessario.
4. Salvar uma captura.
5. Confirmar que aparece em `/capture` e no contador do `/today`.

## Testar OpenAI opcional

Com `OPENAI_API_KEY` configurada no ambiente server-side:

1. Abrir `/capture`.
2. Digitar algo como `revisar relatorio de controle amanha as 15h`.
3. Usar preview IA.
4. Confirmar que aparece preview editavel.
5. Confirmar que a task nao e criada automaticamente.
6. Confirmar que a confirmacao humana continua obrigatoria.

Sem `OPENAI_API_KEY`, o app deve mostrar erro amigavel e manter o fluxo manual.

## Riscos de seguranca

- `NEXT_PUBLIC_*` e publico por definicao; nao colocar segredos nesses campos.
- `.env.local` nunca deve entrar no Git.
- Capture token completo aparece uma unica vez e nao e salvo puro no banco.
- Prefixo e nome de token nao autenticam.
- `/api/capture` retorna erro generico para nao revelar detalhes de autenticacao.
- AI preview nunca cria task automaticamente.
- Lembretes internos nao sao push notifications.
- `DATABASE_URL` deve ficar fora do runtime do app.

## Rollback basico

1. Reverter para o ultimo commit estavel.
2. Reaplicar variaveis de ambiente conhecidas.
3. Rodar `npm run build`.
4. Se uma migration ja foi aplicada em producao, nao tentar apagar dados manualmente sem backup.
5. Para problemas de feature, preferir desabilitar uso pela UI ou reverter o deploy antes de mexer no banco.

## Estado atual

O projeto esta preparado para um deploy futuro, mas este documento nao substitui um checklist especifico da plataforma escolhida. Antes do deploy real, definir:

- plataforma de hospedagem;
- dominio;
- estrategia de backup do Supabase;
- estrategia de rollback de deploy;
- monitoramento basico de erros.
