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

## Como testar localmente

1. Aplique a migration `20260701000007_push_notifications.sql`.
2. Configure `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` e `WEB_PUSH_SUBJECT`.
3. Rode o app.
4. Abra `/settings/notifications`.
5. Clique em `Ativar notificacoes`.
6. Crie uma task com `due_date`, `due_time` e lembrete.
7. Quando o lembrete estiver vencido, clique em `Verificar lembretes vencidos agora`.
8. Confirme que o navegador recebe a notificacao.
9. Clique na notificacao e confirme que abre a task ou `/notifications`.

## Como testar na Vercel

1. Aplique a migration no Supabase de producao.
2. Configure env vars na Vercel:
   - `WEB_PUSH_PUBLIC_KEY`;
   - `WEB_PUSH_PRIVATE_KEY`;
   - `WEB_PUSH_SUBJECT`.
3. Redeploy.
4. Abra `/settings/notifications` no navegador/dispositivo desejado.
5. Ative notificacoes.
6. Crie um lembrete vencido.
7. Use `Verificar lembretes vencidos agora` para validar envio real.

## Scheduler/Cron

A V1 nao promete envio automatico em segundo plano sem scheduler.

O endpoint `/api/push/process` exige usuario autenticado e processa apenas os lembretes desse usuario, respeitando RLS. Isso evita service role e evita expor uma rota publica que varre dados de todos os usuarios.

Para envio automatico real no futuro, existem duas opcoes seguras:

1. criar um job/cron com um mecanismo server-side confiavel e segredo `CRON_SECRET`;
2. criar uma funcao SQL/RPC de claim cuidadosamente protegida, sem expor subscriptions para anon.

Essa etapa ficou documentada para Push Notifications V2.

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

## Proximos passos

- Push scheduler/cron V2;
- quiet hours;
- teste E2E autenticado de subscription quando viavel;
- preferencias por tipo de notificacao;
- push para eventos de calendario, com consentimento explicito.
