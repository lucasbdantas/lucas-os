create type task_recurrence_type as enum ('none', 'daily', 'weekly', 'monthly');

alter table tasks
add column recurrence_type task_recurrence_type not null default 'none',
add column recurrence_interval integer not null default 1,
add column recurrence_anchor_date date,
add column recurrence_end_date date,
add column recurrence_parent_id uuid references tasks(id) on delete set null;

alter table tasks
add constraint tasks_recurrence_interval_positive
check (recurrence_interval >= 1);

create index tasks_recurrence_parent_idx on tasks (recurrence_parent_id);
create index tasks_user_recurrence_idx on tasks (user_id, recurrence_type, recurrence_parent_id);

create unique index tasks_user_recurrence_parent_due_open_unique
on tasks (user_id, recurrence_parent_id, due_date)
where recurrence_parent_id is not null
  and due_date is not null
  and status in ('todo', 'doing', 'waiting');
