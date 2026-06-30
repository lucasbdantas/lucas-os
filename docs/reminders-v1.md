# Reminders V1

## Objetivo

Reminders V1 ativa lembretes internos para tasks sem push notification, sem service worker e sem integracao externa. A versao usa o schema existente:

- `tasks.reminder_offsets` para guardar offsets em minutos.
- `notifications` para materializar lembretes internos exibidos no app.
- `tasks.due_date` e `tasks.due_time` para calcular o horario do lembrete.

Nenhuma migration nova foi criada para esta versao.

## Como funciona

No formulario de criacao/edicao de tasks, a secao **Lembretes** permite selecionar:

- Na hora: `0`
- 15 minutos antes: `15`
- 1 hora antes: `60`
- 1 dia antes: `1440`

Esses valores sao salvos em `tasks.reminder_offsets` como array de minutos.

Quando uma task aberta tem `due_date`, `due_time` e offsets de lembrete, o servidor cria registros em `notifications` com:

- `type = "task_reminder"`
- `status = "unread"`
- `source_ref = task.id`
- `source_url = /tasks?edit=<taskId>#edit-task`
- `undo_payload` com `task_id`, `due_at`, `reminder_at`, `offset_minutes` e `timezone`

Se a task for editada, lembretes pendentes antigos daquela task sao dispensados e novos lembretes sao criados conforme os dados atuais. Se a task for concluida ou cancelada, lembretes pendentes deixam de ficar acionaveis.

## Timezone

O calculo usa a timezone configurada em App Settings, com fallback para `America/Sao_Paulo`. O app ainda nao permite timezone arbitraria fora dos valores validados nas preferencias.

## Due date e due time

Lembretes internos dependem de data e horario. Se uma task tiver lembrete selecionado, mas nao tiver `due_date` e `due_time`, o app salva a task e mostra um aviso amigavel dizendo que nenhum lembrete foi gerado.

## Tela de notificacoes

A rota protegida `/notifications` mostra:

- lembretes vencidos;
- lembretes pendentes;
- lembretes recentes lidos ou dispensados.

Cada lembrete pode abrir a task relacionada. Lembretes nao sao deletados pela UI; eles podem ser marcados como lidos ou dispensados.

## Integracao com Today

O `/today` mostra uma secao curta de lembretes internos vencidos ou previstos para hoje. Isso nao e um calendario e nao substitui push notification.

## Recurring tasks

Quando uma task recorrente gera a proxima ocorrencia, a nova task copia `reminder_offsets`. Se a proxima ocorrencia tiver `due_date` e `due_time`, os lembretes internos tambem sao gerados para ela.

## Limitacoes

- Nao ha push notification.
- Nao ha service worker.
- Nao ha email, SMS, WhatsApp ou integracao externa.
- Lembretes dependem de o usuario abrir o app para ver `/notifications` ou `/today`.
- A UI nao agenda regras complexas como "segunda e quarta".
- A versao nao possui job em background para mudar status automaticamente; lembretes vencidos sao classificados na leitura.

## Como testar

1. Abrir `/tasks`.
2. Criar uma task com data, horario e lembrete de 15 minutos antes.
3. Abrir `/notifications` e confirmar que o lembrete aparece.
4. Editar o horario da task e confirmar que o lembrete exibido atualiza.
5. Concluir ou cancelar a task e confirmar que o lembrete pendente nao fica mais como acionavel.
6. Criar uma task recorrente com data, horario e lembrete.
7. Concluir a task recorrente e confirmar que a proxima ocorrencia mantem o lembrete.
8. Abrir `/today` e confirmar a secao de lembretes.

## Decisao de seguranca

Toda leitura e escrita acontece com Supabase Auth e RLS. O app nao usa `DATABASE_URL` em paginas, componentes, actions ou route handlers, e nao usa service role key.
