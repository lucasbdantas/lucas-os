alter type public.pending_capture_source
  add value if not exists 'watch';

create or replace function public.create_watch_pending_capture_from_token(
  p_token_hash text,
  p_raw_text text,
  p_device_label text default null,
  p_captured_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_capture_id uuid;
  v_device_label text;
  v_raw_text text;
  v_user_id uuid;
begin
  v_raw_text := btrim(coalesce(p_raw_text, ''));
  v_device_label := nullif(btrim(coalesce(p_device_label, '')), '');

  if p_token_hash is null or length(p_token_hash) <> 64 then
    return null;
  end if;

  if length(v_raw_text) = 0 or length(v_raw_text) > 5000 then
    return null;
  end if;

  if v_device_label is not null and length(v_device_label) > 120 then
    return null;
  end if;

  select user_id
    into v_user_id
  from public.capture_tokens
  where token_hash = p_token_hash
    and revoked_at is null
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  insert into public.pending_captures (
    user_id,
    raw_text,
    source,
    status,
    captured_at,
    parsed_intent
  )
  values (
    v_user_id,
    v_raw_text,
    ('watch'::text)::public.pending_capture_source,
    'pending',
    coalesce(p_captured_at, now()),
    jsonb_build_object(
      'external_capture',
      jsonb_strip_nulls(
        jsonb_build_object(
          'source', 'watch',
          'device_label', v_device_label
        )
      )
    )
  )
  returning id into v_capture_id;

  update public.capture_tokens
    set last_used_at = now()
  where token_hash = p_token_hash
    and revoked_at is null;

  return v_capture_id;
end;
$$;

revoke all on function public.create_watch_pending_capture_from_token(text, text, text, timestamptz) from public;
grant execute on function public.create_watch_pending_capture_from_token(text, text, text, timestamptz) to anon;
grant execute on function public.create_watch_pending_capture_from_token(text, text, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';
