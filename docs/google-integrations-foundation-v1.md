# Google Integrations Foundation V1

## Status

Lucas OS v0.3.0 inicia a fundacao de integracoes Google com OAuth seguro, multiplas contas por usuario e armazenamento criptografado de tokens.

Esta etapa ainda nao le Gmail nem Google Calendar em fluxo funcional. Ela conecta e registra a conta Google para etapas futuras.

## Arquitetura

- `connected_accounts` guarda uma linha por conta externa conectada.
- O provider inicial e `google`.
- Cada usuario pode conectar multiplas contas Google.
- A combinacao `user_id + provider + provider_account_id` impede duplicacao da mesma conta para o mesmo usuario.
- Tokens de acesso e refresh sao criptografados no servidor antes de salvar.
- O client nunca recebe tokens.
- As rotas OAuth usam sessao Supabase do usuario autenticado e RLS continua ativa.

## Migration

Arquivo:

`supabase/migrations/20260701000006_connected_accounts.sql`

Cria:

- enum `connected_account_provider`;
- enum `connected_account_status`;
- tabela `connected_accounts`;
- indices por usuario/provider/status;
- trigger de `updated_at`;
- RLS com politicas de select/insert/update/delete para `auth.uid() = user_id`.

## Env vars

Server-only:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
INTEGRATIONS_ENCRYPTION_KEY=
```

`INTEGRATIONS_ENCRYPTION_KEY` deve ser longa e secreta. Recomendado: 32 bytes em base64. Ela e usada para criptografar tokens e assinar o `state` do OAuth.

Nao colocar no client:

- `GOOGLE_CLIENT_SECRET`;
- `INTEGRATIONS_ENCRYPTION_KEY`;
- tokens Google;
- `DATABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`.

O app nao usa `SUPABASE_SERVICE_ROLE_KEY`.

## Escopos Google nesta etapa

Escopos iniciais:

- `openid`;
- `email`;
- `profile`.

Gmail e Calendar read-only devem ser adicionados em etapas futuras com novo consentimento explicito.

Escopos futuros provaveis:

- Calendar read-only: `https://www.googleapis.com/auth/calendar.readonly`;
- Gmail read-only ou metadata/action inbox: definido em etapa propria, com menor privilegio possivel.

## Rotas

- `GET /api/integrations/google/start`
  - exige sessao;
  - cria `state` assinado;
  - salva state em cookie HTTP-only;
  - redireciona para Google com `access_type=offline` e `prompt=consent`.

- `GET /api/integrations/google/callback`
  - exige sessao;
  - valida state da URL contra cookie;
  - troca `code` por tokens;
  - carrega identidade da conta;
  - criptografa tokens;
  - cria ou atualiza `connected_accounts`.

- `POST /api/integrations/google/disconnect`
  - exige sessao;
  - valida ownership via RLS e `user_id`;
  - limpa tokens criptografados;
  - marca conta como `revoked`.

## UI

Pagina:

`/settings/integrations`

Permite:

- conectar Google;
- listar contas conectadas;
- ver email, status, scopes e datas;
- desconectar conta.

Nao mostra:

- access token;
- refresh token;
- client secret;
- encryption key.

## Configurar Google Cloud OAuth

1. Abra Google Cloud Console.
2. Crie ou selecione um projeto.
3. Configure a OAuth consent screen.
4. Crie credencial OAuth Client ID do tipo Web application.
5. Adicione redirect URI local:
   - `http://localhost:3000/api/integrations/google/callback`
6. Para Vercel preview/producao, adicione tambem:
   - `https://<sua-url-vercel>/api/integrations/google/callback`
7. Copie `Client ID` para `GOOGLE_CLIENT_ID`.
8. Copie `Client Secret` para `GOOGLE_CLIENT_SECRET`.
9. Configure `GOOGLE_OAUTH_REDIRECT_URI` com a URL exata do ambiente.

## Testar localmente

1. Aplique a migration `20260701000006_connected_accounts.sql` no Supabase.
2. Configure as env vars em `.env.local`, sem commitar.
3. Reinicie o Next:
   - `npm run dev`
4. Abra `/settings/integrations`.
5. Clique em `Conectar Google`.
6. Conclua consentimento.
7. Confirme que a conta aparece na lista.
8. Clique em `Desconectar` e confirme que o status vira `revoked`.

## Testar na Vercel

1. Configure as mesmas env vars em Vercel Project Settings.
2. Garanta que `GOOGLE_OAUTH_REDIRECT_URI` usa a URL da Vercel.
3. Garanta que essa URL esta cadastrada no Google Cloud OAuth.
4. Rode novo deploy.
5. Teste `/settings/integrations`.

## Riscos e controles

- Token Google e sensivel: nunca e salvo em plaintext.
- State OAuth protege contra callback forjado.
- RLS limita contas ao usuario autenticado.
- Desconectar remove tokens criptografados do registro.
- Se `INTEGRATIONS_ENCRYPTION_KEY` for perdida, tokens existentes nao poderao ser descriptografados.
- Rotacao de chave exigira rotina propria futura.

## Proximos passos

1. Calendar read-only V1.
2. Gmail read-only ou action inbox V1.
3. Renovacao de access token usando refresh token.
4. Auditoria de sync por conta.
5. Preferencias por conta conectada.
