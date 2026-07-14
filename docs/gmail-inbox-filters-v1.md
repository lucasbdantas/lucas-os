# Gmail Inbox Filters V1

## Objetivo

Gmail Inbox Filters V1 reduz ruido na `/inbox` sem mudar a postura de seguranca do Lucas OS.

A Inbox continua sendo somente leitura no Gmail. O app pode ler emails recentes e enviar um resumo/snippet para Capture quando o usuario clica explicitamente em `Enviar para Capture`.

## Filtros implementados

- Conta Google conectada;
- periodo: ultimos 7, 14 ou 30 dias;
- nao lidos, quando a label `UNREAD` estiver disponivel;
- com anexo, usando a query conservadora `has:attachment` do Gmail e exibindo marcador quando o metadata trouxer filename;
- termo de busca simples;
- labels basicas retornadas pelo Gmail.

Os filtros ficam na URL da pagina, nao sao persistidos em banco.

## Presets

- Todos recentes;
- Nao lidos;
- Com anexo;
- Possiveis acoes;
- Unicamp;
- Trabalho/Carreira;
- Pessoal.

Os presets usam queries/heuristicas simples do Gmail. Nao ha IA nesta etapa.

## Limites de seguranca

- Nao envia email;
- nao apaga email;
- nao arquiva email;
- nao marca email como lido;
- nao solicita permissao nova;
- nao salva corpo completo do email no banco;
- nao cria tasks automaticamente.

## Como testar

1. Abra `/inbox` com uma conta Google conectada e Gmail read-only concedido.
2. Teste o preset `Nao lidos`.
3. Teste o preset `Com anexo`.
4. Troque o periodo entre 7, 14 e 30 dias.
5. Filtre por conta, se houver mais de uma conta conectada.
6. Digite um termo de busca simples.
7. Se houver labels disponiveis, filtre por uma label.
8. Clique em `Enviar para Capture` e confirme que a pending capture aparece em `/capture`.
9. Confirme que nenhum email foi modificado no Gmail.

## Limitacoes

- O filtro `Com anexo` depende da resposta do Gmail para `has:attachment` e do metadata retornado por mensagem.
- Labels disponiveis sao derivadas dos emails carregados na busca atual.
- Presets sao heuristicas simples e podem trazer falsos positivos ou deixar emails relevantes de fora.
- A busca nao baixa anexos e nao le corpo completo do email.

## Proximos passos

- Email to Task Confirmation V1;
- classificacao por IA com confirmacao humana;
- regras personalizadas por remetente/dominio;
- filtros salvos por usuario, se o uso real justificar persistencia.
