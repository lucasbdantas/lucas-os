# Privacy & Security Audit V1

Data do checkpoint: 2026-07-16.

## Resultado executivo

Nenhum uso de `SUPABASE_SERVICE_ROLE_KEY` ou `DATABASE_URL` foi encontrado no runtime do app. As referências a tokens Google criptografados permanecem em módulos server-only de OAuth, Gmail e Calendar. Não foram encontrados `console.log`, `console.error` ou `console.warn` em `src/app`, `src/components` ou `src/lib`.

## IA

- OpenAI é criada somente em `src/lib/ai/openai.ts` com env server-only.
- Daily Planning e Weekly Review enviam contexto resumido e limitado.
- Weekly Review remove URLs completas e trunca títulos/captures.
- Nenhum prompt inclui tokens OAuth, push endpoints, env vars ou corpos completos de email.
- Falta de OpenAI degrada para mensagem amigável; fluxos manuais continuam.

## Backup e restore

- export exige sessão/RLS e executa uma varredura final de chaves sensíveis;
- metadados de contas conectadas não contêm tokens criptografados;
- capture tokens exportam somente nome/prefixo/timestamps;
- restore V1 é dry-run, limita arquivo a 5 MB e bloqueia chaves sensíveis em qualquer nível;
- restore nunca aceita ownership do arquivo nem faz delete;
- escrita automática foi deliberadamente adiada.

## Endpoints privilegiados

- cron usa `CRON_SECRET` comparado em tempo constante e não registra o header;
- push usa Supabase Auth/RLS ou RPC com segredo em hash no Vault;
- diagnósticos push sanitizam URLs, Bearer tokens e sequências longas;
- capture externo autentica somente por hash de token;
- APIs não usam service role.

## Busca e integrações

- Command Palette exige sessão e cada consulta é limitada por `user_id`/RLS;
- resultados não incluem corpo completo de Gmail;
- Gmail e Calendar são read-only;
- falha parcial de uma categoria de busca ou conta Google não derruba toda a interface.

## Riscos restantes

1. O restore ainda não grava dados; isso é uma proteção, mas recuperação integral continua manual.
2. Quiet hours ainda não são aplicadas no claim SQL do cron; uma migration atômica é necessária.
3. Health confirma configuração agregada, não disponibilidade ponta a ponta de provedores externos.
4. E2E autenticado depende de credenciais locais descartáveis.
5. Dependência de fontes Google durante build exige rede ou adoção futura de fontes locais.

## Guardrails para revisão

- nunca colocar `.env.local`, capture tokens, exports pessoais ou relatórios Playwright no Git;
- revisar qualquer futura migration de scheduler antes de aplicar;
- manter IA approval-first;
- manter OAuth/Calendar/Gmail exclusivamente server-side e read-only;
- executar lint, build, unit, E2E e TypeScript antes da tag v1.0.
