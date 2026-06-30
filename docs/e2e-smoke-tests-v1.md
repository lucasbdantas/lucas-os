# E2E Smoke Tests V1

## Objetivo

Os testes E2E smoke verificam, em navegador real, se rotas essenciais do Lucas OS carregam antes de um deploy real. Eles nao substituem testes unitarios nem validam todos os fluxos de negocio.

## Como rodar

```powershell
npm run test:e2e
```

Por padrao, o Playwright inicia o Next localmente em:

```text
http://127.0.0.1:3000
```

Para usar uma URL ja em execucao:

```powershell
$env:E2E_BASE_URL="http://127.0.0.1:3000"
npm run test:e2e
```

## Variaveis de ambiente

Publicas do app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Credenciais opcionais para smoke autenticado:

- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

Use um usuario descartavel do Supabase Auth. Coloque valores reais apenas em `.env.local` e nunca commite credenciais reais.

Configuracao opcional:

- `E2E_BASE_URL`: usa uma URL existente e nao inicia webServer local.
- `E2E_PORT`: porta local para o webServer automatico, default `3000`.

## Testes publicos

Sempre rodam:

- `/login` carrega.
- `/api/health` retorna `{ "ok": true, "service": "lucas-os" }`.

## Testes autenticados

Rode com `E2E_TEST_EMAIL` e `E2E_TEST_PASSWORD` configurados. Sem essas variaveis, os testes autenticados ficam skipped de forma explicita.

O login e feito via UI em `/login`, preenchendo email e senha no formulario normal do app. Os testes nao imprimem email/senha em logs e o Playwright esta configurado com trace desativado para reduzir risco de artefatos contendo campos sensiveis.

Rotas cobertas:

- `/today`
- `/tasks`
- `/projects`
- `/capture`
- `/quick-capture`
- `/settings`
- `/notifications`
- `/review`

## Limites

- Sao smoke tests, nao cobertura completa.
- Nao criam, editam ou deletam dados.
- Nao chamam OpenAI.
- Nao usam service role.
- Nao usam `DATABASE_URL`.
- Dependem de Supabase Auth configurado para os testes autenticados.
- Se o usuario de teste nao tiver dados seedados, os smoke tests autenticados ainda devem passar porque validam carregamento das rotas, nao conteudo especifico.

## Como preparar usuario de teste

1. No Supabase Dashboard, crie um usuario Auth descartavel.
2. Confirme o email do usuario ou marque-o como confirmado no painel.
3. Coloque `E2E_TEST_EMAIL` e `E2E_TEST_PASSWORD` apenas em `.env.local`.
4. Rode `npm run test:e2e`.

## Quando usar

Rodar antes de deploy, depois de alterar layout/auth/navigation, e depois de mexer em rotas principais do app.
