create table if not exists public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comments text not null check (length(trim(comments)) between 10 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists event_feedback_event_created_idx on public.event_feedback(event_id,created_at desc);
alter table public.event_feedback enable row level security;
create policy "participants read own and event managers read feedback" on public.event_feedback
  for select to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.events e where e.id=event_feedback.event_id and public.is_society_panelist(e.society_id)) or public.is_office());
create policy "signed in users may submit event feedback" on public.event_feedback
  for insert to authenticated with check (user_id=(select auth.uid()));
grant select,insert on public.event_feedback to authenticated;
