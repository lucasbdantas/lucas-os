# Phase 2 AI Capture Completion

Date: 2026-06-29

## Relevant Commits

- `51cda4b feat: add manual pending captures`
- `6683b4b feat: triage captures into tasks`
- `422c6ef feat: add deterministic capture preview`
- `e854922 feat: add AI capture preview`

## Deterministic Capture

The deterministic parser lives in `src/lib/captures/simple-parser.ts`.

It recognizes one-line captures with these prefixes:

- `task:`
- `tarefa:`
- `todo:`
- `lembrete:`

The parser is case-insensitive, trims the raw text, removes only the recognized prefix, trims the resulting title, and refuses empty titles. Multiple non-empty lines do not generate automatic preview; they remain suitable for `pending_capture`.

## AI Preview

AI preview is available from `/capture` through the "Sugerir com IA" action.

The AI receives raw text plus minimal context:

- active domains and Inbox;
- active/waiting projects;
- current date;
- timezone `America/Sao_Paulo`.

The model returns a structured suggestion only. The app validates the response with Zod, maps domain/project names to real IDs, rejects low-confidence or inconsistent suggestions, and shows an editable preview. Confirming the preview creates a task with `source = manual`.

## Environment Variables

- `OPENAI_API_KEY`: server-only API key for OpenAI. Never expose it with `NEXT_PUBLIC`.
- `OPENAI_MODEL`: optional model override for capture preview.

Current default model:

- `gpt-4.1-nano`

## Safety Rules

- AI never creates a task automatically.
- The user must always confirm before any task is created.
- AI output is treated as untrusted until schema validation and domain/project mapping pass.
- Low-confidence, invalid, ambiguous, or unsupported AI results fall back to pending capture.
- `.env.local` must never enter Git.
- No capture text or secrets should be logged.

## Current Limitations

- AI only suggests `task` or `none`.
- AI does not create calendar events, emails, notes, people, health records, finance records, or integrations.
- Domain and project suggestions must exactly match existing names.
- There is no voice capture yet.
- There is no public `/api/capture` endpoint yet.
- Mobile shortcuts are not implemented.
- Automated tests are unit-level only; there is no Playwright coverage yet.

## Possible Next Steps

- Mobile shortcut capture.
- Voice capture.
- Better Today review surface for captures and AI suggestions.
- Notifications/audit feed.
- Advanced task editing.
- Broader automated coverage for server actions and route behavior.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test`
