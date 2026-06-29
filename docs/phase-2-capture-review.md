# Phase 2 Capture Review

Date: 2026-06-29

## What Works

- `/capture` is protected by the authenticated app route group.
- Manual text can be saved as `pending_capture` with `source = manual`.
- Pending captures can be marked as `resolved`, `dismissed`, or `expired`.
- Pending captures can be manually converted into tasks with `source = import`.
- Deterministic capture preview can create tasks with `source = manual` after explicit confirmation.
- `/today` shows the count of pending captures.
- Tasks created from capture flows appear in `/tasks`.

## Deterministic Parser

- The parser lives in `src/lib/captures/simple-parser.ts`.
- It is pure and deterministic.
- It trims raw input, is case-insensitive, and recognizes only one-line captures with these prefixes:
  - `task:`
  - `tarefa:`
  - `todo:`
  - `lembrete:`
- It removes only the recognized prefix and trims the resulting title.
- Empty titles, such as `task:`, return `kind = "none"`.
- Multiple non-empty lines do not generate automatic preview.

## Pending Captures

- `pending_captures` stores raw text for later triage.
- The app uses the Supabase cookie-backed client, so RLS is exercised.
- Captures remain in the database; they are not deleted by the UI.
- Low-confidence or unsupported capture types should stay as pending captures.

## Manual Triage To Task

- A pending capture can be converted into a task by explicit user action.
- The server action validates that the capture belongs to the authenticated user and is still pending.
- If no domain is selected, Inbox fallback happens on the server.
- Selected domains and projects are validated server-side.
- The capture is marked `resolved` and receives `resolved_at`.
- `parsed_intent` stores a small audit pointer to the task.

## Risks Before AI

- A parser that over-interprets text could create misleading task previews.
- Multi-line captures may contain several unrelated actions and must not be merged into one task.
- Domain/project guesses can be wrong and should only use existing user data.
- Any future AI output must be treated as untrusted until validated server-side.

## AI Safety Limits

- AI must never create, update, delete, or resolve records automatically.
- AI may only generate preview suggestions.
- The user must explicitly confirm before a task is created.
- If confidence is low, ambiguous, invalid, or unsupported, the capture should remain saveable as pending.
- `OPENAI_API_KEY` must remain server-only and must not use `NEXT_PUBLIC`.
- No raw capture text should be logged.
- No Google Calendar, Gmail, voice, public capture API, shortcuts, or external integrations are part of this step.

## AI Preview Recommendation

- Add a server-only OpenAI client under `src/lib/ai/openai.ts`.
- Add a capture AI parser under `src/lib/captures/ai-parser.ts`.
- Use structured output validated by Zod.
- Send only minimal context: active domains, active/waiting projects, current date, and timezone.
- Map suggested names back to real domain/project IDs before showing preview defaults.
- Reuse the existing confirmed task creation action with `source = manual`.

## Verification Checklist

- `/capture` redirects to `/login` without a session through the app layout.
- Text without a prefix can be saved as pending.
- `task:`, `tarefa:`, `todo:`, and `lembrete:` show deterministic preview.
- Prefix detection is case-insensitive.
- `task:` with no title does not show valid task preview.
- Multiple non-empty lines do not show automatic preview.
- Deterministic preview creates tasks with `source = manual`.
- Pending capture triage creates tasks with `source = import`.
- Inbox fallback happens server-side.
- No app page/component/action uses `DATABASE_URL`.
- No OpenAI/API call existed before the AI preview implementation.
