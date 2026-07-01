# Calendar Lanes V1

## Objetivo

Calendar Lanes V1 reduz ruido no `/today` separando eventos do Google Calendar em grupos visuais.

Calendarios como Formula 1, feriados, aniversarios e interesses pessoais continuam disponiveis, mas deixam de competir visualmente com aulas, reunioes, estagio e prazos.

## Lanes

### Agenda principal

Use para compromissos que competem diretamente pelo dia:

- aulas;
- reunioes;
- prazos;
- estagio;
- eventos pessoais importantes.

### Contexto / Interesses

Use para calendarios uteis, mas menos acionaveis:

- Formula 1;
- feriados;
- aniversarios;
- eventos publicos;
- interesses pessoais.

### Oculto

Use para calendarios que nao devem aparecer no Today.

O calendario nao e apagado e nada e alterado no Google. A preferencia so controla exibicao no Lucas OS.

## Persistencia

Nao houve migration.

As preferencias sao salvas em `app_settings` com a chave:

```text
google_calendar_lanes
```

Cada preferencia usa a combinacao:

```text
connectedAccountId::calendarId
```

Isso permite que duas contas Google diferentes tenham calendarios com o mesmo ID sem conflito.

## Padrao e heuristica

Calendarios novos entram como `primary` por padrao.

Existe uma heuristica conservadora para sugerir `context` quando o nome do calendario contem termos como:

- `Formula 1`;
- `F1`;
- `feriado`;
- `holiday`;
- `birthday`;
- `aniversario`.

Nada entra como `hidden` automaticamente.

## Como configurar

1. Abra `/settings/integrations`.
2. Na secao `Calendarios no Today`, escolha a lane de cada calendario:
   - Agenda principal;
   - Contexto / Interesses;
   - Oculto.
3. Clique em `Salvar calendarios`.
4. Abra `/today`.

## Como aparece no Today

O `/today` mostra:

- `Agenda principal`;
- `Contexto / Interesses`.

Eventos de calendarios `hidden` nao aparecem.

Dentro de cada lane, os eventos continuam ordenados por data/horario e mostram:

- horario;
- titulo;
- conta de origem;
- calendario de origem;
- local, quando existir;
- link `Abrir no Google`, quando existir.

## Limitacoes

- Nao existe busca/filtro por calendario ainda.
- Nao existe sync em background.
- Nao existe edicao de Calendar pelo Lucas OS.
- Nao existe criacao automatica de tasks a partir de eventos.
- A lista de calendarios depende da API Google no carregamento de `/settings/integrations`.

## Como testar

1. Conecte ou reconecte uma conta Google com Calendar read-only.
2. Abra `/settings/integrations`.
3. Marque um calendario como `Contexto / Interesses`.
4. Marque outro como `Oculto`.
5. Abra `/today`.
6. Confirme que:
   - eventos `primary` aparecem em `Agenda principal`;
   - eventos `context` aparecem em `Contexto / Interesses`;
   - eventos `hidden` nao aparecem.

## Proximos passos

- Melhorar heuristicas de contexto.
- Criar filtro rapido no Today.
- Permitir transformar evento em task manualmente.
- Avancar para Gmail Action Inbox V1.
