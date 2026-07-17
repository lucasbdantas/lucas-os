begin;

create or replace function public.lucas_os_cron_authorized(
  p_secret_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  expected_hash text;
begin
  select decrypted_secret
  into expected_hash
  from vault.decrypted_secrets
  where name = 'lucas_os_cron_secret_hash'
  limit 1;

  return expected_hash is not null and p_secret_hash = expected_hash;
end;
$$;

revoke all on function public.lucas_os_cron_authorized(text)
from public, anon, authenticated;

create or replace function public.claim_due_push_cron_deliveries(
  p_secret_hash text,
  p_now timestamptz default now()
)
returns table (
  delivery_id uuid,
  user_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  notification_id uuid,
  title text,
  body text,
  source_url text
)
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  if not public.lucas_os_cron_authorized(p_secret_hash) then
    raise exception 'cron scheduler is not configured' using errcode = '28000';
  end if;

  return query
  with candidates as (
    select
      notification.user_id,
      notification.id as notification_id,
      subscription.id as subscription_id,
      subscription.endpoint,
      subscription.p256dh,
      subscription.auth,
      notification.title,
      notification.body,
      notification.source_url
    from public.notifications as notification
    join public.tasks as task
      on task.id = case
        when (notification.undo_payload ->> 'task_id') ~ '^[0-9a-fA-F-]{36}$'
          then (notification.undo_payload ->> 'task_id')::uuid
        else null
      end
      and task.user_id = notification.user_id
    join public.push_subscriptions as subscription
      on subscription.user_id = notification.user_id
      and subscription.revoked_at is null
    where notification.type = 'task_reminder'
      and notification.status = 'unread'
      and jsonb_typeof(notification.undo_payload) = 'object'
      and notification.undo_payload ? 'task_id'
      and notification.undo_payload ? 'reminder_at'
      and (notification.undo_payload ->> 'task_id') ~ '^[0-9a-fA-F-]{36}$'
      and (notification.undo_payload ->> 'reminder_at') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
      and (notification.undo_payload ->> 'reminder_at')::timestamptz <= p_now
    order by notification.created_at asc
    limit 200
  ),
  claimed as (
    insert into public.push_notification_deliveries (
      user_id,
      notification_id,
      subscription_id,
      status
    )
    select user_id, notification_id, subscription_id, 'pending'
    from candidates
    on conflict (notification_id, subscription_id) do nothing
    returning id, notification_id, subscription_id
  )
  select
    claimed.id as delivery_id,
    candidates.user_id,
    candidates.subscription_id,
    candidates.endpoint,
    candidates.p256dh,
    candidates.auth,
    candidates.notification_id,
    candidates.title,
    candidates.body,
    candidates.source_url
  from candidates
  left join claimed
    on claimed.notification_id = candidates.notification_id
    and claimed.subscription_id = candidates.subscription_id;
end;
$$;

create or replace function public.complete_push_cron_delivery(
  p_secret_hash text,
  p_delivery_id uuid,
  p_status push_delivery_status,
  p_error text default null,
  p_revoke_subscription boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  delivery_subscription_id uuid;
begin
  if not public.lucas_os_cron_authorized(p_secret_hash) then
    raise exception 'cron scheduler is not configured' using errcode = '28000';
  end if;

  if p_status not in ('sent', 'failed') then
    raise exception 'invalid cron delivery status' using errcode = '22023';
  end if;

  update public.push_notification_deliveries
  set
    status = p_status,
    error = case when p_status = 'failed' then p_error else null end,
    sent_at = case when p_status = 'sent' then now() else null end
  where id = p_delivery_id
  returning subscription_id into delivery_subscription_id;

  if delivery_subscription_id is null then
    raise exception 'cron delivery was not found' using errcode = 'P0002';
  end if;

  if p_revoke_subscription and p_status = 'failed' then
    update public.push_subscriptions
    set revoked_at = now()
    where id = delivery_subscription_id
      and revoked_at is null;
  end if;
end;
$$;

revoke all on function public.claim_due_push_cron_deliveries(text, timestamptz)
from public, authenticated;
revoke all on function public.complete_push_cron_delivery(text, uuid, push_delivery_status, text, boolean)
from public, authenticated;

grant execute on function public.claim_due_push_cron_deliveries(text, timestamptz)
to anon;
grant execute on function public.complete_push_cron_delivery(text, uuid, push_delivery_status, text, boolean)
to anon;

notify pgrst, 'reload schema';

commit;
