begin;

grant usage on schema public to anon, authenticated;

grant select on table public.daily_plans, public.daily_plan_feedback to anon;

grant select, insert, update, delete
on table public.daily_plans, public.daily_plan_feedback
to authenticated;

notify pgrst, 'reload schema';

commit;
