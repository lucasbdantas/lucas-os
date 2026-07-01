create type push_delivery_status as enum ('pending', 'sent', 'failed');

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index push_subscriptions_endpoint_unique
on push_subscriptions (endpoint);

create index push_subscriptions_user_active_idx
on push_subscriptions (user_id, revoked_at);

create trigger push_subscriptions_set_updated_at
before update on push_subscriptions
for each row execute function set_updated_at();

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
on push_subscriptions for select
using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
on push_subscriptions for insert
with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
on push_subscriptions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
on push_subscriptions for delete
using (auth.uid() = user_id);

create table push_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references notifications(id) on delete cascade,
  subscription_id uuid not null references push_subscriptions(id) on delete cascade,
  status push_delivery_status not null default 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index push_notification_deliveries_notification_subscription_unique
on push_notification_deliveries (notification_id, subscription_id);

create index push_notification_deliveries_user_status_idx
on push_notification_deliveries (user_id, status, created_at);

create index push_notification_deliveries_notification_idx
on push_notification_deliveries (notification_id);

alter table push_notification_deliveries enable row level security;

create policy "push_notification_deliveries_select_own"
on push_notification_deliveries for select
using (auth.uid() = user_id);

create policy "push_notification_deliveries_insert_own"
on push_notification_deliveries for insert
with check (auth.uid() = user_id);

create policy "push_notification_deliveries_update_own"
on push_notification_deliveries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "push_notification_deliveries_delete_own"
on push_notification_deliveries for delete
using (auth.uid() = user_id);
