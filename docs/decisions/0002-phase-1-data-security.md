# Decision 0002: Phase 1 Data Security

Date: 2026-06-29

## Decision

Phase 1 uses `user_id` on every operational table, foreign keys to
`auth.users(id)`, and row level security policies that restrict select, insert,
update, and delete operations to rows where `auth.uid() = user_id`.

We will not add composite foreign keys yet to prove that every referenced
`domain_id`, `project_id`, and `task.user_id` belongs to the same user.

## Rationale

RLS protects access by user at the database boundary, and the application will
always write rows using the authenticated user. Composite foreign keys would add
extra indexes and schema complexity before Phase 1 has real usage patterns.

## Future Reinforcement

A future hardening pass can add composite foreign keys or database triggers to
guarantee that `domain_id`, `project_id`, parent tasks, and `task.user_id` all
belong to the same Supabase user.
