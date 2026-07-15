# Lucas OS v0.6.0 — AI Suggestions V1

## Objetivo

Adicionar sugestões discretas para transformar captures e emails em drafts de task. A IA nunca salva uma task sozinha: o usuário revisa, edita e confirma.

## Fluxos disponíveis

- Em `/capture`, uma pending capture pode receber “Sugerir task com IA”.
- Em `/inbox`, um email pode receber “Sugerir task com IA”.
- O resultado é um preview editável. O formulário final usa a criação normal de tasks e exige confirmação explícita.

## Dados enviados à IA

Para captures, o texto bruto é limpo de caracteres de controle e limitado antes de ser enviado. A IA recebe também a data atual, o timezone `America/Sao_Paulo` e uma lista limitada de nomes de domínios e projetos ativos.

Para emails, são enviados somente metadados seguros: assunto, remetente, conta de origem, data, snippet curto, labels básicas, indicação de anexo e link do Gmail. O prompt identifica essa origem e pede que a IA trate o email como ação somente quando houver sinal claro.

## Dados nunca enviados

O Lucas OS não envia tokens Google, access tokens, refresh tokens, chaves, variáveis de ambiente, secrets, corpo completo de email ou anexos. IDs reais de domínio e projeto não são enviados para a IA; ela sugere nomes, que o servidor mapeia para IDs pertencentes ao usuário.

## Confirmação humana

Uma sugestão com confiança baixa, resposta inválida, `kind = none` ou IA indisponível não vira preview pronto. O usuário pode manter a capture pendente ou usar o fluxo manual. Mesmo uma sugestão válida abre campos editáveis antes de criar a task.

## Configuração e custos

O preview é opcional e depende de `OPENAI_API_KEY`. O modelo pode ser configurado em `OPENAI_MODEL` e o default atual é `gpt-4.1-nano`. Cada clique que gera uma sugestão pode consumir uma chamada; o app não chama IA automaticamente em segundo plano.

## Como testar localmente

1. Configure `OPENAI_API_KEY` e, opcionalmente, `OPENAI_MODEL` somente no `.env.local`.
2. Reinicie o servidor Next.js.
3. Crie uma capture em `/capture`, clique em “Sugerir task com IA”, revise e confirme.
4. Conecte uma conta Google com Gmail read-only, abra `/inbox`, clique em “Sugerir task com IA” em um email recente e revise o draft.
5. Verifique `/tasks`, `/today` e, quando aplicável, os lembretes selecionados.
6. Sem `OPENAI_API_KEY`, confirme que o app mostra uma mensagem amigável e os fluxos manuais continuam funcionando.

## Como testar na Vercel

Configure `OPENAI_API_KEY` e `OPENAI_MODEL` no ambiente correto da Vercel, faça um novo deploy e repita os fluxos acima. Nunca copie uma chave para documentação, logs, GitHub ou campos públicos.

## Limitações atuais

- A IA não cria tasks, modifica Gmail ou toma decisões fora do preview.
- A classificação de domínio/projeto depende de correspondência exata com os nomes fornecidos ao prompt.
- Datas relativas só são interpretadas com o contexto de `America/Sao_Paulo`.
- Email continua limitado a mensagens recentes já carregadas pela Action Inbox.
- Não há classificação automática por remetente, domínio ou histórico.

## Próximos passos possíveis

- planejamento diário com IA, sempre como rascunho confirmável;
- revisão semanal assistida;
- regras explícitas por remetente/domínio;
- sugestões relacionadas a eventos do Calendar.
