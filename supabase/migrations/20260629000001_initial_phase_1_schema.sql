create type task_status as enum ('todo', 'doing', 'waiting', 'done', 'canceled');
create type task_priority as enum ('low', 'medium', 'high', 'critical');
create type task_energy_required as enum ('low', 'medium', 'high');
create type task_source as enum ('manual', 'voice', 'email', 'observation', 'import');
create type project_status as enum ('active', 'waiting', 'completed', 'paused', 'canceled');
create type project_type as enum ('deadline', 'ongoing', 'seasonal', 'learning', 'administrative');
create type notification_status as enum ('unread', 'read', 'dismissed');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(120) not null,
  description text,
  color varchar(32),
  icon varchar(64),
  is_system boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index domains_user_name_unique on domains (user_id, name);
create index domains_user_active_idx on domains (user_id, active);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_id uuid not null references domains(id) on delete restrict,
  name varchar(160) not null,
  description text,
  status project_status not null default 'active',
  type project_type not null default 'deadline',
  target_date date,
  start_date date,
  completed_at timestamptz,
  cadence_expected varchar(120),
  failure_mode text,
  success_definition text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_status_idx on projects (user_id, status);
create index projects_domain_idx on projects (domain_id);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title varchar(180) not null,
  status task_status not null default 'todo',
  weight integer not null default 1,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_project_idx on milestones (project_id);
create index milestones_user_status_idx on milestones (user_id, status);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_id uuid not null references domains(id) on delete restrict,
  project_id uuid references projects(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete cascade,
  title varchar(220) not null,
  notes text,
  status task_status not null default 'todo',
  due_date date,
  due_time time,
  priority task_priority not null default 'medium',
  energy_required task_energy_required,
  context varchar(80),
  recurrence_rule text,
  reminder_offsets jsonb not null default '[]'::jsonb,
  source task_source not null default 'manual',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_status_idx on tasks (user_id, status);
create index tasks_due_date_idx on tasks (user_id, due_date);
create index tasks_domain_idx on tasks (domain_id);
create index tasks_project_idx on tasks (project_id);
create index tasks_parent_task_idx on tasks (parent_task_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type varchar(80) not null,
  title varchar(180) not null,
  body text,
  status notification_status not null default 'unread',
  source_ref varchar(160),
  source_url text,
  undo_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notifications_user_status_idx on notifications (user_id, status);
create index notifications_created_at_idx on notifications (created_at);

create table app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key varchar(120) not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index app_settings_user_key_unique on app_settings (user_id, key);

create trigger domains_set_updated_at
before update on domains
for each row execute function set_updated_at();

create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();

create trigger milestones_set_updated_at
before update on milestones
for each row execute function set_updated_at();

create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

create trigger notifications_set_updated_at
before update on notifications
for each row execute function set_updated_at();

create trigger app_settings_set_updated_at
before update on app_settings
for each row execute function set_updated_at();

alter table domains enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;
alter table app_settings enable row level security;

create policy "domains_select_own" on domains
for select using (auth.uid() = user_id);

create policy "domains_insert_own" on domains
for insert with check (auth.uid() = user_id);

create policy "domains_update_own" on domains
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "domains_delete_own" on domains
for delete using (auth.uid() = user_id);

create policy "projects_select_own" on projects
for select using (auth.uid() = user_id);

create policy "projects_insert_own" on projects
for insert with check (auth.uid() = user_id);

create policy "projects_update_own" on projects
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "projects_delete_own" on projects
for delete using (auth.uid() = user_id);

create policy "milestones_select_own" on milestones
for select using (auth.uid() = user_id);

create policy "milestones_insert_own" on milestones
for insert with check (auth.uid() = user_id);

create policy "milestones_update_own" on milestones
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "milestones_delete_own" on milestones
for delete using (auth.uid() = user_id);

create policy "tasks_select_own" on tasks
for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on tasks
for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on tasks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_delete_own" on tasks
for delete using (auth.uid() = user_id);

create policy "notifications_select_own" on notifications
for select using (auth.uid() = user_id);

create policy "notifications_insert_own" on notifications
for insert with check (auth.uid() = user_id);

create policy "notifications_update_own" on notifications
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_own" on notifications
for delete using (auth.uid() = user_id);

create policy "app_settings_select_own" on app_settings
for select using (auth.uid() = user_id);

create policy "app_settings_insert_own" on app_settings
for insert with check (auth.uid() = user_id);

create policy "app_settings_update_own" on app_settings
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "app_settings_delete_own" on app_settings
for delete using (auth.uid() = user_id);
