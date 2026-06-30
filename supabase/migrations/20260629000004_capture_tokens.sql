create table if not exists public.capture_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(120) not null,
  token_hash text not null,
  token_prefix varchar(32) not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists capture_tokens_token_hash_unique
  on public.capture_tokens(token_hash);

create index if not exists capture_tokens_user_created_idx
  on public.capture_tokens(user_id, created_at desc);

create index if not exists capture_tokens_user_active_idx
  on public.capture_tokens(user_id, revoked_at);

alter table public.capture_tokens enable row level security;

create policy "capture_tokens_select_own"
  on public.capture_tokens
  for select
  using (auth.uid() = user_id);

create policy "capture_tokens_insert_own"
  on public.capture_tokens
  for insert
  with check (auth.uid() = user_id);

create policy "capture_tokens_update_own"
  on public.capture_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.create_pending_capture_from_token(
  p_token_hash text,
  p_raw_text text,
  p_source text default 'webhook'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_source public.pending_capture_source;
  v_raw_text text;
begin
  v_raw_text := btrim(coalesce(p_raw_text, ''));

  if p_token_hash is null or length(p_token_hash) = 0 then
    return false;
  end if;

  if length(v_raw_text) = 0 or length(v_raw_text) > 5000 then
    return false;
  end if;

  if p_source in ('ios_shortcut', 'android_shortcut', 'webhook') then
    v_source := p_source::public.pending_capture_source;
  else
    v_source := 'webhook'::public.pending_capture_source;
  end if;

  select user_id
    into v_user_id
  from public.capture_tokens
  where token_hash = p_token_hash
    and revoked_at is null
  limit 1;

  if v_user_id is null then
    return false;
  end if;

  insert into public.pending_captures (
    user_id,
    raw_text,
    source,
    status,
    captured_at
  )
  values (
    v_user_id,
    v_raw_text,
    v_source,
    'pending',
    now()
  );

  update public.capture_tokens
    set last_used_at = now()
  where token_hash = p_token_hash
    and revoked_at is null;

  return true;
end;
$$;

revoke all on function public.create_pending_capture_from_token(text, text, text) from public;
grant execute on function public.create_pending_capture_from_token(text, text, text) to anon;
grant execute on function public.create_pending_capture_from_token(text, text, text) to authenticated;
