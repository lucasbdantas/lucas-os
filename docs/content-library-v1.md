# Content Library V1

## Objetivo

A Biblioteca substitui anotações espalhadas em cadernos por um acervo pessoal de conteúdos e aprendizados. Ela guarda livros, filmes e séries, vídeos, podcasts, artigos, aulas, cursos, eventos ao vivo e referências diversas.

## Modelo de dados

A migration `20260716000011_content_library.sql` cria:

- `content_items`: metadados, tipo, status, prioridade, links, tags e datas de consumo;
- `content_notes`: múltiplas notas por conteúdo, contexto, posição e uma reescrita opcional confirmada pelo usuário.

As tabelas usam `user_id`, RLS e políticas explícitas de select, insert, update e delete. A FK composta `(content_item_id, user_id)` impede associar uma nota a conteúdo de outro usuário. A migration também concede acesso à Data API para `anon` e `authenticated`, mantendo RLS como barreira efetiva, e solicita reload do schema PostgREST.

## Como aplicar a migration

1. Abra o Supabase do ambiente alvo.
2. Vá a **SQL Editor** e crie uma query nova.
3. Abra `supabase/migrations/20260716000011_content_library.sql` no projeto.
4. Copie todo o arquivo, cole no SQL Editor e clique em **Run**.
5. Confirme que `content_items` e `content_notes` aparecem no Table Editor e que RLS está habilitado.

Não aplique em produção antes de revisar o ambiente e ter um export recente.

## Fluxo de uso

1. Abra `/library`.
2. Cadastre um conteúdo com título, tipo, status e prioridade; os demais campos são opcionais.
3. Use os filtros para reduzir o acervo por tipo, status ou prioridade.
4. Abra o detalhe para editar, acessar links e registrar notas.
5. Exclua somente após digitar a confirmação solicitada.

Tipos iniciais: livro, filme/série, vídeo do YouTube, podcast, TikTok/Reel, artigo, aula/curso, teatro/ao vivo e outro.

Status iniciais: quero consumir, em andamento, concluído, pausado e abandonado.

## Notas e IA opcional

A nota manual sempre funciona sem OpenAI. O botão **Reescrever com IA** envia somente:

- título, tipo e criador do conteúdo;
- contexto curto do conteúdo;
- texto bruto da nota.

O app nunca envia tokens, integrações, env vars, chaves, dados de autenticação ou outras notas. A resposta melhora clareza, estrutura e linguagem sem inventar fatos. Ela aparece como preview editável e só é salva após confirmação explícita. A nota original permanece visível e intacta.

Quando `OPENAI_API_KEY` não está configurada ou a chamada falha, a UI mostra um fallback amigável e preserva todo o fluxo manual.

## Backup, restore e reset

- O export JSON inclui `content_items` e `content_notes` do usuário autenticado.
- O restore preview reconhece essas entidades, mas continua somente leitura nesta versão.
- Workspace Reset conta e remove as notas antes dos conteúdos.
- Preferências, integrações, tokens e configurações continuam preservados pelo reset.

## Como testar

1. Aplique a migration no Supabase de teste.
2. Cadastre um livro e um vídeo, filtre por tipo/status/prioridade e edite um item.
3. Crie duas notas no mesmo conteúdo e edite uma delas.
4. Gere uma reescrita, confirme que nada é salvo antes do botão de confirmação e compare original/rewrite.
5. Teste sem `OPENAI_API_KEY` e confirme que notas manuais continuam funcionando.
6. Faça um export e procure `content_items` e `content_notes` no JSON.
7. Abra o preview de restore e confirme as contagens das duas entidades.
8. Abra Workspace Reset e confirme as contagens, sem executar a limpeza em ambiente real.
9. Teste navegação desktop, menu mobile e busca global por “Biblioteca” e pelo título de um item.

## Limitações

- Sem importação automática de YouTube Watch Later.
- Sem importação de TikTok, podcasts ou serviços de leitura.
- Sem anexos, capas, avaliações ou progresso percentual.
- Restore é apenas preview; não grava dados.
- IA apenas reescreve uma nota por vez e nunca cria conteúdo automaticamente.

## Próximos passos possíveis

- Content Library V2 com capas, avaliações e progresso;
- importadores opt-in, começando por links compartilhados;
- YouTube Watch Later somente após desenho de OAuth, privacidade e deduplicação;
- busca textual nas notas;
- export CSV e restore assistido.
