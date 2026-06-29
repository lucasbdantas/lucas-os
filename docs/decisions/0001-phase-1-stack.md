# Decision 0001: Phase 1 Stack

Date: 2026-06-29

## Decision

Lucas OS Phase 1 will use Next.js App Router, TypeScript, Tailwind CSS, npm,
Supabase, and Drizzle.

## Rationale

The project starts with a small operational spine and should keep migrations,
RLS policies, and schema evolution explicit. Drizzle keeps the database layer
close to SQL while still giving TypeScript support.

## Scope Guard

Phase 1 does not include Google Calendar, Gmail, voice capture, OpenAI parsing,
Health, Finance, People CRM, advanced TCC/Serena modules, or Observations.
