# Email to Task Confirmation V1

## Objetivo

Email to Task Confirmation V1 permite transformar um email recente da `/inbox` em task, sempre com revisao humana antes de salvar.

O fluxo continua sendo approval-first: o Lucas OS sugere um rascunho a partir do metadata/snippet do Gmail, mas a task so nasce quando o usuario confirma.

## Fluxo email -> revisao -> task

1. Abra `/inbox`.
2. Encontre um email recente.
3. Clique em `Criar task`.
4. Revise o formulario.
5. Ajuste titulo, notas, dominio, projeto, data, horario e lembretes.
6. Clique em `Criar task`.
7. A task e criada com `source = email`.

Depois de salvar, a pagina mostra feedback `Task criada` e um link para `/tasks`.

## Campos preenchidos automaticamente

- titulo: assunto do email;
- notas: conta de origem, remetente, assunto, data, link do Gmail e snippet;
- source: `email`;
- data: vazia por padrao;
- horario: vazio por padrao;
- dominio: vazio por padrao, caindo em Inbox se o usuario nao escolher;
- projeto: vazio por padrao;
- lembretes: vazio por padrao.

## O que o app NAO faz

- Nao envia email;
- nao apaga email;
- nao arquiva email;
- nao marca email como lido;
- nao cria task automaticamente;
- nao chama IA automaticamente;
- nao salva corpo completo de email no banco;
- nao baixa anexos.

## Limitacoes

- O rascunho usa apenas metadata e snippet retornados pelo Gmail.
- Nao ha deteccao automatica de data, dominio ou projeto nesta versao.
- Se o email sair do filtro atual, o formulario pode deixar de encontrar a mensagem selecionada.
- Nao ha triagem em lote ainda.

## Como testar

1. Abra `/inbox` com Gmail read-only funcionando.
2. Aplique ou limpe filtros ate aparecer um email.
3. Clique em `Criar task`.
4. Confirme que o formulario abre com titulo baseado no assunto e notas com remetente, conta, snippet e link.
5. Edite algum campo.
6. Salve.
7. Confirme que aparece feedback `Task criada`.
8. Abra `/tasks` e confirme que a task aparece.
9. Confirme que o email no Gmail nao foi modificado.

## Proximos passos

- IA sugerindo titulo, data e projeto com confirmacao;
- regras por remetente/dominio;
- batch triage;
- filtros salvos por usuario, se o uso real justificar.
