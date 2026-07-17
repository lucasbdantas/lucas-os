# Command Palette V1

## Objetivo

A command palette oferece navegacao e busca global sem substituir as telas
operacionais do Lucas OS. Ela abre com `Ctrl+K` no desktop e `Cmd+K` no macOS;
no mobile, o botao de busca do AppShell abre o mesmo painel.

## O que aparece

- atalhos fixos para Today, Quick Capture, Capture, Inbox, Tasks, Projects,
  Domains, Review, Planning, Notifications e Settings;
- tasks abertas recentes;
- projects ativos ou waiting;
- domains;
- pending captures recentes.

As consultas usam a sessao Supabase do usuario autenticado e continuam sujeitas
a RLS. A palette nao consulta corpo de emails, tokens, configuracoes privadas
ou dados de outro usuario.

## Comportamento de busca

- a busca e case-insensitive e ignora acentos;
- correspondencias exatas e de inicio de titulo aparecem antes de termos no
  tipo ou descricao;
- setas mudam a selecao, Enter abre o resultado e Esc fecha o painel;
- `Ctrl+K` e `Cmd+K` nao interceptam atalhos dentro de inputs, textareas,
  selects ou elementos editaveis;
- se uma categoria falhar, as demais continuam visiveis e a UI mostra um aviso
  curto; se a busca inteira falhar, o painel mostra uma mensagem recuperavel.

## Teste manual

1. Em uma rota protegida, use `Ctrl+K` ou o botao de busca mobile.
2. Sem texto, confirme os atalhos iniciais.
3. Busque uma task, projeto, dominio e capture existente.
4. Busque com e sem acentos, por exemplo `revisao` e `revisão`.
5. Use setas, Enter e Esc.
6. Com foco em um campo de texto, pressione `Ctrl+K` e confirme que o atalho
   nao abre a palette.

## Limitacoes

- resultados sao limitados por categoria para manter a resposta rapida;
- nao ha busca de email completa nesta versao;
- a busca nao indexa conteudo offline nem usa IA.
