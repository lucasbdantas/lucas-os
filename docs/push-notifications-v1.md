# Push Notifications V1

## Objetivo

Push Notifications V1 adiciona infraestrutura real de Web Push/PWA para lembretes de tasks no Lucas OS, sempre com consentimento explicito por dispositivo.

Esta versao nao pede permissao no primeiro carregamento do app. O usuario precisa abrir `/settings/notifications` e clicar em `Ativar notificacoes`.

## Arquitetura

Componentes principais:

- `public/sw.js`: service worker minimo para receber push e abrir a URL do lembrete;
- `/settings/notifications`: UI de consentimento e status por dispositivo;
- `/api/push/public-key`: expõe apenas a public key VAPID;
- `/api/push/subscribe`: salva subscription do navegador autenticado;
- `/api/push/revoke`: revoga a subscription do navegador autenticado;
- `/api/push/process`: processa lembretes vencidos do usuario autenticado e envia push real;
- `push_subscriptions`: subscriptions ativas/revogadas por usuario;
- `push_notification_deliveries`: registro de envio por notification/subscription para evitar duplicidade.

## Env vars necessarias

```text
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_SUBJECT=mailto:you@example.com
```

`WEB_PUSH_PUBLIC_KEY` pode ser exposta ao browser, mas continua vindo por rota server-side. `WEB_PUSH_PRIVATE_KEY` nunca deve aparecer no client ou no Git.

`CRON_SECRET` fica reservado para um scheduler futuro. A V1 nao usa cron automatico.

## Como gerar VAPID keys

Depois de instalar dependencias, gere as chaves localmente com:

```bash
npx web-push generate-vapid-keys
```

Copie os valores para o ambiente local/Vercel:

- public key -> `WEB_PUSH_PUBLIC_KEY`;
- private key -> `WEB_PUSH_PRIVATE_KEY`;
- subject -> `WEB_PUSH_SUBJECT`, por exemplo `mailto:lucas@example.com`.

Nao commitar esses valores.

## Como ativar e testar pelo app

1. Aplique a migration `20260701000007_push_notifications.sql`.
2. Configure `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` e `WEB_PUSH_SUBJECT`.
3. Rode o app.
4. Abra `/settings/notifications`.
5. Clique em `Ativar notificações neste dispositivo`.
6. Confira no painel se permissão, service worker e inscrição estão ativos.
7. Use `Enviar push de teste para este dispositivo` para validar a inscrição sem criar task.
8. Use `Criar lembrete de teste` e confirme explicitamente. O app cria uma task na Inbox para dois minutos no futuro, com lembrete na hora.
9. Depois do horário indicado, clique em `Processar lembretes agora`.
10. Leia os contadores e mensagens humanas no bloco `Último processamento`.
11. Clique na notificação recebida e confirme que ela abre a task ou `/notifications`.

Se a inscrição foi criada com VAPID antiga, expirou ou ficou inconsistente, use
`Resetar inscrição deste dispositivo`. O app revoga a inscrição local anterior,
remove-a do navegador e registra uma nova com a chave pública atual.

## Diagnostico de `/api/push/test`

`/api/push/test` deve sempre responder JSON. Mesmo quando falha, o contrato e:

```json
{
  "debug": {
    "messagePreview": "Provider error preview",
    "statusCode": 403
  },
  "ok": false,
  "error": "Nao foi possivel enviar push de teste.",
  "reason": "missing_subscription"
}
```

`reason` nunca inclui endpoint completo, VAPID keys, token, texto sensivel ou
payload privado. Motivos esperados:

- `missing_configuration`: env vars Web Push/VAPID ausentes ou invalidas no ambiente;
- `missing_subscription`: este navegador nao possui subscription ativa salva para o usuario;
- `subscription_revoked`: a subscription existe, mas foi revogada localmente;
- `vapid_configuration_error`: a public/private key VAPID parece invalida, incompatível ou rejeitada pela biblioteca/provedor;
- `vapid_subject_error`: `WEB_PUSH_SUBJECT` parece invalido. Use formato `mailto:email@example.com`;
- `web_push_unauthorized`: o provedor recusou a assinatura, geralmente por VAPID diferente;
- `web_push_gone` ou `web_push_not_found`: a subscription expirou ou nao existe mais no navegador/provedor;
- `web_push_bad_subscription`: o navegador enviou uma subscription invalida;
- `web_push_payload_error`: o payload foi rejeitado pelo provedor;
- `web_push_unknown`: erro nao classificado.

Quando existir, `debug` pode conter apenas campos sanitizados:

- `name`;
- `statusCode`;
- `code`;
- `messagePreview`;
- `bodyPreview`.

Esses previews removem URLs completas, tokens bearer e strings longas. Eles
servem para diagnostico operacional e nao devem conter endpoint completo,
chaves VAPID ou payload sensivel.

Na Vercel, se `/api/push/public-key` retorna `enabled: true` mas `/api/push/test`
falha, confira primeiro `reason` e depois `debug`. Para
`web_push_unauthorized` ou `vapid_configuration_error`, reative ou resete a
inscricao no dispositivo depois de confirmar as VAPID keys no ambiente. Para
`vapid_subject_error`, ajuste `WEB_PUSH_SUBJECT`. Para `missing_subscription` ou
`subscription_revoked`, use `Ativar notificacoes neste dispositivo` ou `Resetar
inscricao deste dispositivo`.

## Como testar na Vercel

1. Aplique a migration no Supabase de producao.
2. Configure env vars na Vercel:
   - `WEB_PUSH_PUBLIC_KEY`;
   - `WEB_PUSH_PRIVATE_KEY`;
   - `WEB_PUSH_SUBJECT`.
3. Redeploy.
4. Abra `/settings/notifications` no navegador/dispositivo desejado.
5. Ative notificacoes.
6. Envie primeiro um push de teste direto.
7. Crie o lembrete de teste pelo painel e aguarde o horário exibido.
8. Use `Processar lembretes agora` para validar o envio real.

## Scheduler/Cron

A V1 nao promete envio automatico em segundo plano sem scheduler.

O endpoint `/api/push/process` exige usuario autenticado e processa apenas os lembretes desse usuario, respeitando RLS. Isso evita service role e evita expor uma rota publica que varre dados de todos os usuarios.

Para envio automatico real no futuro, existem duas opcoes seguras:

1. criar um job/cron com um mecanismo server-side confiavel e segredo `CRON_SECRET`;
2. criar uma funcao SQL/RPC de claim cuidadosamente protegida, sem expor subscriptions para anon.

Essa etapa ficou documentada para Push Notifications V2.

## Diagnostico de `/api/push/process`

O endpoint retorna um JSON com contadores seguros:

- `delivered`: pushes enviados com sucesso nesta execucao;
- `failed`: tentativas que falharam no provedor de push;
- `skipped`: total de itens pulados por motivos conhecidos;
- `pendingReminders`: lembretes vencidos e elegiveis depois das validacoes;
- `subscriptions`: subscriptions ativas consideradas;
- `skippedReasons`: contagem por motivo;
- `skippedExamples`: ate 5 exemplos seguros com apenas sufixos curtos de IDs internos.
- `failedReasons`: contagem por tipo de falha retornada pelo provedor Web Push;
- `failedExamples`: ate 5 exemplos seguros com apenas sufixos curtos de IDs internos.

Motivos possiveis em `skippedReasons`:

- `already_delivered`: ja existe registro em `push_notification_deliveries` para aquele par lembrete/dispositivo. Isso indica idempotencia funcionando e e a causa mais provavel quando `delivered: 0`, `failed: 0`, `pendingReminders > 0`, `subscriptions > 0` e `skipped > 0`;
- `subscription_revoked`: havia subscription registrada, mas nenhuma ativa para envio;
- `missing_subscription`: nao ha subscription ativa nem revogada para o usuario;
- `notification_not_due`: o lembrete existe, mas `reminder_at` ainda nao venceu;
- `missing_task`: o lembrete aponta para uma task que nao existe mais para o usuario;
- `invalid_payload`: `undo_payload` nao tem o formato esperado de reminder;
- `unknown`: fallback para caso nao classificado.

O diagnostico nao retorna titulo de task, corpo da notificacao, endpoint de push,
chaves de subscription ou secrets.

O painel traduz os principais motivos para linguagem humana:

- `already_delivered`: este lembrete já foi processado para aquele dispositivo e não será reenviado;
- `web_push_unauthorized`: a inscrição pode ter sido criada com outra chave VAPID; resete ou reative o dispositivo;
- `web_push_gone` e `web_push_not_found`: a inscrição antiga expirou e precisa ser reativada;
- `notification_not_due`: o horário do lembrete ainda não chegou;
- `missing_subscription` ou `subscription_revoked`: não há dispositivo ativo para o envio.

`pendingReminders` conta lembretes vencidos e elegíveis. `subscriptions` conta
dispositivos ativos considerados. `delivered`, `failed` e `skipped` descrevem o
resultado desta execução; itens `skipped` não são necessariamente erros, pois
`already_delivered` confirma que a idempotência impediu reenvio.

Motivos possiveis em `failedReasons`:

- `web_push_unauthorized`: geralmente VAPID keys incorretas, subject invalido ou configuracao Web Push rejeitada pelo provedor;
- `web_push_gone`: subscription expirada/removida pelo navegador ou provedor. O Lucas OS revoga a subscription localmente;
- `web_push_not_found`: endpoint nao encontrado. O Lucas OS revoga a subscription localmente;
- `web_push_bad_subscription`: subscription malformada ou rejeitada;
- `web_push_payload_error`: payload grande/invalido para envio;
- `web_push_unknown`: falha nao classificada.

Quando `failed > 0`, olhe primeiro `failedReasons`. Se aparecer
`web_push_unauthorized`, revise `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` e
`WEB_PUSH_SUBJECT` no ambiente. Se aparecer `web_push_gone` ou
`web_push_not_found`, desative e ative novamente as notificacoes no dispositivo.

## Seguranca

- O app nao usa `SUPABASE_SERVICE_ROLE_KEY`;
- nao envia push sem opt-in;
- nao pede permissao automaticamente;
- cada reminder/subscription so gera uma entrega registrada;
- reminders lidos ou dispensados nao sao enviados;
- payload de push e sanitizado e curto;
- subscriptions revogadas deixam de receber push;
- erros 404/410 do provedor de push revogam a subscription local.

## Limitacoes

- iOS, Android e desktop têm suporte diferente a PWA push;
- navegadores podem bloquear permissao;
- push depende de HTTPS em producao;
- local HTTP funciona apenas em `localhost` e casos permitidos pelo navegador;
- sem cron automatico nesta versao;
- sem push para emails, Calendar ou IA;
- sem preferencias avancadas por horario silencioso.

O painel permite processamento manual e teste real sem DevTools. Scheduler/cron
automático continua fora da V1 e fica reservado para Push Notifications V2.

## Proximos passos

- Push scheduler/cron V2;
- quiet hours;
- teste E2E autenticado de subscription quando viavel;
- preferencias por tipo de notificacao;
- push para eventos de calendario, com consentimento explicito.
