# Lucas OS — Personal Operations Dashboard FULL
Versão: 1.0 full-scope
Data base: 2026-06-29
Usuário: Lucas Batista Dantas
Contexto central: Engenharia Elétrica na Unicamp, transição Agibank → Serena Energia, TCC sobre data centers sustentáveis, carreira em energia/infraestrutura/sustentabilidade, vida pessoal em Campinas/SP.

---

## 0. Decisão de produto

Este projeto NÃO será um MVP minimalista. A decisão explícita é construir uma versão completa inspirada no Personal Operations Dashboard original, incluindo:

- Core operacional: Today, tarefas, projetos, domínios, Inbox, calendário, notificações.
- Captura por voz e texto com IA.
- Mobile shortcuts.
- Biblioteca pessoal: notas, quotes, livros, diário, resurfacing.
- People CRM.
- Health, energia e rotina.
- Routines/hábitos.
- Inventory.
- Email integration.
- Observations engine.
- Pipeline de carreira/conteúdo/aprendizado.
- Financeiro/logística pessoal.
- Módulo acadêmico especializado.
- Módulo TCC/pesquisa.
- Módulo Serena/energia/mercado.

A estratégia será "full scope, phased build": tudo entra no escopo, mas o sistema será construído em camadas, cada uma entregável e utilizável.

Regra de ouro: o sistema pode ser ambicioso, mas precisa continuar confiável. Itens incertos entram em Inbox, não são chutados em qualquer canto.

---

## 1. Objetivo do Lucas OS

Criar um sistema pessoal self-hosted, mobile-first e voice-first para centralizar:

1. O que Lucas precisa fazer.
2. Onde cada coisa pertence.
3. O que está atrasando.
4. O que está drenando energia.
5. O que precisa ser lembrado no futuro.
6. O que Lucas está aprendendo, pesquisando e construindo.
7. Como as áreas da vida estão se movendo ao longo do tempo.

O sistema deve funcionar como uma memória operacional externa, não como um coach genérico.

Ele deve observar e organizar. Ele pode levantar alertas factuais. Ele não deve substituir reflexão humana, terapia, amizades ou decisões do próprio Lucas.

---

## 2. Princípios de design

### 2.1 Voice-first
Capturar precisa ser mais fácil do que esquecer. O Lucas deve conseguir falar:

> "Adiciona tarefa para revisar o relatório de Controle amanhã às 15h"

e o sistema deve estruturar automaticamente.

### 2.2 Inbox obrigatório
Tudo que a IA não souber classificar com alta confiança vai para Inbox. Melhor triagem depois do que tarefa perdida.

### 2.3 Full scope, build faseado
Todos os módulos entram no desenho de arquitetura desde o início. Mas a implementação tem fases e feature flags.

### 2.4 Dados relacionáveis
Tarefa pode se conectar a projeto, disciplina, pessoa, empresa, livro, nota, evento, área de vida, documento, rotina ou objetivo.

### 2.5 Sem "conselhos mágicos"
Observações devem ser factuais:
- "Projeto Controle está há 5 dias sem atividade."
- "Você tem 3 entregas nos próximos 4 dias."
- "Sua média de energia caiu nos últimos 5 check-ins."

Evitar:
- "Você deveria mudar sua vida."
- "Você está fracassando."
- "Você precisa priorizar X."

### 2.6 Painel de carga mental
A tela Today precisa mostrar o que importa agora, sem virar uma parede de informação.

---

## 3. Stack recomendada

### 3.1 Frontend
- Next.js App Router
- TypeScript
- Tailwind
- PWA mobile-first
- Bottom navigation no celular
- Layout desktop com sidebar

### 3.2 Backend
- Node.js
- Hono ou Fastify
- API routes organizadas por domínio funcional
- Jobs agendados para sync e observations

### 3.3 Banco e storage
- Supabase Postgres
- Supabase Auth
- Supabase Storage para arquivos, fotos, recibos, exames, PDFs e anexos
- Row Level Security mesmo sendo single-user

### 3.4 IA
- Claude/Anthropic API para parsing estruturado
- OpenAI opcional para transcrição ou embeddings
- Modelo barato para rotas simples
- Modelo mais forte para parsing complexo, OCR e sínteses

### 3.5 Integrações
- Google Calendar
- Gmail
- Google Drive opcional
- iOS Shortcuts / Android HTTP Shortcuts
- Pushover opcional para push
- Open Library API para livros
- Readwise opcional
- GitHub opcional para projetos técnicos

---

## 4. Domínios iniciais

Domínios são áreas permanentes da vida. Projetos são finitos.

### 4.1 System
- Inbox
- Sem classificação
- Revisar depois

### 4.2 Faculdade FEEC
Para Unicamp, disciplinas, provas, relatórios, projetos, frequência, notas e prazos.

Subcontextos:
- EA701 Sistemas Embarcados
- EA721 Controle
- EE755 Micro-ondas
- Lab de Máquinas
- Lab Eletrônica
- TCC formal

### 4.3 Serena & Energia
Para estágio na Serena, onboarding, mercado livre de energia, renováveis, desenvolvimento de projetos, viabilidade técnico-comercial, eólica, solar, BESS e inteligência de mercado.

### 4.4 Carreira & Processos
Para vagas, consultorias, LinkedIn, currículo, entrevistas, IAESTE, programas internacionais, Siemens Energy, PwC, Visagio, McKinsey e reposicionamento profissional.

### 4.5 TCC & Pesquisa
Para data centers sustentáveis, energia, água, telecom, Nordeste, Ceará/Pecém, BNDES, regulação, governança sociotécnica, bibliografia e escrita.

### 4.6 Vida Pessoal
Para vida prática geral, pendências soltas, documentos, compras, deslocamentos e pequenos compromissos.

### 4.7 Casa & Finanças
Para contas, orçamento, gastos, aluguel/moradia, carro, manutenção, benefícios e decisões financeiras.

### 4.8 Saúde, Energia & Rotina
Para sono, alimentação, treino, cansaço, energia, humor, exames, consultas, remédios e check-ins.

### 4.9 Relações & Família
Para Nicole, família, sogra, amigos, datas importantes, conversas difíceis, presença e manutenção de vínculos.

### 4.10 Aprendizado & Biblioteca
Para livros, cursos, Green Belt, referências, filmes/séries úteis, ideias e repertório.

### 4.11 Construções & Projetos Técnicos
Para Lucas OS, GitHub, projetos embarcados, firmware, dashboards, automações e experimentos.

---

## 5. Projetos iniciais

### 5.1 Acadêmicos
- Controle — Projeto computacional
- Controle — Prova final
- Embarcados — Projeto/apresentação
- Embarcados — Prova
- Lab Eletrônica — Relatório/entrega
- Lab de Máquinas — Relatórios restantes
- Micro-ondas — Ajustes finais/entrega
- Fechamento semestre 2026.1

### 5.2 Serena
- Onboarding Serena Energia
- Trilha de estudos em desenvolvimento de projetos
- Mapa do setor elétrico brasileiro para estágio
- Dicionário pessoal de energia/mercado
- Rotina presencial/trajeto/moradia

### 5.3 TCC
- Reestruturar sumário pós-orientação
- Consolidar bibliografia
- Capítulo Nordeste/data centers
- Capítulo energia/água/telecom
- Capítulo governança e impacto social
- Versão para orientador
- Checklist ABNT/citações

### 5.4 Carreira
- Reposicionamento profissional Lucas
- Currículo energia/infraestrutura
- LinkedIn 2026
- Programas internacionais
- Consultorias abertas
- Narrativa Agibank → Serena → energia

### 5.5 Vida
- Rotina julho 2026
- Organizar quarto/ambiente de trabalho
- Cuidar do carro
- Plano financeiro básico
- Relacionamento e presença

### 5.6 Sistema
- Construir Lucas OS
- Deploy Lucas OS
- Captura por voz
- Integrações Google
- Observations engine
- Versão mobile

---

## 6. Feature selection — tudo KEEP

### 6.1 Core
- Today screen: KEEP
- Tasks: KEEP
- Domains: KEEP
- Inbox: KEEP
- Projects: KEEP
- Milestones: KEEP
- Voice capture: KEEP
- Google Calendar sync: KEEP
- Notifications: KEEP
- Manual CRUD: KEEP

### 6.2 Library
- Notes: KEEP
- Quotes: KEEP
- Quote annotations: KEEP
- Journal: KEEP
- Books: KEEP
- Inventory: KEEP
- Resurfacing: KEEP

### 6.3 Optional modules
- Content Pipeline: KEEP, mas adaptado para carreira/aprendizado/projetos, não só creator.
- People CRM: KEEP
- Health: KEEP
- Routines: KEEP
- Email integration: KEEP com modo approval-first
- Mobile shortcuts: KEEP
- Observations engine: KEEP
- Finance/logistics: KEEP
- Academic module: KEEP
- Research/TCC module: KEEP
- Energy market module: KEEP

---

## 7. Tela Today

A tela Today é o coração do app.

### 7.1 Blocos obrigatórios
1. Data, semana e contexto.
2. Eventos do calendário de hoje.
3. Top 3 tarefas essenciais.
4. Deadlines próximos.
5. Inbox para triagem.
6. Projetos em risco/slipping.
7. Check-in rápido de energia.
8. Próxima ação sugerida por projeto, mas factual.
9. Resurfacing: uma nota, quote ou diário antigo.
10. Relações: aniversários, follow-ups e conversas pendentes.
11. Finanças/logística: contas vencendo, carro, documentos.
12. Health/routine: sono, treino, alimentação, remédios.
13. Academic pulse: prazos FEEC próximos.
14. Serena pulse: estudo/onboarding/mercado.

### 7.2 Regra de densidade
Today nunca deve mostrar mais do que:
- 3 tarefas essenciais
- 5 deadlines
- 5 itens de Inbox
- 3 observações
- 1 resurfaced item
- 3 follow-ups pessoais

Todo o resto fica em telas específicas.

---

## 8. Sistema de tarefas

### 8.1 Campos
- title
- notes
- status: todo, doing, waiting, done, canceled
- due_date
- due_time
- priority: low, medium, high, critical
- energy_required: low, medium, high
- context: computador, rua, celular, faculdade, casa, ligação, leitura, escrita
- domain_id
- project_id
- parent_task_id
- recurrence_rule
- reminder_offsets
- source: manual, voice, email, observation, import
- created_at
- completed_at

### 8.2 Subtarefas
Toda tarefa pode ter subtarefas.

Exemplo:
Projeto: Controle — Projeto Computacional
- Revisar LaTeX
- Conferir gráficos
- Checar especificações
- Gerar PDF
- Enviar

### 8.3 Waiting
Status "waiting" é importante para:
- respostas de professor
- resposta de recrutador
- retorno de orientador
- pendências com Nicole/família
- documentos de estágio

---

## 9. Projetos e milestones

### 9.1 Projeto
Projeto é um resultado finito.

Campos:
- name
- description
- domain_id
- status
- type: deadline, ongoing, seasonal, learning, administrative
- target_date
- start_date
- completed_at
- cadence_expected
- failure_mode
- success_definition

### 9.2 Milestones
Campos:
- project_id
- title
- status
- weight
- due_date
- completed_at

### 9.3 Slipping por tipo
Cada projeto tem ritmo próprio.

Tipos:
- Acadêmico urgente: alerta após 2 dias sem atividade se deadline < 10 dias.
- TCC: alerta após 7 dias sem atividade.
- Carreira: alerta após 10 dias.
- Relacionamento: alerta por datas e follow-ups, não produtividade.
- Saúde: alerta por ausência de check-in ou padrão de energia, não moralização.
- Sistema Lucas OS: alerta após 5 dias sem commit/atividade.
- Serena/onboarding: alerta após 4 dias sem estudo antes do início.

---

## 10. Captura por voz

### 10.1 Entradas
- Mic no app
- iOS Shortcut
- Android Shortcut
- Texto rápido
- Email forward
- Webhook
- Manual form

### 10.2 Ações parseáveis
- create_task
- complete_task
- update_task
- create_project
- update_project_status
- create_milestone
- log_activity
- create_calendar_event
- create_note
- create_quote
- create_quote_annotation
- create_journal_entry
- create_person
- create_person_fact
- log_interaction
- create_health_metric
- create_wellbeing_checkin
- create_routine_completion
- add_inventory_item
- create_expense
- create_learning_item
- create_research_reference
- update_pipeline_item
- set_resurface_weight

### 10.3 Regras
1. Se a classificação tiver baixa confiança, criar pending_capture.
2. Se houver data relativa, resolver no fuso America/Sao_Paulo.
3. Se mencionar disciplina, tentar mapear para projeto acadêmico.
4. Se mencionar Serena, energia, eólica, solar, BESS, mercado livre, mapear para Serena & Energia.
5. Se mencionar data centers, água, Nordeste, Ceará, Pecém, backhaul, mapear para TCC & Pesquisa.
6. Se mencionar "lembra de", criar tarefa ou person_fact conforme contexto.
7. Se mencionar "pensamento", "nota", "ideia", criar note.
8. Se mencionar "diário", "me sinto", "hoje eu", criar journal/check-in, não tarefa.
9. Se mencionar "gastei", criar expense.
10. Se mencionar "comprei", pode criar expense e inventory_item.

---

## 11. Inbox e pending captures

### 11.1 Inbox
Inbox é um domínio real e obrigatório.

Usos:
- tarefa sem domínio claro
- captura genérica
- ideia mal especificada
- item com baixa confiança
- tarefa sem projeto

### 11.2 Pending capture
Use pending_capture quando:
- a IA não sabe se é tarefa, nota ou diário
- há múltiplos projetos possíveis
- há pessoa com nome ambíguo
- data está confusa
- comando envolve email/calendário com risco

Pending capture aparece no Today até ser resolvido.

---

## 12. Calendário

### 12.1 Google Calendar
- Sync de eventos a cada 15 minutos.
- Criar eventos por voz.
- Editar eventos manualmente.
- Não deletar eventos sem confirmação explícita.

### 12.2 Eventos importantes
Campos:
- title
- start
- end
- location
- attendees
- source
- google_event_id
- related_project_id
- related_person_id
- travel_buffer

### 12.3 Integração com tarefas
Eventos podem gerar tarefas antes/depois:
- preparar reunião
- enviar follow-up
- revisar material
- deslocamento

---

## 13. Notas

### 13.1 Tipos
- own_thought
- reading_response
- meeting_note
- class_note
- research_note
- brainstorm
- emotional_note
- career_note
- technical_note
- observation
- other

### 13.2 Relações
Nota pode se relacionar a:
- projeto
- domínio
- pessoa
- livro
- quote
- evento
- disciplina
- empresa
- TCC reference

### 13.3 Uso esperado
Exemplos:
> "Nota pro TCC: o gargalo não é só energia, é telecom e água."

> "Nota carreira: gosto de desenvolvimento de projeto porque mistura técnica, mercado e território."

---

## 14. Quotes, livros e biblioteca

### 14.1 Books
Campos:
- title
- author
- isbn
- cover_image_url
- status: want_to_read, reading, finished, abandoned
- format
- started_at
- finished_at
- rating
- my_summary

### 14.2 Quotes
Campos:
- text
- book_id
- page_number
- chapter
- source_type
- source_reference
- source_author
- tags
- added_via
- resurface_weight
- last_surfaced_at

### 14.3 Annotations
Permite revisitar uma quote e adicionar pensamento novo meses depois.

### 14.4 Resurfacing
Todo dia aparecer:
- uma quote antiga
- uma nota antiga
- um diário antigo
- uma referência de TCC
- uma lição de carreira

---

## 15. Journal

### 15.1 Objetivo
Diário não é produtividade. É memória e regulação.

### 15.2 Campos
- entry_date
- text
- source: typed, voice, photo_ocr
- mood
- energy
- anxiety
- sleep_quality
- tags
- extracted_facts
- related_people
- related_projects
- resurface_weight

### 15.3 Check-in rápido
Campos de 1 a 5:
- energia
- humor
- ansiedade
- sono
- alimentação
- sensação de controle
- conexão social
- corpo/saúde

Texto livre:
- "o que está pesando?"
- "o que foi bom?"
- "qual a próxima coisa pequena?"

### 15.4 Extração de fatos
Se o diário mencionar:
- aniversário
- promessa
- data importante
- preocupação recorrente
- sintoma
- decisão
- frase marcante

o sistema pode sugerir criar person_fact, task, health_metric ou note.

---

## 16. People CRM

### 16.1 Objetivo
Não é networking falso. É lembrar melhor de pessoas importantes.

### 16.2 Pessoas iniciais
- Nicole
- Janete
- amigos próximos
- familiares
- orientador TCC
- professores relevantes
- colegas Agibank
- contatos Serena
- recrutadores
- colegas Unicamp

### 16.3 Campos people
- name
- relationship_type
- email
- phone
- company
- notes
- birthday
- importance
- last_interaction_at
- next_follow_up_at

### 16.4 Person facts
- aniversário
- preferência
- contexto familiar
- coisa importante que contou
- promessa
- tema sensível
- presente possível
- follow-up médico/profissional/pessoal

### 16.5 Interactions
- conversation
- message
- call
- meeting
- date
- conflict
- support
- follow_up

### 16.6 Alertas
- "Faz 14 dias que você não fala com X"
- "Aniversário de Y em 7 dias"
- "Você queria perguntar como foi a consulta de X"

Sem transformar relações em CRM frio.

---

## 17. Health, energia e rotina

### 17.1 Health
Campos:
- visits
- symptoms
- medications
- lab_panels
- lab_results
- health_documents
- workouts
- body_metrics

### 17.2 Wellbeing check-ins
Campos:
- date
- energy
- mood
- anxiety
- sleep_hours
- sleep_quality
- food_quality
- movement
- social_connection
- notes

### 17.3 Riscos
O sistema não diagnostica. Só registra e mostra padrões.

### 17.4 Uso prático para Lucas
- detectar queda de energia em semanas de prova
- entender relação entre sono e produtividade
- lembrar consultas/exames
- organizar comprovantes e documentos médicos
- construir rotina mínima durante transição Serena

---

## 18. Routines/hábitos

### 18.1 Diferença entre rotina e tarefa
Tarefa tem conclusão finita.
Rotina é recorrente e mede consistência.

### 18.2 Rotinas iniciais
- dormir antes de horário-alvo
- arrumar quarto 10 min
- revisar Today
- triagem Inbox
- leitura TCC
- estudo Serena/energia
- caminhada/treino
- organizar mochila/material
- planejamento semanal
- contato social intencional

### 18.3 Campos
- name
- frequency
- schedule
- goal_value
- active
- domain_id
- minimum_viable_version

### 18.4 Completions
- routine_id
- completed_at
- value
- notes

---

## 19. Inventory

### 19.1 Objetivo
Registrar itens relevantes, recibos, notas fiscais, garantia e manutenção.

### 19.2 Categorias
- eletrônicos
- computador
- celular
- equipamentos faculdade
- carro
- casa
- documentos
- livros
- ferramentas
- itens de alto valor

### 19.3 Campos
- category
- brand
- model
- serial_number
- purchase_date
- purchase_price
- purchase_source
- current_value_estimate
- status
- location
- photos
- receipts
- warranty_until
- notes

### 19.4 Integração
Gasto "comprei X por R$ Y" pode criar:
- expense
- inventory_item
- task de guardar nota fiscal

---

## 20. Financeiro e logística

### 20.1 Objetivo
Não é app bancário. É painel pessoal simples.

### 20.2 Entidades
- expenses
- income
- recurring_bills
- reimbursements
- benefits
- budget_categories
- financial_notes

### 20.3 Categorias iniciais
- transporte
- alimentação
- moradia
- faculdade
- cursos
- saúde
- lazer
- relacionamento
- carro
- ferramentas/projetos
- assinatura/software

### 20.4 Alertas
- conta vencendo
- gasto recorrente
- reembolso pendente
- benefício a usar
- manutenção do carro

---

## 21. Email integration

### 21.1 Modo de segurança
Approval-first por padrão.

O sistema pode:
- ler emails selecionados
- criar tarefas sugeridas
- criar notas sugeridas
- sugerir anexar arquivo
- sugerir arquivar/label

O sistema não deve:
- enviar email sozinho
- deletar email sozinho
- responder recrutador sozinho
- mover anexos sensíveis sem confirmação

### 21.2 Forward-to-capture
Encaminhar email para endereço/endpoint especial e transformar em:
- tarefa
- nota
- deadline
- pessoa
- oportunidade
- documento

### 21.3 Gmail watcher
Filtros:
- universidade
- professores
- recrutadores
- Serena
- processos seletivos
- boletos/contas
- anexos
- calendário

### 21.4 Regras
- todo email que contenha data vira candidato a deadline
- todo email de processo seletivo vira item em Carreira
- todo email de professor vira item acadêmico
- anexos PDF podem ir para documentos, mas com confirmação

---

## 22. Observations engine

### 22.1 Objetivo
Rodar diariamente e levantar padrões factuais.

### 22.2 Observações acadêmicas
- prazo em até 72h sem tarefa concluída
- disciplina sem atividade recente
- prova próxima sem plano de estudo
- nota/peso faltante

### 22.3 Observações carreira
- processo seletivo parado
- currículo sem atualização
- follow-up pendente
- vaga salva sem ação

### 22.4 Observações TCC
- referência adicionada sem resumo
- capítulo sem atividade
- citação pendente
- reunião com orientador sem follow-up

### 22.5 Observações rotina
- 3 dias sem check-in
- energia média baixa
- sono baixo antes de semana crítica
- rotina mínima falhando

### 22.6 Observações pessoas
- aniversário próximo
- follow-up prometido
- conversa importante não retomada

### 22.7 Observações sistema
- Inbox acima de 15 itens
- pending captures antigos
- projeto sem milestone
- tarefas vencidas acumuladas

---

## 23. Content/Pipeline adaptado

### 23.1 Não é só conteúdo público
Para Lucas, pipeline inclui:
- candidatura
- estudo
- TCC
- projeto técnico
- artigo/post
- apresentação
- relatório
- narrativa profissional
- publicação LinkedIn
- repositório GitHub

### 23.2 Status
- idea
- captured
- researching
- outlining
- drafting
- revising
- ready
- submitted/published
- archived

### 23.3 Exemplos
- "Post LinkedIn sobre entrada na Serena"
- "Resumo do mercado livre de energia"
- "Artigo pessoal sobre data centers sustentáveis"
- "Repositório Lucas OS"
- "Portfólio de projetos Unicamp"

---

## 24. Módulo acadêmico

### 24.1 Entidades
- courses
- assignments
- exams
- grades
- professors
- academic_events
- course_notes

### 24.2 Course fields
- code
- name
- professor
- semester
- weight_policy
- current_grade
- required_grade
- status

### 24.3 Assignment fields
- course_id
- title
- due_date
- weight
- status
- submission_link
- related_project_id

### 24.4 Grade tracking
Registrar:
- nota
- peso
- média parcial
- nota necessária
- incertezas

### 24.5 Integração com Today
Mostrar:
- próximas entregas
- provas
- risco acadêmico
- tarefas acadêmicas essenciais

---

## 25. Módulo TCC & Pesquisa

### 25.1 Research references
Campos:
- title
- authors
- year
- source_type
- file_path/url
- abstract
- relevance
- tags
- cited_in_sections
- summary
- key_quotes
- status: unread, skimmed, read, summarized, cited

### 25.2 Research themes
- energia
- água
- telecom
- território
- impacto social
- governança
- data centers
- Nordeste
- Ceará/Pecém
- semiárido
- BESS
- refrigeração
- PUE/WUE/CUE

### 25.3 TCC sections
- Introdução
- Sustentabilidade técnica
- Energia
- Água
- Telecom
- Brasil/Nordeste
- Impactos sociais
- Conclusão

### 25.4 Comandos úteis
> "Adiciona referência pro TCC: BNDES 2024 sobre infraestrutura computacional."

> "Nota pro capítulo água: dessalinização aumenta demanda energética."

> "Marca Young 2026 como citado em governança."

---

## 26. Módulo Serena & Energia

### 26.1 Objetivo
Acelerar aprendizado prático para estágio em desenvolvimento de projetos.

### 26.2 Entidades
- energy_market_notes
- companies
- projects
- technologies
- regulations
- acronyms
- learning_items
- sector_news
- contacts

### 26.3 Temas
- ACL/mercado livre
- PPAs
- project finance
- eólica
- solar
- BESS
- licenciamento
- conexão à rede
- subestações
- transmissão
- viabilidade técnico-comercial
- ONS/ANEEL/CCEE/EPE
- data centers como carga
- hidrogênio verde
- infraestrutura sustentável

### 26.4 Pulse semanal
Toda semana:
- o que aprendi
- termos novos
- pessoas conhecidas
- dúvidas para perguntar
- temas para estudar
- relação com TCC/carreira

---

## 27. Dados principais — SQL conceitual

### 27.1 Core
- domains
- projects
- milestones
- tasks
- activity_log
- calendar_events
- notifications
- pending_captures
- capture_tokens
- app_settings

### 27.2 Library
- notes
- books
- quotes
- quote_annotations
- journal_entries
- resurfacing_seen
- documents

### 27.3 People
- people
- person_facts
- person_interactions
- relationship_followups

### 27.4 Health
- health_visits
- health_metrics
- lab_panels
- lab_results
- medications
- symptoms
- workouts
- wellbeing_checkins
- health_documents

### 27.5 Routines
- routines
- routine_completions
- routine_streaks

### 27.6 Inventory/finance
- inventory_items
- receipts
- warranties
- expenses
- income
- recurring_bills
- reimbursements
- budget_categories

### 27.7 Email/integrations
- email_messages_index
- email_rules
- email_suggested_actions
- integration_accounts
- action_log

### 27.8 Academic
- academic_courses
- academic_assignments
- academic_exams
- academic_grades
- academic_notes

### 27.9 Research/TCC
- research_references
- research_notes
- research_quotes
- tcc_sections
- tcc_section_references

### 27.10 Energy/Serena
- energy_notes
- energy_acronyms
- energy_companies
- energy_projects
- energy_market_events
- learning_items

### 27.11 Pipeline
- pipeline_items
- pipeline_templates
- pipeline_derivatives

### 27.12 Observations
- observations
- observation_rules
- observation_feedback

---

## 28. Fases de construção

### Fase 0 — Preparação
- Criar repositório
- Definir stack final
- Criar Supabase
- Criar variáveis de ambiente
- Criar README
- Criar SCOPE.md
- Criar backlog técnico

### Fase 1 — Spine operacional
Entregáveis:
- Auth
- Layout
- Domains
- Projects
- Milestones
- Tasks
- Inbox
- Today básico
- CRUD manual
- Seed inicial com domínios/projetos do Lucas

### Fase 2 — Captura e IA
Entregáveis:
- /api/capture
- parser estruturado
- pending_captures
- voice capture web
- logs de parsing
- confirmação ao usuário
- testes de comandos

### Fase 3 — Calendar e mobile
Entregáveis:
- Google Calendar OAuth
- sync eventos
- criar evento por voz
- iOS/Android shortcuts
- capture tokens
- PWA install

### Fase 4 — Library
Entregáveis:
- Notes
- Books
- Quotes
- Annotations
- Journal
- Resurfacing

### Fase 5 — Academic + TCC
Entregáveis:
- Courses
- Assignments
- Exams
- Grades
- Research references
- TCC sections
- TCC notes
- Academic/TCC cards no Today

### Fase 6 — Serena + carreira
Entregáveis:
- Energy notes
- Acronyms
- Learning items
- Companies
- Pipeline de carreira
- Processos seletivos
- Pulse semanal Serena

### Fase 7 — People + routines + health
Entregáveis:
- People CRM
- Person facts
- Interactions
- Routines
- Wellbeing check-ins
- Health records

### Fase 8 — Finance + inventory
Entregáveis:
- Expenses
- Bills
- Inventory
- Receipts
- Warranties
- Car/logistics

### Fase 9 — Email integration
Entregáveis:
- Gmail OAuth
- email index
- forward-to-capture
- suggested actions
- approval-first rules
- attachment routing com confirmação

### Fase 10 — Observations engine
Entregáveis:
- rules engine
- nightly job
- slippage por tipo
- observations no Today
- feedback para calibrar falso positivo

### Fase 11 — Polish e hardening
Entregáveis:
- backups
- export
- mobile UX
- permissões
- logs
- testes
- performance
- design final

---

## 29. Prompt de kickoff para Claude Code

Cole isto no Claude Code dentro da pasta do projeto, com este arquivo salvo como SCOPE.md:

```text
Estou construindo o Lucas OS, um Personal Operations Dashboard full-scope e self-hosted para organizar minha vida acadêmica, carreira, TCC, Serena Energia, saúde, rotina, relações, biblioteca, finanças, inventário, email e observações.

Leia o SCOPE.md completo antes de escrever qualquer código.

Decisão de produto:
- Não quero MVP minimalista.
- Quero todos os módulos do escopo.
- Porém quero construir em fases, com feature flags e commits pequenos.
- A Fase 1 precisa entregar a espinha operacional: auth, layout, domains, projects, milestones, tasks, Inbox, Today básico e seed inicial.
- Não avance para integrações externas antes de a Fase 1 estar funcional.

Regras:
1. Use Next.js App Router, TypeScript, Tailwind, Supabase e Node/Hono ou API routes.
2. Use banco Postgres no Supabase.
3. Escreva migrations claras.
4. Crie seed com meus domínios e projetos iniciais.
5. Tudo que for incerto deve cair em Inbox ou pending_captures.
6. Não crie ação autônoma sensível sem modo approval-first.
7. Depois de cada parte funcional, proponha um commit git claro.
8. Explique comandos que eu preciso rodar no terminal.
9. Antes de implementar uma tabela grande, mostre o schema e peça validação rápida.
10. Priorize confiabilidade sobre beleza.

Comece:
1. Leia SCOPE.md.
2. Gere um plano técnico de implementação da Fase 1.
3. Crie a estrutura inicial do projeto.
4. Crie o schema inicial para domains, projects, milestones, tasks, notifications e app_settings.
5. Crie os seeds iniciais do Lucas.
6. Crie a primeira tela Today.
```

---

## 30. Test prompts iniciais para captura

Use estes prompts para testar o parser depois da Fase 2:

### Acadêmico
- "Adiciona tarefa de revisar o projeto de Controle amanhã às três."
- "Cria deadline da prova de Embarcados para 17 de julho."
- "Nota de aula: o DAC com DMA usa timer como gatilho."
- "Marca relatório de Lab de Máquinas como pendente."

### TCC
- "Nota pro TCC: data center no Nordeste depende de energia, água e backhaul."
- "Adiciona referência BNDES 2024 em telecom e data centers."
- "Cria tarefa para revisar capítulo de água domingo."

### Serena
- "Adiciona termo PPA no dicionário de energia."
- "Cria tarefa de estudar mercado livre de energia na quarta."
- "Nota Serena: desenvolvimento de projetos mistura viabilidade técnica, conexão e licenciamento."

### Carreira
- "Cria projeto atualizar LinkedIn para energia até agosto."
- "Adiciona tarefa de revisar currículo para Siemens Energy."
- "Salva oportunidade IAESTE como candidatura em análise."

### Vida
- "Lembra de pagar o estacionamento amanhã."
- "Registra gasto de 32 reais com almoço."
- "Comprei um cabo USB por 45 reais, guarda como item."

### Saúde/rotina
- "Check-in: energia baixa, dormi mal, ansiedade três de cinco."
- "Marca rotina de arrumar o quarto como feita."
- "Registra treino leve hoje."

### Relações
- "Lembra de mandar mensagem para Janete no aniversário."
- "Registra que a Nicole estava preocupada com a consulta."
- "Cria follow-up para perguntar como foi a semana dela sexta."

---

## 31. Critérios de sucesso

O Lucas OS estará funcionando quando:

1. Lucas capturar coisas por voz diariamente.
2. Inbox for triado pelo menos 3 vezes por semana.
3. Today for aberto de manhã ou antes de estudar/trabalhar.
4. Prazos acadêmicos aparecerem antes de virarem crise.
5. TCC tiver referências e notas conectadas.
6. Serena tiver trilha de aprendizado e dicionário próprio.
7. Relações importantes gerarem lembretes humanos, não mecânicos.
8. Rotina e energia mostrarem padrões úteis.
9. Email gerar sugestões, não caos.
10. O sistema reduzir carga mental em vez de aumentar.

---

## 32. Anti-requisitos

O sistema não deve:
- virar rede social
- virar coach motivacional
- virar prontuário médico diagnóstico
- enviar emails sensíveis sozinho
- deletar dados sem confirmação
- esconder tarefas incertas
- exigir preenchimento perfeito
- depender de beleza visual para ser útil
- obrigar Lucas a virar escravo do app

---

## 33. Primeira semana de uso esperada

Mesmo antes de estar completo, o sistema deve ser usado para:

- capturar tarefas acadêmicas
- organizar fim de semestre
- registrar ideias do TCC
- registrar estudos para Serena
- abrir Today diariamente
- triagem Inbox
- check-in de energia
- alguns lembretes pessoais

---

## 34. Observação final

Este projeto é grande de propósito. A ambição está aceita.

A diferença entre um projeto grande e um projeto perdido será:
- fases claras
- commits pequenos
- feature flags
- Inbox desde o começo
- approval-first para integrações sensíveis
- uso real desde a Fase 1
- honestidade sobre o que está ou não funcionando

Fim.
