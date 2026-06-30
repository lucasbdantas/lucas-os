# Current System State

Checkpoint after Phase 1, Phase 2 capture/AI preview, Today V2, Task Edit V1, and Project Next Action V1.

## Current functionality

- Supabase Auth email/password login and logout are implemented.
- `/` redirects authenticated users to `/today` and unauthenticated users to `/login`.
- Protected app routes use the Supabase server client with cookies/session and RLS:
  - `/today`
  - `/capture`
  - `/domains`
  - `/projects`
  - `/tasks`
  - `/inbox`
  - `/settings`
- Phase 1 operational spine is available:
  - domains CRUD without delete;
  - projects CRUD and basic status changes;
  - milestones create/done/canceled;
  - tasks create/list/done/canceled/edit;
  - Inbox task flow;
  - settings page with authenticated user email.
- Task Edit V1 is available:
  - edit title, notes, domain, optional project, due date, due time, priority, energy, context, and status;
  - server-side validation confirms task ownership, valid active domain or Inbox, valid project ownership, and project/domain consistency;
  - saving revalidates `/tasks`, `/today`, `/inbox`, and `/projects`.
- Project Next Action V1 is available:
  - `/today` shows `Criar próxima ação` for active projects without open tasks;
  - `/projects` shows `Criar próxima ação` for `active` and `waiting` projects;
  - links open `/tasks` with safe `domain`/`project` query params and prefilled domain/project;
  - `/tasks?edit=<taskId>#edit-task` keeps priority over task creation defaults;
  - invalid or unauthorized domain/project params are ignored and the normal task form is shown.
- Capture flow is available:
  - manual pending captures;
  - deterministic parser preview for `task:`, `tarefa:`, `todo:`, and `lembrete:`;
  - multiline captures are not auto-previewed and can be saved as pending;
  - AI preview is optional when `OPENAI_API_KEY` is configured;
  - AI preview uses `OPENAI_MODEL` with default `gpt-4.1-nano`;
  - AI never creates tasks automatically; human confirmation is required.
- Today V2 is available:
  - pending capture count and link to `/capture`;
  - overdue open tasks;
  - tasks due today;
  - tasks due in the next 7 days;
  - active/waiting projects with target date in the next 14 days;
  - active projects without any open associated task;
  - quick links to Capture, Tasks, and Projects.

## Main checkpoints

- `e2e6bc1 feat: add project next action flow`
- `ec64206 feat: add task edit v1`
- `d30e1fb chore: clarify service role configuration`
- `f3294d0 docs: add current system state checkpoint`
- `9eb624e feat: add today v2 operational dashboard`
- `0eb48c2 test: add capture parser coverage`
- `e854922 feat: add AI capture preview`
- `422c6ef feat: add deterministic capture preview`
- `6683b4b feat: triage captures into tasks`
- `51cda4b feat: add manual pending captures`
- `04505b5 docs: defer notifications and app settings UI`
- `6f694a0 docs: add phase 1 completion summary`

## Environment variables

Required for the app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required for local database scripts, migrations, and seed only:

- `DATABASE_URL`
- `SEED_USER_ID`

Optional for AI capture preview:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`, defaulting to `gpt-4.1-nano`

Security notes:

- `.env.local` must stay out of Git.
- App pages, components, and actions should not use `DATABASE_URL`.
- The app should not expose `OPENAI_API_KEY` to client components.
- `SUPABASE_SERVICE_ROLE_KEY` is not required for the current app and should not be configured for normal local usage.

## Validation performed

- `git status --short`
- `git log --oneline -8`
- checked that `feat: add task edit v1` exists;
- checked that `feat: add project next action flow` exists;
- checked that `.env.local` and local dev logs are not tracked;
- checked that `DATABASE_URL` is not referenced in app pages/components/actions;
- checked that `OPENAI_API_KEY` is not referenced in client-facing app/components;
- checked that tests do not reference or call OpenAI;
- checked protected routes use `requireSession`/Supabase cookies where applicable.

Commands for final validation:

```bash
npm run lint
npm run build
npm run test
```

## Known limitations

- No public capture API exists yet.
- No voice capture exists yet.
- No mobile shortcut flow exists yet.
- No Google Calendar, Gmail, People, Health, Finance, advanced TCC, advanced Serena, or Observations engine exists yet.
- Notifications and app settings tables exist, but their manual UI is intentionally deferred.
- Capture AI preview is advisory only and still needs human confirmation.
- Capture-to-task creation is not modeled as a database transaction from the UI layer; if an unexpected write failure occurs after task creation, manual cleanup may be needed.
- Today V2 is intentionally simple and does not include scoring, drag and drop, charts, recurrence logic, or automatic planning.
- Project next action uses URL query defaults instead of a dedicated project action route.
- Task editing is basic and does not yet include advanced subtasks, recurrence, reminders, or bulk edits.
- There are unit tests for parser behavior, but no Playwright or end-to-end browser tests yet.

## Technical risks

- Date logic in Today V2 is app-side and based on the America/Sao_Paulo calendar day. This is fine for current single-user use, but timezone preferences should eventually move into `app_settings`.
- Project "without next action" detection depends on the current open task statuses: `todo`, `doing`, and `waiting`.
- AI preview depends on OpenAI availability and model support; failures should remain friendly and non-blocking.
- Future scripts that truly need elevated Supabase access should document that separately and must not leak service role keys into client or app runtime.
- Task/project relationship consistency is enforced in app server actions, but older data should still be treated carefully if edited outside the app.

## Recommended next steps

1. Manually smoke-test Task Edit V1 and Project Next Action V1 with real seeded data.
2. Add a small browser/E2E test pass for auth-protected route behavior and the core task/project flows when ready for Playwright.
3. Implement mobile/manual capture shortcut flow before voice.
4. Add voice capture only after the text capture path stays stable.
5. Improve Today with focused action ordering only after more real usage data exists.
6. Revisit notifications as an audit feed once capture and task/project actions generate more operational events.
7. Add `app_settings` only when there are real preferences such as timezone, Today density, capture defaults, or integration settings.
8. Improve task editing with recurrence, reminders, subtasks, or bulk operations before adding heavier integrations.
