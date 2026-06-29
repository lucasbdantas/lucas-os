# Phase 1 Review

Date: 2026-06-29

## Ready

- Supabase Auth shell is implemented for login/logout.
- `/` redirects to `/today` for authenticated users and `/login` otherwise.
- Operational routes are protected by the authenticated app layout and/or `requireSession()`.
- Seeded data is read through the Supabase cookie-backed client, so RLS is exercised in app pages.
- Manual CRUD is available for domains, projects, milestones, and tasks within Phase 1 limits.
- Inbox is a protected system domain and remains always active.
- Today shows basic operational counts, priority tasks, project deadlines, and Inbox state.
- Settings shows the authenticated user email and Supabase Auth connection state without exposing secrets.

## Reviewed

- Routes: `/today`, `/domains`, `/projects`, `/tasks`, `/inbox`, `/settings`, `/login`.
- Server actions for domains, projects, milestones, and tasks use `requireSession()` and write `user.id`.
- App pages do not use `DATABASE_URL`; direct database access remains limited to scripts/migrations/seed.
- Domain and project forms require a domain where needed.
- Task creation falls back to Inbox when no domain is selected.
- Project, milestone, and task status actions are scoped by `user_id`.
- Empty states and friendly form-level errors are present for the main Phase 1 surfaces.

## Fixes Made

- Projects and tasks now use all user domains for display names while keeping forms limited to active domains plus Inbox where appropriate.
- Domain color validation now matches the database schema limit of 32 characters.

## Pending Before Phase 2

- Notifications and app settings exist in schema but do not yet have a manual UI.
- Task project options are not dynamically filtered client-side after changing the selected domain.
- There is no edit flow for existing tasks/projects beyond status updates and simple domain detail edits.
- There are no automated route/action tests yet; QA is currently lint, build, and manual browser checks.
- Capture, AI parsing, voice, external integrations, and advanced modules remain intentionally out of scope.

## QA

- Run `npm run lint`.
- Run `npm run build`.
- Manually verify login, redirects, and CRUD flows in `/domains`, `/projects`, `/tasks`, and `/inbox`.

## Commit Recommended

`chore: review phase 1 readiness`
