create type pending_capture_source as enum (
  'manual',
  'web',
  'ios_shortcut',
  'android_shortcut',
  'voice',
  'email',
  'webhook'
);

create type pending_capture_status as enum (
  'pending',
  'resolved',
  'dismissed',
  'expired'
);

create table pending_captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null,
  source pending_capture_source not null default 'manual',
  captured_at timestamptz not null default now(),
  parsed_intent jsonb not null default '{}'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  status pending_capture_status not null default 'pending',
  resolved_at timestamptz,
  dismissed_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pending_captures_user_status_captured_idx
on pending_captures (user_id, status, captured_at);

create index pending_captures_user_captured_idx
on pending_captures (user_id, captured_at);

create trigger pending_captures_set_updated_at
before update on pending_captures
for each row execute function set_updated_at();

alter table pending_captures enable row level security;

create policy "pending_captures_select_own" on pending_captures
for select using (auth.uid() = user_id);

create policy "pending_captures_insert_own" on pending_captures
for insert with check (auth.uid() = user_id);

create policy "pending_captures_update_own" on pending_captures
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
