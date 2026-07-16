begin;

create type content_item_type as enum (
  'book',
  'movie_tv',
  'youtube_video',
  'podcast',
  'tiktok_reel',
  'article',
  'class_course',
  'theater_live',
  'other'
);

create type content_item_status as enum (
  'want_to_consume',
  'consuming',
  'consumed',
  'paused',
  'abandoned'
);

create type content_item_priority as enum ('low', 'medium', 'high');

create table content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type content_item_type not null default 'other',
  status content_item_status not null default 'want_to_consume',
  priority content_item_priority not null default 'medium',
  title varchar(240) not null,
  creator varchar(180),
  url text,
  source_label varchar(120),
  source_url text,
  description text,
  tags jsonb not null default '[]'::jsonb,
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_title_not_blank check (length(btrim(title)) > 0),
  constraint content_items_tags_array check (jsonb_typeof(tags) = 'array'),
  constraint content_items_user_identity_unique unique (id, user_id)
);

create table content_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null,
  raw_note text not null,
  context text,
  ai_rewrite text,
  note_context varchar(160),
  position_label varchar(160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_notes_raw_note_not_blank check (length(btrim(raw_note)) > 0),
  constraint content_notes_item_user_fk
    foreign key (content_item_id, user_id)
    references content_items(id, user_id)
    on delete cascade
);

create index content_items_user_status_updated_idx
  on content_items(user_id, status, updated_at desc);
create index content_items_user_type_idx on content_items(user_id, type);
create index content_items_user_priority_idx on content_items(user_id, priority);
create index content_notes_item_created_idx
  on content_notes(content_item_id, created_at desc);
create index content_notes_user_created_idx
  on content_notes(user_id, created_at desc);

create trigger content_items_set_updated_at
before update on content_items
for each row execute function set_updated_at();

create trigger content_notes_set_updated_at
before update on content_notes
for each row execute function set_updated_at();

alter table content_items enable row level security;
alter table content_notes enable row level security;

create policy content_items_select_own on content_items
for select using (auth.uid() = user_id);
create policy content_items_insert_own on content_items
for insert with check (auth.uid() = user_id);
create policy content_items_update_own on content_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy content_items_delete_own on content_items
for delete using (auth.uid() = user_id);

create policy content_notes_select_own on content_notes
for select using (auth.uid() = user_id);
create policy content_notes_insert_own on content_notes
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from content_items
    where content_items.id = content_item_id
      and content_items.user_id = auth.uid()
  )
);
create policy content_notes_update_own on content_notes
for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (
    select 1 from content_items
    where content_items.id = content_item_id
      and content_items.user_id = auth.uid()
  )
);
create policy content_notes_delete_own on content_notes
for delete using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on table public.content_items, public.content_notes to anon;
grant select, insert, update, delete
on table public.content_items, public.content_notes
to authenticated;

notify pgrst, 'reload schema';

commit;
