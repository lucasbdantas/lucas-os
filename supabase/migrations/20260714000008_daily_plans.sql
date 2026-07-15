create type daily_plan_feedback_target_type as enum (
  'priority',
  'risk',
  'reschedule',
  'triage',
  'next_step'
);

create type daily_plan_feedback_rating as enum (
  'useful',
  'not_useful',
  'wrong',
  'done',
  'ignored'
);

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  timezone varchar(80) not null,
  generated_at timestamptz not null default now(),
  generation integer not null default 1 check (generation >= 1),
  summary text not null,
  priorities jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  reschedule_suggestions jsonb not null default '[]'::jsonb,
  triage_suggestions jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  model varchar(160) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_plans_user_date_timezone_unique unique (user_id, plan_date, timezone)
);

create index daily_plans_user_generated_idx
on daily_plans (user_id, generated_at desc);

create trigger daily_plans_set_updated_at
before update on daily_plans
for each row execute function set_updated_at();

create table daily_plan_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_plan_id uuid not null references daily_plans(id) on delete cascade,
  plan_generation integer not null check (plan_generation >= 1),
  target_type daily_plan_feedback_target_type not null,
  target_index integer not null check (target_index >= 0),
  rating daily_plan_feedback_rating not null,
  note text,
  created_at timestamptz not null default now(),
  constraint daily_plan_feedback_target_unique
    unique (user_id, daily_plan_id, plan_generation, target_type, target_index)
);

create index daily_plan_feedback_user_created_idx
on daily_plan_feedback (user_id, created_at desc);

create index daily_plan_feedback_plan_generation_idx
on daily_plan_feedback (daily_plan_id, plan_generation);

alter table daily_plans enable row level security;
alter table daily_plan_feedback enable row level security;

create policy "daily_plans_select_own"
on daily_plans for select
using (auth.uid() = user_id);

create policy "daily_plans_insert_own"
on daily_plans for insert
with check (auth.uid() = user_id);

create policy "daily_plans_update_own"
on daily_plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "daily_plans_delete_own"
on daily_plans for delete
using (auth.uid() = user_id);

create policy "daily_plan_feedback_select_own"
on daily_plan_feedback for select
using (auth.uid() = user_id);

create policy "daily_plan_feedback_insert_own"
on daily_plan_feedback for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from daily_plans
    where daily_plans.id = daily_plan_feedback.daily_plan_id
      and daily_plans.user_id = auth.uid()
  )
);

create policy "daily_plan_feedback_update_own"
on daily_plan_feedback for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from daily_plans
    where daily_plans.id = daily_plan_feedback.daily_plan_id
      and daily_plans.user_id = auth.uid()
  )
);

create policy "daily_plan_feedback_delete_own"
on daily_plan_feedback for delete
using (auth.uid() = user_id);
