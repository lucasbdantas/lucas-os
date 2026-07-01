# Lucas OS Visual System V1

## Diagnostico da tentativa anterior

A primeira tentativa de refresh ficou superficial: muitos elementos antigos continuaram dependendo de `bg-white`, `bg-zinc-*` e classes locais, enquanto uma camada verde/escura tentava compensar por cima. Isso criou contraste estranho, cards pesados, gradientes artificiais e uma sensacao de "tema aplicado" em vez de produto desenhado.

Esta versao corrige a base: o tema passa por tokens globais, componentes semanticos e padroes reutilizaveis. O objetivo e que light/dark mode afetem `html`, `body`, app shell, sidebar, paginas, cards, forms, badges e botoes.

## Principios visuais

Lucas OS deve parecer um caderno operacional digital premium: pessoal, calmo, editorial e confiavel. A referencia e menos dashboard SaaS e mais uma mistura de Notion, Apple Calendar, Linear/Arc de forma sutil, e-ink colorido e Onyx Boox Note Air 3 C.

Principios:

- papel antes de vidro;
- tinta antes de neon;
- hierarquia antes de decoracao;
- sombras discretas;
- bordas quentes;
- cores em baixa saturacao;
- informacao densa, mas respiravel;
- mobile-first sem empobrecer desktop.

## Tema claro

O tema claro usa `parchment` como fundo base, `paper` como superficie de cards e texto grafite/oliva. Ele deve ser claro de verdade, sem depender do painel de dev tools ou de uma unica classe no body.

Uso esperado:

- `--background`: fundo geral off-white;
- `--surface`: cards e paineis principais;
- `--surface-raised`: superficies levemente elevadas;
- `--surface-soft`: blocos secundarios;
- `--foreground`: texto principal;
- `--foreground-muted`: texto de apoio;
- `--border`: bordas quentes e suaves.

## Tema escuro

O tema escuro usa oliva/grafite escuro, nao preto puro. O contraste deve lembrar biblioteca a noite ou dark academia leve, sem virar terminal hacker.

O dark mode pode ser escolhido manualmente em Settings ou seguir `prefers-color-scheme` quando a aparencia estiver em `system`.

## Theme System Fix

Problema corrigido: a tentativa anterior tinha tokens em `globals.css`, mas o Lucas OS nao aplicava `data-theme` no DOM a partir das preferencias do app. Na pratica, a caixa visual das Next Dev Tools podia mudar para Light/Dark, mas o app continuava seguindo apenas `prefers-color-scheme` ou estados hardcoded. O tema claro nao era fonte de verdade do produto.

Como funciona agora:

- `app_settings` guarda `appearance` dentro de `app_preferences`;
- valores aceitos: `light`, `dark`, `system`;
- default seguro: `light`, para priorizar o tema claro/papel;
- `src/app/layout.tsx` le o cookie `lucas-os-theme` e aplica `data-theme` no elemento `html`;
- `src/app/(app)/layout.tsx` busca as preferencias do usuario autenticado e passa `appearance` para o `AppShell`;
- `AppShell` tambem aplica `data-theme`, cobrindo o app autenticado mesmo quando o cookie ainda nao existe;
- `updateAppPreferences` persiste em Supabase e sincroniza o cookie;
- `loginWithPassword` sincroniza o cookie com a preferencia salva do usuario apos autenticar.

Como testar manualmente:

1. Abra `/today`.
2. Va para `/settings`.
3. Em "Aparencia", escolha `Claro` e salve.
4. Volte para `/today`: fundo, sidebar, cards, inputs, badges e botoes devem ficar claros.
5. Volte para `/settings`, escolha `Escuro` e salve.
6. Reabra `/today`: o app deve ficar escuro, com oliva/grafite e texto marfim suave.
7. Recarregue a pagina: o tema escolhido deve permanecer.
8. Escolha `Sistema` para voltar a seguir `prefers-color-scheme`.
9. Ignore a caixa visual das Next Dev Tools; ela nao controla o tema do Lucas OS.

Rotas revisadas para o sistema de tema:

- `/login`;
- `/today`;
- `/quick-capture`;
- `/capture`;
- `/inbox`;
- `/tasks`;
- `/projects`;
- `/review`;
- `/notifications`;
- `/settings`;
- `/settings/integrations`;
- `/share?title=Teste&text=Texto%20compartilhado&url=https%3A%2F%2Fexample.com`.

## Paleta

Tokens principais ficam em [globals.css](../src/app/globals.css):

- `--background`: parchment/off-white ou oliva escuro;
- `--surface`: papel/card;
- `--surface-raised`: card elevado leve;
- `--surface-soft`: fundo secundario;
- `--foreground`: tinta principal;
- `--foreground-muted`: texto secundario;
- `--emerald`: verde esmeralda fosco;
- `--sage`: verde salvia;
- `--moss`: verde musgo;
- `--amber`: atencao suave;
- `--rose`: erro discreto;
- `--blue`: informacao secundaria.

## Componentes

Componentes/padroes visuais usados:

- `AppShell`: sidebar e mobile nav com tema real;
- `AppNav`: estado ativo por rota;
- `PageHeader`: titulo editorial com regra lateral;
- `SectionHeader`: cabecalho de secao consistente;
- `AppCard`: base semantica para cards;
- `MetricCard`: metricas sutis;
- `TaskCard`, `ProjectCard`, `EventCard`, `EmailCard`, `CaptureCard`: classes semanticas para listas;
- `EmptyState`: estado vazio em papel suave;
- `StatusBadge`: badges com tons suaves;
- `FormField`/`field-control`: campos com borda quente e foco esmeralda.

## Botoes

- `primary-button`: acao principal, esmeralda fosco, sem gradiente forte;
- `soft-button`: acao secundaria, papel com borda;
- `ghost-button`: acao terciaria;
- `danger-button`: acao destrutiva/risco, discreta.

Botoes nao devem usar neon, sombras grandes ou movimento exagerado.

## Cards

Cards devem ser leves, com borda quente, sombra curta e raio amplo. Evitar cards dentro de cards quando a informacao puder ser separada por secao, divisoria ou `app-card-soft`.

Padroes:

- `app-card`: card principal;
- `app-card-soft`: card secundario;
- `app-card-muted`: aviso/fieldset;
- `app-card-flat`: conteudo sem elevacao;
- `app-card-interactive`: hover sutil.

## Badges

Badges devem comunicar estado sem roubar a pagina:

- default: neutro;
- green: ativo/sucesso;
- amber: atencao leve;
- red: erro/risco;
- blue: informacao.

## Layout desktop/mobile

Desktop:

- sidebar fixa de 18rem;
- conteudo com largura maxima por tipo de pagina;
- Today em layout mais editorial;
- Agenda principal e contexto separados;
- listas em cards, nao tabelas cruas.

Mobile:

- header compacto;
- bottom nav;
- uma coluna;
- textarea grande em Quick Capture;
- botoes com area de toque confortavel.

## Exemplos de uso

```tsx
<section className="section-shell">
  <SectionHeader
    title="Pendentes"
    description="Textos aguardando triagem humana."
    action={<StatusBadge label="3" tone="amber" />}
  />
  <article className="capture-card app-card-interactive p-4">...</article>
</section>
```

```tsx
<button className="primary-button px-4 py-2.5 text-sm font-semibold">
  Salvar
</button>
```

## O que evitar

- verde neon;
- preto puro;
- gradientes fortes;
- cards brilhantes;
- bordas agressivas;
- excesso de sombra;
- visual gamer/hacker;
- visual corporativo velho;
- dashboards genericos;
- texto grande demais dentro de paineis densos;
- esconder informacao relevante para parecer minimalista.

## Paginas revisadas

- `/login`;
- App Shell/sidebar/mobile nav;
- `/today`;
- `/quick-capture`;
- `/capture`;
- `/tasks`;
- `/projects`;
- `/domains`;
- `/review`;
- `/notifications`;
- `/settings`;
- `/settings/integrations`;
- `/inbox`;
- `/share`;
- `/share/saved`.

## Checklist visual manual

- O tema claro esta claro no app inteiro, nao so no dev tools?
- O tema escuro esta confortavel, sem preto puro e sem verde pesado?
- Sidebar, cards, inputs, botoes e paginas acompanham o tema?
- Today parece a pagina mais importante e mais bonita?
- Quick Capture parece agradavel para usar no celular?
- Inbox parece action inbox, nao clone cru de email?
- Tasks e Projects continuam densos, mas respiraveis?
- Badges ajudam sem poluir?
- Ha contraste suficiente em light/dark?
- Ha excesso de gradiente, sombra ou cor?
- `/share` parece parte nativa do produto?

## Limites desta versao

Nao houve schema, migration, regra de negocio, API nova ou dependencia externa. A preferencia `appearance` agora e persistida dentro do registro existente `app_preferences` em `app_settings`, e o app tambem sincroniza o cookie `lucas-os-theme` para aplicar o tema no `html` durante o reload.
