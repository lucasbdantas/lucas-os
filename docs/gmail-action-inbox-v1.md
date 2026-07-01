# Gmail Action Inbox Read-only V1

## Objetivo

Gmail Action Inbox V1 adiciona leitura conservadora de emails recentes ao Lucas OS, com foco em triagem e captura.

Esta versao nao modifica Gmail e nao cria tarefas automaticamente.

## Escopo Google usado

```text
https://www.googleapis.com/auth/gmail.readonly
```

Escopos Google ja usados pela fundacao:

```text
openid
email
profile
https://www.googleapis.com/auth/calendar.readonly
```

Contas conectadas antes desta versao podem nao ter Gmail read-only. Nesses casos, `/settings/integrations` mostra uma orientacao para reconectar.

## Suporte a multiplas contas

O app le todas as contas Google ativas conectadas em `connected_accounts`, desde que a conta tenha:

- status `active`;
- Gmail read-only concedido;
- token de acesso valido ou refresh token disponivel.

Se uma conta falhar, a pagina `/inbox` continua carregando as demais e mostra aviso discreto.

## O que aparece em `/inbox`

A Inbox mostra emails recentes dos ultimos 14 dias, limitados por conta.

Para cada email:

- conta de origem;
- remetente;
- assunto;
- data;
- snippet retornado pelo Gmail;
- labels basicas;
- link para abrir no Gmail.

O app nao baixa anexos nesta versao.

## Enviar para Capture

Cada email tem a acao `Enviar para Capture`.

Isso cria uma `pending_capture` com `source=email`, contendo:

- conta de origem;
- remetente;
- assunto;
- data;
- link do Gmail;
- snippet.

O corpo completo do email nao e salvo por padrao.

Depois, o usuario pode triar em `/capture` e transformar em task manualmente, com confirmacao humana.

## Como habilitar Gmail API no Google Cloud

1. Abra Google Cloud Console.
2. Selecione o projeto OAuth usado pelo Lucas OS.
3. Va em APIs & Services.
4. Habilite Gmail API.
5. Confirme que a OAuth consent screen permite o escopo Gmail read-only.
6. Reconecte a conta Google em `/settings/integrations`.

## Como reconectar conta antiga

1. Abra `/settings/integrations`.
2. Clique em `Conectar Google`.
3. Escolha a mesma conta Google.
4. Conceda Gmail read-only.
5. Abra `/inbox`.

## Como testar localmente

1. Garanta que as env vars Google estejam configuradas:
   - `GOOGLE_CLIENT_ID`;
   - `GOOGLE_CLIENT_SECRET`;
   - `GOOGLE_OAUTH_REDIRECT_URI`;
   - `INTEGRATIONS_ENCRYPTION_KEY`.
2. Habilite Gmail API no Google Cloud.
3. Reinicie o app:
   - `npm run dev`
4. Abra `/settings/integrations`.
5. Reconecte Google.
6. Abra `/inbox`.
7. Clique em `Enviar para Capture`.
8. Abra `/capture` e confirme que a pending capture apareceu.

## Como testar na Vercel

1. Confirme as env vars no projeto Vercel.
2. Confirme o redirect URI da Vercel no Google Cloud:
   - `https://<sua-url>/api/integrations/google/callback`
3. Habilite Gmail API.
4. Redeploy.
5. Reconecte Google em `/settings/integrations`.
6. Abra `/inbox`.

## Limites de privacidade

O app nao salva corpo completo do email por padrao.

O app salva apenas uma pending capture quando o usuario clica explicitamente em `Enviar para Capture`.

Tokens continuam criptografados no banco e nunca sao expostos no client.

## O que o app NAO faz

- Nao envia email.
- Nao apaga email.
- Nao arquiva email.
- Nao marca como lido.
- Nao sincroniza todos os emails.
- Nao baixa anexos.
- Nao cria tasks automaticamente.
- Nao chama IA automaticamente.

## Proximos passos

- Filtros por conta.
- Filtros por sender/dominio.
- Classificacao por IA com confirmacao.
- Transformacao em task mais inteligente, sempre approval-first.
- Suporte a anexos com confirmacao explicita.
