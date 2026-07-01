# Production Preview Checkpoint

Data do checkpoint: 2026-07-01

## Status

Deploy preview funcionando na Vercel com Supabase producao.

## Banco de producao

- Supabase producao criado.
- As 5 migrations foram aplicadas.
- Tabelas, RLS e colunas principais foram validadas.
- Usuario inicial foi criado e confirmado em Supabase Auth.
- Seed inicial aplicado com sucesso:
  - 11 domains;
  - 23 projects.

## App preview

- Login funcionando no deploy preview.
- Paginas principais testadas:
  - `/today`;
  - `/tasks`;
  - `/projects`;
  - `/capture`;
  - `/quick-capture`;
  - `/settings`;
  - `/notifications`;
  - `/review`.
- `/api/health` funcionando.
- `/quick-capture` funcionando.
- `/api/capture` com token externo: pendente de confirmacao explicita neste checkpoint.
- AI preview: opcional; validar apenas se `OPENAI_API_KEY` estiver configurada no ambiente da Vercel.

## Riscos restantes antes de dominio final

- Confirmar comportamento em 1 dia real de uso.
- Revisar logs da Vercel depois de uso real.
- Planejar backup/restore do Supabase antes de dominio final.
- Confirmar se `/api/capture` com token externo foi testado em producao preview.
- Confirmar se AI preview deve ficar habilitado no ambiente de producao.
- Revisar Supabase Auth Redirect URLs quando houver dominio final.
- Evitar configurar `DATABASE_URL`, `SEED_USER_ID`, `SUPABASE_SERVICE_ROLE_KEY` ou `E2E_*` no runtime da Vercel.

## Proximos passos recomendados

1. Testar o preview por 1 dia real.
2. Revisar logs da Vercel.
3. Testar `/api/capture` com token externo, se ainda nao tiver sido validado.
4. Decidir se AI preview fica habilitado com `OPENAI_API_KEY`.
5. Planejar backup do Supabase.
6. Decidir se vai manter preview ou promover para producao.
7. Configurar dominio final somente depois dos itens acima.

## Checklist antes de dominio final

- [ ] 1 dia real de uso sem erro bloqueante.
- [ ] Logs da Vercel revisados.
- [ ] `/api/capture` validado com token criado no app.
- [ ] Token externo revogado testado.
- [ ] Backup/restore Supabase planejado.
- [ ] Auth Redirect URLs finais definidos.
- [ ] Variaveis de ambiente revisadas.
- [ ] Decisao tomada: manter preview ou promover para producao.
