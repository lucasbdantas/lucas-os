# Mobile Capture V1

Mobile Capture V1 tem dois modos de captura:

1. Endpoint externo com token: `POST /api/capture`.
2. Tela autenticada no navegador: `/quick-capture`.

Use o endpoint quando um atalho mobile ou webhook precisar capturar sem login no navegador. Use `/quick-capture` quando o navegador do celular puder fazer login normalmente.

## O Que Existe

- Usuários autenticados podem criar tokens de captura em `/settings`.
- Tokens são armazenados apenas como hashes SHA-256 em `capture_tokens`.
- O token completo aparece apenas uma vez, logo após a criação.
- Tokens existentes mostram apenas nome, prefixo, data de criação, último uso e estado revogado.
- Tokens podem ser revogados em `/settings`.
- `POST /api/capture` aceita capturas de texto sem login no navegador.
- `/quick-capture` aceita capturas digitadas e ditadas por sessão autenticada, quando o navegador suporta reconhecimento de voz.
- Lucas OS pode ser adicionado à tela inicial como PWA simples.
- O app não usa `SUPABASE_SERVICE_ROLE_KEY`.
- O route handler não usa `DATABASE_URL`.

## Modo A: Endpoint Externo Com Token

Use este modo para atalhos Android/Samsung, iOS Shortcuts ou webhooks simples.

### Criar Um Token

1. Faça login no Lucas OS.
2. Abra `/settings`.
3. Em `Captura externa`, crie um token com um nome como `Samsung Shortcut`, `Android Shortcut` ou `iPhone Shortcut`.
4. Copie o token completo imediatamente.

O token completo não aparece novamente depois dessa primeira resposta. Se ele for perdido, revogue o token antigo e crie outro.

Importante:

- O prefixo mostrado na lista não autentica.
- O nome do token não autentica.
- Apenas o token completo autoriza captura externa.

### URLs Do Endpoint

Use a URL que o celular consegue alcançar.

Navegador local no computador:

```txt
http://localhost:3000/api/capture
```

Celular na mesma rede Wi-Fi do computador:

```txt
http://<IP_DO_COMPUTADOR>:3000/api/capture
```

App publicado futuramente:

```txt
https://seu-dominio.com/api/capture
```

No celular, `localhost` aponta para o próprio celular, não para o PC. Para testes mobile locais, use o IP local do PC.

### Formato Da Requisição

Método:

```txt
POST
```

Headers:

```txt
Authorization: Bearer <TOKEN_COMPLETO>
Content-Type: application/json
```

Body:

```json
{
  "text": "comprar pilha amanhã",
  "source": "android_shortcut"
}
```

Sources externos aceitos:

- `ios_shortcut`
- `android_shortcut`
- `webhook`

Qualquer source não suportado cai em `webhook`.

Regras do texto:

- obrigatório;
- recebe `trim()` antes de inserir;
- texto vazio é rejeitado;
- limite máximo de 5000 caracteres.

### Testar Com Curl

Use um servidor local de desenvolvimento e substitua `<TOKEN>` pelo token completo copiado de `/settings`.

```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"comprar pilha amanhã\",\"source\":\"android_shortcut\"}"
```

Resposta esperada:

```json
{ "ok": true }
```

Depois abra `/capture` ou `/today` e confirme que a captura pendente apareceu.

## Modo B: Quick Capture Autenticada

Use este modo quando o celular puder abrir Lucas OS no navegador e fazer login.

Computador local:

```txt
http://localhost:3000/quick-capture
```

Celular na mesma rede Wi-Fi do computador:

```txt
http://<IP_DO_PC>:3000/quick-capture
```

App publicado futuramente:

```txt
https://seu-dominio.com/quick-capture
```

Comportamento:

- exige login;
- salva texto como `pending_capture`;
- usa `source = "web"`;
- permite digitar ou ditar texto pelo navegador, quando suportado;
- não chama IA automaticamente;
- não salva áudio;
- não cria task automaticamente;
- limpa o campo após salvar;
- pendências aparecem em `/capture` e atualizam `/today`.

### Ditado No Quick Capture

Em navegadores com Web Speech API, `/quick-capture` mostra o botão `Falar`.

Fluxo:

1. Toque em `Falar`.
2. Dite a captura.
3. Revise o texto preenchido no campo.
4. Toque em `Salvar captura`.

O Lucas OS não envia áudio para o servidor, não grava áudio e não salva automaticamente após transcrever. A voz vira apenas texto local no navegador, e o usuário continua responsável por revisar antes de salvar.

Se o navegador não oferecer reconhecimento de voz, use o teclado do celular ou o botão de microfone nativo do Android/iOS.

## Instalar Como App / PWA

Lucas OS inclui manifest básico de PWA para instalação simples na tela inicial. O app abre em `/quick-capture` quando iniciado pelo ícone.

Android/Chrome:

1. Abra `/quick-capture`.
2. Toque no menu do navegador.
3. Escolha `Adicionar à tela inicial`.
4. Abra Lucas OS pelo novo ícone.

iPhone/Safari:

1. Abra `/quick-capture`.
2. Toque no botão de compartilhar.
3. Escolha `Adicionar à Tela de Início`.
4. Abra Lucas OS pelo novo ícone.

Em desenvolvimento local, use:

```txt
http://<IP_DO_PC>:3000/quick-capture
```

Em produção futura, use o domínio real:

```txt
https://seu-dominio.com/quick-capture
```

Limites do PWA V1:

- não há modo offline;
- não há service worker customizado;
- não há cache de dados sensíveis;
- não há push notifications;
- alguns navegadores podem exigir HTTPS ou critérios próprios para mostrar o prompt de instalação.

## Desenvolvimento Na Rede Local

Rode o Next ouvindo na rede local:

```bash
npm run dev -- --hostname 0.0.0.0
```

Depois:

1. Descubra o IP local do PC.
2. Garanta que celular e PC estejam na mesma rede Wi-Fi.
3. Use `http://<IP_DO_PC>:3000/quick-capture` para captura autenticada no navegador.
4. Use `http://<IP_DO_COMPUTADOR>:3000/api/capture` para captura externa por token.
5. Se o celular não conectar, confira firewall do Windows e isolamento de rede.

## Setup De Atalho Android / Samsung

Os nomes exatos variam por versão do Android e modelo Samsung, mas o atalho precisa criar uma requisição HTTP com estes valores:

1. URL: `http://<IP_DO_COMPUTADOR>:3000/api/capture` para teste local em Wi-Fi, ou a URL de produção no futuro.
2. Método: `POST`.
3. Header: `Authorization` com valor `Bearer <TOKEN_COMPLETO>`.
4. Header: `Content-Type` com valor `application/json`.
5. Body JSON:

```json
{
  "text": "comprar pilha amanhã",
  "source": "android_shortcut"
}
```

No atalho real, substitua o valor de `text` pelo texto coletado pelo próprio atalho.

## Setup De iOS Shortcuts

No iOS Shortcuts, crie um atalho que:

1. Recebe ou pede um texto.
2. Usa `Get Contents of URL`.
3. Define o método como `POST`.
4. Adiciona o header `Authorization: Bearer <TOKEN_COMPLETO>`.
5. Adiciona o header `Content-Type: application/json`.
6. Envia o body JSON:

```json
{
  "text": "comprar pilha amanhã",
  "source": "ios_shortcut"
}
```

Para teste local no iPhone, use o IP local do PC em vez de `localhost`.

## Troubleshooting

- `localhost` no celular aponta para o celular, não para o PC.
- Token perdido exige revogar o token antigo em `/settings` e criar outro.
- Token revogado não funciona.
- O prefixo mostrado no Lucas OS não funciona como token.
- O nome do token não funciona como token.
- Erros genéricos da API são intencionais e não revelam detalhes por segurança.
- Uma captura bem-sucedida aparece em `/capture` como pendente e contribui para `/today`.
- Se `/quick-capture` redirecionar para `/login`, faça login no navegador do celular.
- Se requisições em Wi-Fi local falharem, confira se o Next está rodando com `--hostname 0.0.0.0`, se os dispositivos estão na mesma rede e se o firewall do Windows permite a conexão.
- Se o navegador não oferecer instalação como PWA, tente abrir `/quick-capture`, atualizar a página e verificar se o navegador exige HTTPS.

## Riscos De Segurança E Controles

- Um token de captura pode criar pending captures para seu dono.
- Guarde tokens de atalho com cuidado; qualquer pessoa com o token pode enviar capturas.
- Revogue tokens imediatamente se um dispositivo ou atalho for comprometido.
- Tokens nunca são armazenados em texto puro pelo Lucas OS.
- `/quick-capture` não usa tokens; depende da sessão autenticada do navegador.
- `.env.local` nunca deve ser commitado.
- O app não precisa e não usa Supabase service role key para Mobile Capture V1.
- Respostas de erro são genéricas de propósito e não revelam se a falha foi token, body ou formato de autenticação.
