# AI Daily Planning V2

## Objetivo

O Daily Planning V2 salva o briefing sugerido pela IA para o dia atual e
permite consultar planos recentes e avaliar cada sugestao. A IA continua em
modo approval-first: ela nao cria, altera, conclui ou reagenda tasks, nem muda
Gmail, Calendar ou notificacoes.

## Schema e RLS

A migration `20260714000008_daily_plans.sql` cria:

- `daily_plans`: uma linha por usuario, data e timezone; `generation` aumenta
  quando o usuario regenera o briefing.
- `daily_plan_feedback`: uma avaliacao por usuario, plano, revisao, tipo de
  item e indice. Um novo clique troca a avaliacao anterior, sem criar uma
  duplicata.

As duas tabelas usam RLS. Todas as politicas de leitura, insercao, atualizacao
e exclusao exigem `auth.uid() = user_id`. Insercoes e atualizacoes de feedback
tambem confirmam que o plano referenciado pertence ao usuario autenticado.

## Dados persistidos

Cada plano salvo inclui resumo, prioridades, riscos, sugestoes de
reagendamento e triagem, proximos passos, fuso, data, modelo e um snapshot
limitado do contexto. O snapshot usa os mesmos limites e sanitizacao do
payload enviado para a IA, com referencias opacas em vez de IDs do banco.

Feedback guarda apenas tipo de item, indice, classificacao opcional e uma nota
opcional que a UI atual nao envia.

Nunca sao persistidos access tokens, refresh tokens, chaves de ambiente,
tokens de captura ou corpo completo de email. O snapshot usa no maximo o
snippet limitado de um email e nao o corpo da mensagem.

## Como o feedback influencia o proximo plano

Ao gerar um novo plano, o servidor busca no maximo 30 feedbacks recentes e
envia a IA apenas contagens agregadas por tipo e classificacao, por exemplo,
prioridades marcadas como uteis. Notas, textos de itens e historico completo
nao entram nesse resumo.

## Uso

1. Abra `/today` e use **Gerar plano do dia com IA**.
2. Revise as sugestoes; nenhuma acao e executada automaticamente.
3. Use os botoes de feedback em cada item. Outro clique troca a avaliacao.
4. Use **Regenerar plano** para substituir a versao salva do dia de forma
   controlada. A revisao aumenta e o Today mostra apenas a versao atual.
5. Abra **Historico** para consultar os ultimos 14 planos em modo leitura.

## Aplicar a migration

No Supabase SQL Editor, aplique integralmente
`supabase/migrations/20260714000008_daily_plans.sql` depois das migrations
anteriores. Ela nao altera dados existentes.

## Teste local e na Vercel

Com uma sessao autenticada e `OPENAI_API_KEY` configurada apenas no ambiente
do servidor:

1. Gere um plano no Today e recarregue a pagina: o selo **Plano salvo** deve
   continuar visivel.
2. Regere o plano e confirme que a revisao aumenta, sem duplicar itens no
   historico para a mesma data/fuso.
3. Marque uma prioridade como util e troque para ignorado; o estado deve ser
   atualizado sem executar nenhuma task.
4. Abra `/planning` e confirme que o plano anterior abre somente para leitura.
5. Remova `OPENAI_API_KEY` em um ambiente de teste: Today deve continuar
   normal e mostrar uma mensagem amigavel ao tentar gerar.

## Limitacoes e proximos passos

- Nao ha comparacao visual entre revisoes antigas da mesma data; apenas a
  revisao atual fica no historico compacto.
- Feedback ainda calibra apenas de modo agregado e nao interpreta notas.
- O plano nao cria um time-block, nao reage tarefas e nao produz automacoes.
- Uma proxima versao pode adicionar comparacao de revisoes, preferencias de
  planejamento e sugestoes mais explicaveis, sempre com confirmacao humana.
