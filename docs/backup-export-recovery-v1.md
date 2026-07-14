# Backup, Export & Recovery V1

## Objetivo

Backup, Export & Recovery V1 cria uma primeira camada segura para exportar dados reais do Lucas OS e apoiar recuperacao manual.

Esta versao nao implementa backup automatico e nao implementa restore automatico.

## O que entra no export

O endpoint autenticado `/api/backup/export` gera um JSON com:

- `export_version`;
- `exported_at`;
- `user_id`;
- `app_version`;
- `domains`;
- `projects`;
- `milestones`;
- `tasks`;
- `pending_captures`;
- `notifications`;
- `app_settings`;
- metadados seguros de `capture_tokens`;
- metadados seguros de `connected_accounts`.

O arquivo usa nome legivel:

```text
lucas-os-export-YYYY-MM-DD.json
```

## O que nao entra

O export nao inclui:

- `.env.local`;
- `DATABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `OPENAI_API_KEY`;
- Supabase keys;
- tokens externos completos;
- hash de capture tokens;
- `access_token_encrypted`;
- `refresh_token_encrypted`;
- tokens Google descriptografados.

## Connected accounts

Para `connected_accounts`, o export inclui apenas:

- `provider`;
- `account_email`;
- `display_name`;
- `scopes`;
- `status`;
- `last_sync_at`;
- `created_at`;
- `updated_at`.

Tokens Google nao sao exportados descriptografados porque eles dao acesso a contas externas. Mesmo criptografados, eles nao sao necessarios para recuperacao manual segura. Em um ambiente novo, as contas Google devem ser reconectadas via OAuth.

## Capture tokens

Para `capture_tokens`, o export inclui apenas:

- `name`;
- `token_prefix`;
- `created_at`;
- `last_used_at`;
- `revoked_at`.

O token completo nunca e salvo e o hash nao e exportado. Em um ambiente novo, crie novos tokens em `/settings`.

## Como testar localmente

1. Rode o app localmente.
2. Entre com seu usuario.
3. Abra `/settings/backup`.
4. Clique em `Exportar dados`.
5. Confirme que o arquivo JSON baixa.
6. Abra o JSON localmente e confirme que:
   - contem dados do usuario;
   - nao contem `access_token_encrypted`;
   - nao contem `refresh_token_encrypted`;
   - nao contem `token_hash`;
   - nao contem secrets de ambiente.

Tambem e possivel testar a rota diretamente no navegador autenticado:

```text
/api/backup/export
```

## Como testar na Vercel

1. Abra o deploy preview ou producao.
2. Faca login.
3. Abra `/settings/backup`.
4. Clique em `Exportar dados`.
5. Confirme que o download funciona.
6. Confirme que o JSON contem apenas dados do usuario logado.
7. Confirme que Google/Gmail/Calendar continuam conectados, sem mudanca de permissao.

## Recovery manual

Para recriar um ambiente do zero:

1. Clonar o repositorio.
2. Configurar env vars locais ou da Vercel, sem commitar secrets.
3. Aplicar migrations no Supabase alvo.
4. Criar e confirmar o usuario em Supabase Auth.
5. Rodar seed apenas se o ambiente estiver vazio.
6. Recriar capture tokens manualmente em `/settings`.
7. Reconectar contas Google em `/settings/integrations`.
8. Usar o JSON exportado como referencia para restaurar dados manualmente.
9. Ao restaurar manualmente, ajustar `user_id` para o novo usuario.
10. Validar `/api/health`, login, `/today`, `/tasks`, `/capture`, `/inbox` e `/settings`.

## Limitacoes

- Sem backup automatico agendado.
- Sem restore automatico.
- Sem export CSV.
- Sem upload para Google Drive.
- Restauracao manual exige cuidado com `user_id` e relacoes entre IDs.
- O JSON contem dados pessoais e deve ser guardado em local seguro.

## Proximos passos

- Backup automatico agendado;
- restore assistido;
- export CSV;
- backup para Google Drive, se futuramente desejado;
- checksums e historico de exports;
- teste E2E autenticado para download quando credenciais locais estiverem configuradas.
