# Workspace Reset V1

## Objetivo

`/settings/data` permite remover dados operacionais de teste da conta autenticada e recomeçar sem perder configuração pessoal, integrações ou acesso.

## Fluxo

1. A página consulta contagens com Supabase Auth e RLS.
2. O usuário revisa exatamente o que será apagado e preservado.
3. A action permanece bloqueada até digitar `LIMPAR MEU WORKSPACE` exatamente.
4. Depois do submit explícito, cada delete continua filtrado por `user_id`.
5. Ao terminar, a página oferece links para criar task, projeto, abrir Quick Capture e gerar um plano.

Nada é executado ao abrir a página, atualizar o preview ou digitar parcialmente a confirmação.

## Dados removidos

Nesta ordem:

1. `daily_plan_feedback`;
2. `daily_plans`;
3. `push_notification_deliveries`;
4. `milestones`;
5. `tasks`;
6. `projects`;
7. `pending_captures`;
8. `notifications`;
9. somente a linha `daily_planning_v2` de `app_settings`.

A ordem remove dependências antes dos registros pais. Se as tabelas dedicadas de Daily Planning estiverem indisponíveis na Data API, o reset continua e remove o fallback em `app_settings`.

## Dados preservados

- usuário Supabase Auth;
- domains, incluindo Inbox;
- `app_settings` de preferências, tema, timezone, quiet hours e notificações;
- `connected_accounts` e tokens Google criptografados;
- `push_subscriptions`;
- `capture_tokens`;
- env vars e secrets.

Não há service role, `DATABASE_URL`, migration ou bypass de RLS neste fluxo.

## Falhas e atomicidade

O Supabase Data API não oferece uma transação única para múltiplos deletes feitos pelo client autenticado. A action executa passos conservadores e para no primeiro erro inesperado, informando qual categoria falhou e que etapas anteriores podem ter sido concluídas. Antes de tentar novamente, atualize a página para obter novas contagens.

Uma versão futura poderá usar uma RPC transacional cuidadosamente revisada. Ela não foi criada agora para evitar adicionar um `SECURITY DEFINER` destrutivo durante o hardening.

## Como testar com segurança

1. Use uma conta/ambiente de teste e faça um export em `/settings/backup`.
2. Registre as contagens atuais em `/settings/data`.
3. Tente confirmação vazia, em minúsculas e com espaços: o botão permanece bloqueado e o servidor também rejeita.
4. Digite a frase exata e confirme conscientemente.
5. Confira que tasks, projects, captures, notifications e Planning ficaram vazios.
6. Confira que login, domains, preferências, Google, dispositivos push e capture tokens permanecem.
7. Abra os links de recomeço mostrados após o sucesso.

Nunca teste primeiro na única conta de produção sem um export recente.
