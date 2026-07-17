# AI Weekly Review V1

## Objetivo

A seção de revisão assistida em `/review` transforma sinais resumidos da última semana em um briefing opcional. Ela nunca cria, edita ou conclui entidades.

## Dados usados

- títulos, datas e prioridades de tasks concluídas, vencidas e próximas;
- nomes e datas alvo de projetos ativos sem próxima ação;
- até dez captures pendentes, truncadas e sem links completos;
- contagens resumidas de feedback do Daily Planning;
- título e horário de uma agenda limitada, quando Calendar estiver disponível.

Não são enviados tokens, secrets, env vars, corpo de email, descrições integrais de eventos, endpoints push ou dados de autenticação.

## Confirmação humana

O resultado é somente texto consultivo e não possui ações automáticas. Nesta versão ele também não é persistido: recarregar a página remove a revisão.

## Como testar

1. Abra `/review` autenticado.
2. Clique em **Gerar revisão com IA**.
3. Confira resumo, vitórias, pendências, gargalos e recomendações.
4. Confirme que nenhuma task, capture, projeto, email ou evento foi alterado.
5. Sem `OPENAI_API_KEY`, confirme a mensagem amigável e o funcionamento normal da revisão manual.

## Limitações

- sem persistência ou histórico;
- sem ações acionáveis dentro do briefing;
- qualidade depende dos dados resumidos disponíveis;
- falhas de Calendar e feedback são degradadas para contexto vazio.
