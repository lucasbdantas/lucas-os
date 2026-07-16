# Rules / Automation Draft V1

## Decisão

A v1.0 inclui somente uma base pura e testada para **sugestões**. Nenhuma regra executa ações, modifica Gmail, cria tasks ou agenda lembretes.

Tipos modelados:

- remetente contém texto: sugerir revisão como task;
- assunto contém texto: destacar para triagem;
- capture parece conter data: sugerir revisão de lembrete.

O formato pode ser persistido futuramente em `app_settings` com a chave `automation_draft_rules_v1`, mas esta sprint não adiciona UI nem grava configuração. Isso mantém o risco baixo enquanto o comportamento e a linguagem são validados.

## Segurança

- máximo de 30 regras validadas por Zod;
- correspondência local e determinística;
- nenhuma chamada a IA;
- nenhuma ação destrutiva;
- entradas inválidas resultam em lista vazia.

## Próximo passo

Adicionar uma UI de criação/revisão e mostrar labels de sugestão na Inbox/Capture, mantendo confirmação humana antes de qualquer transformação.
