# Samsung Watch Capture V1

## Objetivo

Samsung Watch Capture V1 transforma um ditado feito no Samsung Galaxy Watch 7 em uma `pending_capture` no Lucas OS. O áudio não é enviado nem armazenado: o Wear OS/Android faz o reconhecimento e envia apenas o texto.

O fluxo é deliberadamente estreito:

`Galaxy Watch 7 -> ditado -> AutoWear/Tasker no Android -> POST autenticado -> pending capture`

Nenhuma tarefa é criada automaticamente. IA, Gmail e Calendar não participam desse fluxo.

## Pré-requisitos

- Samsung Galaxy Watch 7 pareado com um celular Android;
- Tasker instalado no celular;
- AutoWear instalado/configurado no celular e no relógio, ou automação Wear OS equivalente;
- Lucas OS acessível por HTTPS em produção ou pela rede local durante desenvolvimento;
- capture token criado em **Configurações > Captura externa**.

O [AutoWear é um plugin do Tasker para Wear OS](https://joaoapps.com/autowear/) e pode expor tiles, telas e comandos no relógio. O Tasker possui uma ação oficial [HTTP Request](https://tasker.joaoapps.com/userguide/en/help/ah_http_request.html) para enviar o POST.

## Endpoint

```text
POST /api/capture/watch
```

Headers:

```text
Authorization: Bearer <TOKEN_COMPLETO>
Content-Type: application/json
```

Body mínimo:

```json
{
  "text": "lembrar de revisar o contrato amanhã",
  "source": "watch"
}
```

Body recomendado:

```json
{
  "text": "lembrar de revisar o contrato amanhã",
  "source": "watch",
  "device_label": "Samsung Galaxy Watch 7",
  "captured_at": "2026-07-17T10:30:00-03:00"
}
```

`captured_at` é opcional e deve ser um timestamp ISO válido. Sem ele, o servidor usa o momento do recebimento.

Resposta de sucesso:

```json
{
  "ok": true,
  "capture_id": "<UUID>",
  "message": "Captura do relógio salva."
}
```

## Configuração com Tasker e AutoWear

Os nomes exatos das telas podem variar entre versões do Tasker e AutoWear. A arquitetura recomendada é:

1. Instale e autorize o AutoWear no celular e no Galaxy Watch 7.
2. No AutoWear, crie um tile, tela ou comando de voz chamado **Capturar no Lucas OS**.
3. Faça esse elemento disparar um comando que o Tasker consiga receber.
4. No Tasker, crie um perfil para o evento/comando do AutoWear.
5. Mapeie o texto reconhecido para uma variável local, por exemplo `%watch_text`.
6. Adicione à tarefa a ação **Net > HTTP Request**.
7. Configure `Method` como `POST`.
8. Use `https://<SEU_DEPLOY>/api/capture/watch` como URL.
9. Nos headers, coloque uma linha por header:

```text
Authorization:Bearer <TOKEN_COMPLETO>
Content-Type:application/json
```

10. No body, use:

```json
{
  "text": "%watch_text",
  "source": "watch",
  "device_label": "Samsung Galaxy Watch 7"
}
```

11. Faça uma captura curta e confirme que o retorno HTTP é `201`.
12. Abra `/capture` e confirme que ela aparece como pendente com origem **Relógio**.

AutoVoice pode ser usado como alternativa para obter/comandar o texto. Ele não é obrigatório: o ponto de integração com o Lucas OS é apenas a variável textual entregue ao HTTP Request do Tasker.

## Desenvolvimento local

Rode o Next acessível na rede:

```powershell
npm run dev -- --hostname 0.0.0.0
```

Use no Tasker:

```text
http://<IP_DO_PC>:3000/api/capture/watch
```

Celular e computador devem estar na mesma rede. `localhost` no celular aponta para o próprio celular, não para o PC. Em produção, prefira sempre HTTPS.

## Segurança

- O endpoint exige capture token no header Bearer.
- O banco armazena apenas o hash do token.
- O token completo aparece uma única vez na criação.
- Token revogado deixa de funcionar.
- O endpoint não registra token nem texto completo em logs.
- O RPC associa a captura ao dono do token e não usa service role.
- `device_label` é metadado informativo e não autentica.
- A captura fica pendente; task e IA exigem ações humanas posteriores.

Guarde o token no Tasker como segredo. Não coloque o token em screenshots, documentação, repositório Git ou variáveis compartilhadas por outros perfis.

## Migration

Antes de usar o endpoint, aplique:

```text
supabase/migrations/20260717000012_samsung_watch_capture.sql
```

A migration não cria tabelas. Ela adiciona a origem `watch` e o RPC seguro que reutiliza `capture_tokens`.

## Troubleshooting

- `400 invalid_text`: o ditado chegou vazio ou passou de 5.000 caracteres.
- `400 invalid_source`: use `source` igual a `watch`.
- `400 invalid_json`: confira aspas e substituição da variável no body do Tasker.
- `401 unauthorized`: token ausente, incorreto ou revogado; crie outro token se perdeu o valor completo.
- `503 capture_unavailable`: confirme a migration, as variáveis públicas do Supabase e a exposição do RPC na Data API.
- Captura não aparece: confira se está olhando o mesmo ambiente Supabase usado pela URL chamada.
- Tasker não conecta localmente: confira IP, Wi-Fi e firewall do Windows.

## Limitações

- Não existe app nativo no relógio.
- A qualidade do texto depende do reconhecimento de voz do Wear OS/Android.
- Tasker e AutoWear são configurados manualmente e podem mudar de interface.
- Não há fila offline própria do Lucas OS no relógio.
- Não há confirmação sonora enviada pelo Lucas OS nesta versão.
- Não há criação automática de task ou execução automática de IA.
