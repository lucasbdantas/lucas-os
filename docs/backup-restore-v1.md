# Backup Restore V1

## Estado

O Lucas OS aceita o JSON produzido por `/api/backup/export` para um preview de restauração em `/settings/backup`.

Esta primeira versão é deliberadamente **dry-run**: valida o arquivo e compara domínios, projetos, tasks, milestones e preferências seguras com a conta autenticada, mas não grava dados.

## Proteções

- limite de 5 MB e versão de export obrigatória;
- sessão Supabase obrigatória e comparação sempre limitada pelo `user_id` autenticado;
- o `user_id` do arquivo não é reutilizado como ownership no destino;
- bloqueio de chaves sensíveis em qualquer nível do JSON;
- contas conectadas, capture tokens, push subscriptions, autenticação e secrets são excluídos;
- nenhum dado é apagado e conflitos ficam para revisão humana.

## Como testar

1. Em `/settings/backup`, use **Exportar dados**.
2. Na mesma página, selecione o JSON em **Preview de restauração**.
3. Confira as contagens de criar, atualizar e inválidos.
4. Confirme no Supabase que nenhuma linha foi alterada.

## Limitação consciente

A escrita do restore foi adiada. Antes dela, o produto precisa definir mapeamento de IDs relacionais, política de conflitos por entidade e uma confirmação final explicitamente separada. Isso evita duplicar relações ou sobrescrever dados reais durante o hardening para v1.0.
