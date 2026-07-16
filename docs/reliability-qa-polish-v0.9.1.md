# Reliability, QA & Polish Sprint v0.9.1

## Objetivo

Este checkpoint registra o hardening feito sem alterar schema, RLS, Auth,
integracoes externas ou regras de negocio. Nenhuma migration foi aplicada e
nenhum push, email, evento de Calendar ou acao de IA foi disparado pelo sprint.

## Melhorias entregues

### AI Daily Planning

- leituras de `daily_plans` degradam para o fallback em `app_settings` quando
  a Data API nao reconhece as tabelas;
- se `app_settings` tambem falhar, Today e Planning continuam abrindo sem
  plano salvo ou historico, em vez de propagar erro;
- gravacoes no fallback retornam uma mensagem recuperavel para a UI;
- o historico de compatibilidade e ordenado e limitado aos 14 planos mais
  recentes;
- feedback de compatibilidade continua sendo substituivel pelo mesmo item.

### Automatic Reminder Scheduler

- a rota de cron permanece protegida por `CRON_SECRET` e retorna somente JSON
  agregado, sem endpoint de subscription, payload, texto de task ou segredo;
- ausencia de configuracao retorna erro seguro; credencial invalida retorna
  `401`; a operacao manual continua separada em `/api/push/process`;
- a documentacao confirma a configuracao Vercel, hash no Supabase Vault,
  teste local, teste de producao e motivos de falha/idempotencia.

### Command Palette

- busca normaliza case e acentos;
- `Ctrl+K` e `Cmd+K` nao interrompem a digitacao em campos editaveis;
- a busca tolera falha parcial de uma categoria sem esconder os demais
  resultados;
- estados de carregamento, vazio e falha usam mensagens curtas e recuperaveis.

## Cobertura adicionada

- indisponibilidade de `app_settings` no fallback de planejamento;
- mensagem recuperavel ao falhar a persistencia do fallback;
- limite e ordenacao de 14 planos;
- troca de feedback sem duplicacao;
- normalizacao de busca com acentos;
- falha parcial de categoria na command palette;
- atalho de palette bloqueado em campos editaveis.

## Validacao local

- `npm run lint`: passou.
- `npm run build`: passou quando a rede pode resolver Google Fonts.
- `npm run test`: passou com 132 testes em 25 arquivos.
- `npx tsc --noEmit`: passou.
- `npm run test:e2e`: os 7 smoke tests publicos passaram e os 13 testes
  autenticados foram skipped sem credenciais, como esperado. Nesta sessao do
  Codex, o processo Next iniciado pelo Playwright nao encerrou no filesystem
  `E:` apos os testes e o wrapper atingiu timeout. Nao foi encontrada falha nas
  rotas testadas; a configuracao do projeto foi preservada para nao introduzir
  um workaround de processo especifico deste ambiente.

## Riscos e proximos passos

- o fallback de Daily Planning e operacional, mas a causa da indisponibilidade
  de `daily_plans` na Data API deve continuar monitorada no Supabase;
- o scheduler exige `CRON_SECRET`, hash no Vault, Web Push e cron da Vercel;
- push continua com granularidade de 30 minutos, sem quiet hours ou retry;
- os E2E autenticados dependem de credenciais locais e devem permanecer fora
  do Git;
- o proximo passo recomendado e uma rodada manual curta em producao preview:
  Today/Planning, Command Palette mobile, lembrete automatico e fallback de
  planejamento.
