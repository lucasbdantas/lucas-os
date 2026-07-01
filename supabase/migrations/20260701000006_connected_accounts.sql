create type connected_account_provider as enum ('google');
create type connected_account_status as enum ('active', 'revoked', 'error');

create table connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider connected_account_provider not null default 'google',
  provider_account_id text not null,
  account_email text not null,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  scopes jsonb not null default '[]'::jsonb,
  expires_at timestamptz,
  status connected_account_status not null default 'active',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index connected_accounts_user_provider_account_unique
on connected_accounts (user_id, provider, provider_account_id);

create index connected_accounts_user_provider_idx
on connected_accounts (user_id, provider);

create index connected_accounts_user_status_idx
on connected_accounts (user_id, status);

create trigger connected_accounts_set_updated_at
before update on connected_accounts
for each row execute function set_updated_at();

alter table connected_accounts enable row level security;

create policy "connected_accounts_select_own"
on connected_accounts for select
using (auth.uid() = user_id);

create policy "connected_accounts_insert_own"
on connected_accounts for insert
with check (auth.uid() = user_id);

create policy "connected_accounts_update_own"
on connected_accounts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "connected_accounts_delete_own"
on connected_accounts for delete
using (auth.uid() = user_id);
