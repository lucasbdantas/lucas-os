# Lucas OS v1.0 Readiness Checkpoint

Data: 2026-07-16. Status: candidato a v1.0 para revisão humana; sem tag, deploy ou migration aplicada nesta sprint.

## Produto atual

Auth/RLS, Domains, Projects/Milestones, Tasks/recorrência/lembretes, Today, Review, Planning, Capture/Quick Capture/Share Target, Gmail read-only, Calendar read-only/lanes, Email to Task, Content Library, PWA, push, scheduler, Command Palette, backup export, restore preview, Workspace Reset e AI Daily Planning estão presentes.

Esta sprint acrescenta:

- preview dry-run de restore em `/settings/backup`;
- preferências de notificação e cálculo testado de quiet hours;
- lista e revogação segura de dispositivos push;
- AI Weekly Review consultiva em `/review`;
- `/settings/health` e checklist de setup;
- arquitetura pura para regras de sugestão;
- auditoria de privacidade e regressão ampliada.
- Content Library com notas vinculadas, filtros, backup e reset;
- navegação desktop/mobile refinada e integrada à Command Palette.

## Environment variables

Públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Server-only conforme feature: `OPENAI_API_KEY`, `OPENAI_MODEL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `INTEGRATIONS_ENCRYPTION_KEY`, `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, `CRON_SECRET`.

Somente scripts locais: `DATABASE_URL`, `SEED_USER_ID`. Somente E2E local: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `E2E_BASE_URL`, `E2E_PORT`.

`SUPABASE_SERVICE_ROLE_KEY` não é usada nem necessária.

## Migrations na ordem

1. `20260629000001_initial_phase_1_schema.sql`
2. `20260629000002_projects_unique_index.sql`
3. `20260629000003_pending_captures.sql`
4. `20260629000004_capture_tokens.sql`
5. `20260629000005_recurring_tasks.sql`
6. `20260701000006_connected_accounts.sql`
7. `20260701000007_push_notifications.sql`
8. `20260714000008_daily_plans.sql`
9. `20260715000009_daily_plans_data_api_grants.sql`
10. `20260715000010_automatic_reminder_scheduler.sql`
11. `20260716000011_content_library.sql`

Esta auditoria não criou nem aplicou migrations. Antes da tag, confirmar no Supabase de produção que 8, 9, 10 e 11 estão aplicadas. Daily Planning deve aparecer como `tabelas` em `/settings/health`; o fallback em `app_settings` permanece apenas como proteção.

## Validação da auditoria final

- `npm run lint`: passou;
- `npm run build`: passou, com rede disponível para carregar Geist;
- `npm run test`: 34 arquivos e 165 testes passaram;
- `npx tsc --noEmit`: passou;
- E2E completo não foi repetido por causa do teardown conhecido no Windows/drive `E:`; os smoke tests existentes continuam versionados.

## Setup por serviço

- Supabase: aplicar migrations, confirmar RLS e criar usuário Auth.
- Vercel: configurar apenas envs server/public necessárias. No plano Hobby, usar scheduler externo para frequencia subdiaria ou cron diario compativel; `vercel.json` nao registra cron de 30 minutos.
- Google: configurar OAuth callback e scopes read-only para Gmail/Calendar.
- OpenAI: opcional; default `gpt-4.1-nano`; recursos manuais funcionam sem chave.
- Push: gerar VAPID, ativar por dispositivo e testar pelo painel.
- Scheduler: configurar `CRON_SECRET`, hash equivalente no Supabase Vault e validar a rota sem registrar headers.

## Limitações conhecidas

- restore é preview completo, sem escrita;
- quiet hours são armazenadas/testadas, mas o cron ainda não as aplica;
- regras de automação são somente helpers/testes/docs;
- Weekly Review de IA não possui histórico;
- health não executa push, cron, Gmail ou Calendar como teste destrutivo;
- a migration da Content Library precisa estar aplicada no ambiente alvo antes do uso da rota `/library`;
- build baixa Geist do Google e requer rede;
- E2E autenticado fica skipped sem credenciais locais.

## Checklist antes da tag v1.0

- [ ] Revisar manualmente todos os arquivos deste sprint.
- [ ] Testar restore preview com um export real e confirmar zero writes.
- [ ] Salvar/recarregar preferências de notificação.
- [ ] Revogar um dispositivo de teste, não o único dispositivo principal.
- [ ] Gerar Weekly Review com e sem OpenAI.
- [ ] Conferir `/settings/health` sem exposição de valores de env.
- [ ] Confirmar que Daily Planning aparece como `tabelas`, não `compatibilidade`.
- [ ] Aplicar e validar `20260716000011_content_library.sql` no ambiente alvo.
- [ ] Criar um conteúdo, associar uma nota e conferir backup/restore preview/reset.
- [ ] Validar Today, Planning, Review, Inbox, Tasks e Settings no Android/PWA.
- [ ] Confirmar migrations em produção e executar backup manual.
- [ ] Rodar E2E autenticado com usuário descartável.
- [ ] Decidir se quiet hours do cron bloqueia a tag ou entra em v1.1.
- [x] Atualizar metadata do package para `1.0.0`.
- [ ] Criar changelog e tag somente após aprovação final.

## Pós-v1

1. Restore com escrita transacional e confirmação final.
2. Migration atômica de quiet hours para o scheduler.
3. UI de regras de sugestão.
4. Histórico opcional da Weekly Review.
5. Fontes locais e backup automático verificado.
