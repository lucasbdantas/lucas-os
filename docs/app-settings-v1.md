# App Settings V1

App Settings V1 cria uma UI real para preferências básicas do Lucas OS usando a tabela existente `app_settings`.

## Decisão De Schema

Não foi criada migration.

A tabela `app_settings` já suporta as preferências atuais:

- `user_id` identifica o dono;
- `key` identifica o grupo de configuração;
- `value jsonb` guarda os valores;
- índice único `user_id + key` evita duplicação;
- RLS restringe acesso ao próprio usuário.

As preferências do app usam:

```txt
key = app_preferences
```

## Preferências Disponíveis

Defaults:

- timezone: `America/Sao_Paulo`;
- densidade do Today: `comfortable`;
- página inicial preferida: `/today`;
- mostrar projetos sem próxima ação no Today: `true`.

Valores permitidos:

- timezone: `America/Sao_Paulo`, `UTC`, `America/New_York`, `Europe/London`;
- densidade do Today: `compact`, `comfortable`;
- página inicial: `/today`, `/quick-capture`;
- projetos sem próxima ação: sim/não.

## Onde São Usadas

- `/settings`: lê e salva preferências.
- `/`: redireciona para a página inicial preferida quando o usuário está logado.
- Pós-login: redireciona para a página inicial preferida.
- `/today`: usa timezone para calcular hoje/amanhã/próximos dias, usa densidade para limitar listas e respeita o toggle de projetos sem próxima ação.
- `/review`: usa timezone para calcular a janela semanal.

## Segurança

- Não usa `DATABASE_URL` em páginas, componentes ou actions do app.
- Não usa service role key.
- Não expõe secrets.
- Cada usuário lê e salva apenas suas próprias settings via RLS.

## Limitações

- Timezones são allowlist curta por enquanto.
- Densidade do Today só altera quantidade/espaçamento; não há layout avançado.
- App settings ainda não controla reminders, integrações ou notificações.
- Não há histórico/auditoria de mudanças de preferências.

## Como Testar

1. Abra `/settings`.
2. Altere timezone, densidade, página inicial e o toggle de projetos sem próxima ação.
3. Salve e confira a mensagem de sucesso.
4. Abra `/today` e confirme que a preferência visual foi aplicada.
5. Desative projetos sem próxima ação e confirme que a seção some do Today.
6. Abra `/review` e confirme que a página continua funcionando.
7. Acesse `/` logado e confirme que redireciona para a página inicial preferida.
