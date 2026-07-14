# Mobile Polish V1

## Objetivo

Melhorar a experiencia mobile do Lucas OS sem alterar regras de negocio, schema, endpoints sensiveis ou integracoes externas.

## Problema corrigido

A primeira versao do polimento mobile ainda podia parecer uma sidebar espremida na parte inferior em alguns estados do PWA/Android. Isso deixava links como Today, Review, Notifications, Capture, Inbox, Domains, Projects, Tasks e Settings competindo no mesmo espaco.

Mobile Polish V1 corrige essa direcao: a bottom nav nao tenta representar o app inteiro. Ela mostra poucos atalhos de uso frequente e abre uma central mobile para o restante.

## Paginas revisadas

- `/today`
- `/quick-capture`
- `/capture`
- `/inbox`
- `/tasks`
- `/projects`
- `/review`
- `/notifications`
- `/settings`
- `/settings/integrations`
- `/settings/backup`
- `/settings/notifications`
- `/share`
- `/share/saved`

## Decisoes de navegacao

- O desktop continua com a navegacao completa no sidebar.
- O mobile usa bottom nav reduzido para os fluxos de maior frequencia:
  - Today
  - Quick
  - Capture
  - Inbox
- Menu
- Quick Capture continua em um toque.
- O item Menu abre uma central mobile integrada ao AppShell, sem criar rota nova.
- Tasks, Projects, Domains, Review, Notifications, Settings, Integrations, Backup e Push Notifications ficam em cards grandes dentro da central mobile.
- A navegacao mobile respeita safe area para PWA instalado.

## Estrutura da bottom nav

A bottom nav mobile tem 5 itens no maximo:

1. Today
2. Quick
3. Capture
4. Inbox
5. Menu

Ela nao renderiza a sidebar desktop no mobile e nao deve gerar overflow horizontal.

## Estrutura da central mobile

O painel Menu usa cards grandes para:

- Today
- Quick Capture
- Capture
- Inbox
- Tasks
- Projects
- Domains
- Review
- Notifications
- Settings
- Integrations
- Backup
- Push Notifications

O painel aparece sobre a tela atual, usa visual de papel/e-ink e pode ser fechado pelo botao "Fechar" ou tocando fora.

## Melhorias de Quick Capture

- Textarea maior e mais confortavel no celular.
- Campo preparado para teclado mobile com capitalizacao de frases e spellcheck.
- Botoes maiores e empilhados em telas pequenas.
- Fluxo continua igual: texto vira `pending_capture`, sem IA automatica e sem criar task automaticamente.

## Melhorias de Share Target

- `/share` e `/share/saved` usam altura `svh`, paddings menores no mobile e botoes com area de toque maior.
- O fluxo continua igual: conteudo compartilhado e revisado antes de salvar.

## Melhorias de Inbox

- Cards de email evitam overflow horizontal.
- Assuntos longos quebram linha.
- Acoes de email ficam empilhadas no mobile e voltam a linha flexivel no desktop.
- A acao "Enviar para Capture" continua funcionando sem alterar permissoes Gmail.

## Ajustes globais mobile

- Safe area basica para header e bottom nav.
- Tap targets minimos para botoes principais.
- Inputs com `font-size: 16px` no mobile para evitar zoom indesejado em navegadores moveis.
- Cards e paineis com raio menor e quebra de texto para reduzir overflow.
- `app-page` com padding inferior maior para nao ficar escondida atras do bottom nav.

## Checklist manual Android

1. Abrir o PWA instalado ou `http://<IP_DO_PC>:3000/quick-capture`.
2. Conferir se o bottom nav mostra apenas Today, Quick, Capture, Inbox e Menu.
3. Conferir que nao ha links sobrepostos na barra inferior.
4. Tocar em Menu e verificar os cards grandes da central mobile.
5. Abrir Tasks, Projects, Review, Settings, Integrations, Backup e Push Notifications pelo Menu.
6. Salvar uma captura em `/quick-capture`.
7. Conferir que o campo limpa e volta a focar.
8. Abrir `/capture` e confirmar que a captura apareceu.
9. Compartilhar texto/link de outro app para Lucas OS e salvar em `/share`.
10. Abrir `/inbox` e conferir que filtros e acoes cabem na tela.
11. Abrir `/today` e confirmar que nao ha overflow horizontal.
12. Alternar tema claro/escuro e conferir contraste geral.

## Limitacoes

- Nao foram adicionados testes visuais automatizados.
- A navegacao mobile ainda e textual; icones podem vir depois se fizer sentido.
- A central mobile e um painel integrado, nao uma rota propria.
- Nao altera a organizacao de conteudo das paginas densas, apenas melhora responsividade e toque.
- iOS pode ter comportamento diferente em PWA e Web Share Target.

## Proximos passos

- Adicionar icones discretos no bottom nav.
- Criar QA visual com screenshots mobile.
- Refinar ordem das secoes do Today apos uso real.
- Melhorar filtros mobile da Inbox com um painel colapsavel, se a pagina ficar densa.
