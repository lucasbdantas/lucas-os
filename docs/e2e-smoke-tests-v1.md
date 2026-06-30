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

Use um usuario descartavel do Supabase Auth. Nunca commite credenciais reais.

Configuracao opcional:

- `E2E_BASE_URL`: usa uma URL existente e nao inicia webServer local.
- `E2E_PORT`: porta local para o webServer automatico, default `3000`.

## Testes publicos

Sempre rodam:

- `/login` carrega.
- `/api/health` retorna `{ "ok": true, "service": "lucas-os" }`.

## Testes autenticados

Rode com `E2E_TEST_EMAIL` e `E2E_TEST_PASSWORD` configurados. Sem essas variaveis, os testes autenticados ficam skipped de forma explicita.

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

## Quando usar

Rodar antes de deploy, depois de alterar layout/auth/navigation, e depois de mexer em rotas principais do app.
