# Lucas OS v0.7.0 — AI Daily Planning V1

## Objetivo

O Today pode gerar um briefing pessoal curto para ajudar a decidir o que merece atenção. O plano é um preview descartável e approval-first: a IA não cria, edita, move ou conclui nada.

## Dados usados

No clique em “Gerar plano do dia com IA”, o servidor reconsulta um resumo limitado de:

- tarefas vencidas, de hoje e dos próximos sete dias;
- eventos visíveis do Calendar para hoje e os próximos sete dias;
- até dez pending captures;
- até dez emails recentes já disponíveis na Action Inbox;
- projetos ativos ou waiting sem task aberta associada.

Os itens recebem referências temporárias. O modelo pode sugerir essas referências, mas o servidor valida cada uma antes de gerar links para o app.

## Dados nunca enviados

O contexto não inclui secrets, chaves, env vars, tokens Google, access tokens, refresh tokens, corpo completo de emails, anexos ou IDs reais usados para autorização. Emails usam somente assunto, remetente, conta, snippet curto e outros metadados já permitidos pela Inbox.

Textos são sanitizados e limitados antes do prompt. O prompt não é logado pelo app.

## Confirmação humana

O plano só aparece na tela. Links abrem a origem para revisão: task, Capture ou Inbox. Nenhum botão do plano executa reagendamento, cria task ou modifica Gmail/Calendar. A ação de criar ou editar continua nos fluxos manuais existentes.

## Estados e fallback

- “Gerando plano...” enquanto a chamada está em andamento;
- “Plano pronto” quando a resposta passa pelo schema;
- mensagem amigável quando OpenAI não está configurada, a resposta é inválida ou a chamada falha.

Sem `OPENAI_API_KEY`, o Today continua funcionando normalmente.

## Como testar localmente

1. Configure `OPENAI_API_KEY` apenas no `.env.local` e, opcionalmente, `OPENAI_MODEL`.
2. Reinicie o servidor.
3. Abra `/today` e clique em “Gerar plano do dia com IA”.
4. Confirme as seções de resumo, prioridades, atritos, reagendamento, triagem e próximos passos.
5. Abra uma origem sugerida e confirme que a ação continua manual.
6. Remova a chave ou use ambiente sem OpenAI e confirme o fallback amigável.

## Como testar na Vercel

Configure `OPENAI_API_KEY` e `OPENAI_MODEL` no ambiente de preview, publique um novo deploy e repita o fluxo. O modelo default atual é `gpt-4.1-nano`. Não copie a chave para logs, documentação ou Git.

## Limitações

- O plano não persiste no banco e é regenerado quando solicitado.
- Não há score automático, otimização de agenda ou reagendamento real.
- A qualidade depende dos dados já presentes no Lucas OS e das integrações conectadas.
- Falhas individuais do Calendar/Gmail são tratadas como contexto ausente para não quebrar o Today.
- A IA pode sugerir uma referência sem ação clara; o servidor descarta referências desconhecidas.

## Próximos passos possíveis

- planejamento diário mais rico, ainda confirmável;
- revisão semanal assistida;
- regras explícitas por remetente/domínio;
- sugestões relacionadas a eventos do Calendar.
