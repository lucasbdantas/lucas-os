# Automatic Reminder Scheduler V1

## Objetivo

O scheduler processa somente lembretes internos de tasks que ja venceram e
envia push para subscriptions ativas. Ele nao cria tasks, nao modifica Gmail ou
Calendar e nao chama IA.

## Rota e seguranca

Um scheduler autorizado pode chamar `GET /api/cron/process-reminders`. A rota
exige `Authorization: Bearer <CRON_SECRET>` e nunca registra o header, payload
de push, endpoint de subscription ou texto de task.

`POST` tambem e aceito para teste manual local.

Como a rota de cron nao possui uma sessao Supabase de usuario, a migration
`20260715000010_automatic_reminder_scheduler.sql` cria duas RPCs com
`SECURITY DEFINER`. Elas ignoram RLS apenas dentro de um limite estreito:

- o hash enviado pelo servidor deve corresponder ao hash guardado no Supabase
  Vault;
- a primeira RPC reivindica deliveries ainda nao processadas;
- a segunda registra `sent` ou `failed` e pode revogar subscriptions 404/410.

O app nao usa `SUPABASE_SERVICE_ROLE_KEY`. A chave unica de
`push_notification_deliveries(notification_id, subscription_id)` continua
impedindo reenvio do mesmo lembrete para o mesmo dispositivo.

## Configuracao

1. Aplique a migration `20260715000010_automatic_reminder_scheduler.sql` no
   Supabase, depois das migrations anteriores.
2. Gere um segredo longo localmente. No PowerShell:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$secret = [Convert]::ToBase64String($bytes)
$hashBytes = [System.Security.Cryptography.SHA256]::HashData(
  [System.Text.Encoding]::UTF8.GetBytes($secret)
)
$hash = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })
```

3. Guarde apenas `$secret` como `CRON_SECRET` nas variaveis de ambiente da
   Vercel. Nunca o coloque em Git, SQL, log ou client.
4. No SQL Editor do Supabase, use apenas o valor de `$hash` para criar o
   segredo do Vault:

```sql
select vault.create_secret(
  '<COLE_O_HASH_SHA256_AQUI>',
  'lucas_os_cron_secret_hash',
  'Hash do CRON_SECRET do Lucas OS'
);
```

Se for rotacionar o segredo, atualize a variavel na Vercel e recrie o segredo
com o mesmo nome no Vault. Mantenha os dois valores sincronizados.

## Vercel Hobby e scheduler externo

O plano Vercel Hobby nao aceita cron subdiario. Por isso, `vercel.json` nao
registra um cron de 30 minutos; a rota continua publicada e protegida para uso
manual ou por um scheduler externo.

Para manter a frequencia de 30 minutos, configure um servico como
`cron-job.org` (ou outro scheduler que aceite headers) para chamar:

```text
GET https://<SEU_DEPLOY>/api/cron/process-reminders
Authorization: Bearer <CRON_SECRET>
```

Use no scheduler exatamente o mesmo `CRON_SECRET` configurado na Vercel e cujo
hash esta no Supabase Vault. Nunca coloque o segredo na URL, query string,
documentacao ou Git. Se o provedor nao permitir guardar o header de forma
segura, escolha outro scheduler.

Alternativamente, o Hobby permite um cron diario. Para esse modo, adicione
manualmente um schedule diario compativel, por exemplo `0 9 * * *`, sabendo que
lembretes serao processados apenas uma vez por dia e poderao chegar atrasados.

## Teste local

Com `CRON_SECRET`, Web Push e o hash do Vault configurados para o banco usado
localmente, crie uma task com lembrete e aguarde o horario. Depois execute:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/cron/process-reminders" `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

O retorno seguro inclui `ok`, `processed`, `delivered`, `failed`, `skipped`,
`subscriptions` e contagens agregadas em `reasons`. Ele nao inclui textos de
task, endpoints ou chaves.

Teste tambem uma segunda chamada: deliveries ja reivindicadas aparecem como
`already_delivered` e nao sao reenviadas.

## Teste em producao

1. Crie um lembrete de teste em `/settings/notifications`.
2. Aguarde ate ele vencer.
3. Dispare uma chamada autenticada para a rota de cron ou aguarde a proxima
   execucao do scheduler externo/cron diario configurado.
4. Confira o push e o registro em `push_notification_deliveries`.
5. Abra `/settings/notifications`: o painel informa a presenca do scheduler no
   servidor e a ultima entrega registrada para o usuario.

## Troubleshooting

- `503 Scheduler ainda nao esta configurado`: configure `CRON_SECRET` no
  ambiente e crie o hash correspondente no Supabase Vault.
- `401 Nao autorizado`: o header nao contem o mesmo `CRON_SECRET` do servidor.
- `200` com `delivered: 0`: nao ha lembrete pendente para enviar, ou as
  deliveries ja foram registradas como `already_delivered`.
- `503 Web Push nao esta configurado`: revise as tres variaveis VAPID.
- `skipped.already_delivered`: comportamento esperado de idempotencia; nao ha
  reenvio para o mesmo reminder/dispositivo.
- `failed.web_push_gone` ou `failed.web_push_not_found`: a subscription e
  revogada e o dispositivo precisa reativar notificacoes.

## Limitacoes

- Quiet hours e bloqueio de fim de semana ja possuem preferencias e calculo testado, mas ainda nao sao aplicados pelo cron SQL. Isso exige uma migration atomica que adie o claim; filtrar depois do claim poderia perder o envio.

- A granularidade depende do scheduler escolhido. Com intervalo de 30 minutos,
  push nao e garantido no minuto exato do reminder; com cron diario, o atraso
  pode chegar a um dia.
- O scheduler processa no maximo 200 pares reminder/dispositivo por execucao.
- Nao ha janela silenciosa, retry automatico de entrega falha ou metricas de
  execucao dedicadas nesta versao.
