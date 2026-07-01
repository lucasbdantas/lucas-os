# Google Calendar Read-only V1

## Status

Lucas OS v0.3.1 adiciona leitura de eventos do Google Calendar para contas Google conectadas.

Esta etapa e somente leitura:

- nao cria eventos;
- nao edita eventos;
- nao cria tasks automaticamente;
- nao chama IA;
- nao solicita Gmail.

## Escopo Google usado

Escopo novo:

```text
https://www.googleapis.com/auth/calendar.readonly
```

Escopos mantidos:

```text
openid
email
profile
```

Contas conectadas antes desta versao podem ter apenas `openid email profile`. Nesse caso, o Lucas OS mostra orientacao para reconectar e conceder Calendar read-only.

## Como funciona

1. `/api/integrations/google/start` passa a solicitar Calendar read-only.
2. `/api/integrations/google/callback` salva os scopes concedidos em `connected_accounts.scopes`.
3. `/today` busca contas Google ativas do usuario.
4. Para cada conta com Calendar read-only:
   - descriptografa o access token apenas no servidor;
   - renova o token se estiver expirando e houver refresh token;
   - lista calendarios legiveis;
   - lista eventos entre hoje e os proximos 7 dias;
   - normaliza os eventos para exibicao simples.
5. Se uma conta falhar, o Today continua carregando e mostra aviso discreto.

## Refresh token

Se `expires_at` estiver vencido ou prestes a vencer, o app usa o `refresh_token_encrypted` para renovar o access token.

Quando o refresh funciona:

- `access_token_encrypted` e atualizado;
- `expires_at` e atualizado;
- `refresh_token_encrypted` e preservado, salvo se Google retornar um novo;
- `last_sync_at` e atualizado depois de carregar eventos.

Tokens nunca sao expostos no client e nunca sao logados.

## UI

### `/settings/integrations`

Mostra:

- contas Google conectadas;
- status;
- scopes concedidos;
- badge `Calendar read-only` quando o escopo existe;
- orientacao para reconectar quando falta o escopo.

### `/today`

Mostra secao `Agenda` com:

- eventos de hoje;
- eventos dos proximos 7 dias;
- horario;
- titulo;
- conta de origem;
- calendario de origem;
- local, quando existir;
- link para abrir no Google, quando existir.

## Como reconectar conta antiga

1. Abra `/settings/integrations`.
2. Clique em `Conectar Google`.
3. Escolha a mesma conta Google.
4. Conceda o novo escopo de Calendar read-only.
5. Volte para `/today` e confira a secao `Agenda`.

## Testar localmente

1. Garanta que as env vars Google ja estejam configuradas:
   - `GOOGLE_CLIENT_ID`;
   - `GOOGLE_CLIENT_SECRET`;
   - `GOOGLE_OAUTH_REDIRECT_URI`;
   - `INTEGRATIONS_ENCRYPTION_KEY`.
2. No Google Cloud OAuth, confirme o redirect:
   - `http://localhost:3000/api/integrations/google/callback`.
3. Reinicie o app:
   - `npm run dev`
4. Abra `/settings/integrations`.
5. Conecte ou reconecte Google.
6. Abra `/today`.
7. Confira eventos de hoje/proximos 7 dias.

## Testar na Vercel

1. Configure as mesmas env vars na Vercel.
2. No Google Cloud OAuth, adicione o redirect da Vercel:
   - `https://<sua-url>/api/integrations/google/callback`.
3. Faça novo deploy.
4. Conecte/reconecte Google em `/settings/integrations`.
5. Abra `/today`.

## Limitacoes

- Nao ha cache persistente de eventos ainda; leitura ocorre no servidor ao abrir Today.
- Nao ha sync em background.
- Nao ha escrita no Calendar.
- Nao ha criacao automatica de tasks a partir de eventos.
- Eventos privados dependem do que a API retorna para a conta conectada.
- Se o refresh token estiver ausente ou revogado, e preciso reconectar.

## Riscos

- Mais escopos aumentam sensibilidade da integracao; por isso o escopo e somente leitura.
- Perder `INTEGRATIONS_ENCRYPTION_KEY` impede descriptografar tokens existentes.
- Falhas temporarias do Google podem ocultar agenda de uma conta; o Today deve continuar funcionando.

## Complemento implementado

Calendar Lanes V1 separa eventos em `Agenda principal`, `Contexto / Interesses`
e `Oculto`. Veja `docs/calendar-lanes-v1.md`.

## Proximos passos

1. Gmail Action Inbox V1.
2. Melhorar cache/sync de Calendar se a leitura sob demanda ficar lenta.
3. Mostrar conflito de agenda no Today.
4. Transformar evento em task manualmente, sempre com confirmacao humana.
