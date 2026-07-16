# System Health & Setup V1

`/settings/health` apresenta checks seguros para Supabase/Auth, scopes Google, OpenAI opcional, Web Push, scheduler, backup e modo de persistência do Daily Planning.

Nenhum valor de env, token OAuth, subscription endpoint ou secret é renderizado. Os checks indicam apenas estado agregado e um link de configuração.

O checklist cobre Google, Gmail, Calendar, push, scheduler, OpenAI, primeiro backup e primeiro plano diário. Ele também está acessível pela Command Palette usando **System Health** ou **Setup Checklist**.

Limitações: o check do scheduler confirma somente a presença de configuração server-side; não executa o cron. O check de backup confirma disponibilidade da rota, não a existência de um arquivo guardado fora do app.
