# Recurring Tasks V1

Recurring Tasks V1 adiciona recorrência simples para tarefas do Lucas OS sem depender de automações externas.

## Como Funciona

Em `/tasks`, o formulário de criação e edição tem uma seção `Recorrência`.

Opções disponíveis:

- `Não repetir`;
- `Todo dia`;
- `Toda semana`;
- `Todo mês`.

Também existe um campo de intervalo. Exemplos:

- diária com intervalo `1`: amanhã;
- semanal com intervalo `1`: daqui a 7 dias;
- semanal com intervalo `2`: daqui a 14 dias;
- mensal com intervalo `1`: próximo mês.

Quando uma task recorrente é marcada como `done`, o servidor cria a próxima ocorrência automaticamente.

A próxima ocorrência copia:

- título;
- notas;
- domínio;
- projeto;
- horário;
- prioridade;
- energia;
- contexto;
- dados de recorrência.

A próxima data é calculada a partir de `due_date` da task concluída, não da data em que ela foi concluída.

## Decisões De Schema

V1 usa colunas explícitas na tabela `tasks`:

- `recurrence_type`: `none | daily | weekly | monthly`;
- `recurrence_interval`: inteiro, default `1`;
- `recurrence_anchor_date`: data base opcional;
- `recurrence_end_date`: fim opcional da recorrência;
- `recurrence_parent_id`: referência para a origem da série.

O schema já tinha `recurrence_rule`, mas ele foi mantido livre para uma futura versão com regras mais complexas.

Também existe um índice único parcial para reduzir duplicação:

- `tasks_user_recurrence_parent_due_open_unique`;
- protege contra duas próximas ocorrências abertas com o mesmo `user_id`, `recurrence_parent_id` e `due_date`.

## Segurança E Validação

- A task precisa pertencer ao usuário autenticado.
- A próxima ocorrência usa o mesmo `user_id` da task original.
- Domínio e projeto são copiados da task original.
- O app não usa `DATABASE_URL` nas páginas/actions do app.
- RLS continua protegendo acesso por usuário.

## Limitações

- Não há regras como “segunda e quarta”.
- Não há horários múltiplos.
- Não há tela separada para séries recorrentes.
- Não há edição em massa da série.
- Não há notificações push.
- Se a task recorrente não tiver `due_date`, nenhuma próxima ocorrência é criada automaticamente.
- Se `recurrence_end_date` for ultrapassada, a próxima ocorrência não é criada.

## Como Testar

1. Aplique a migration `20260629000005_recurring_tasks.sql`.
2. Abra `/tasks`.
3. Crie uma task com data, por exemplo hoje, e recorrência semanal.
4. Clique em `Concluir`.
5. Confira que a task original foi concluída.
6. Confira que uma nova task aberta apareceu com a data somada em 7 dias.
7. Clique em `Concluir` novamente na próxima ocorrência.
8. Confira que a próxima data continua sendo calculada a partir do prazo anterior.
9. Crie uma task recorrente sem data.
10. Conclua e confirme que o app mostra mensagem amigável e não cria próxima ocorrência.

## Próximos Passos Possíveis

- Regras semanais com dias específicos.
- Edição da série inteira.
- Visualização dedicada de recorrências.
- Padrões por domínio/projeto.
- Integração futura com notificações quando houver uma estratégia de notificações mais madura.
