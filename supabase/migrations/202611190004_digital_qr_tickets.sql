create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  registration_member_id uuid not null unique references public.registration_members(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'void')),
  created_at timestamptz not null default now(),
  voided_at timestamptz
);

create index if not exists event_tickets_event_status_idx on public.event_tickets(event_id, status);
alter table public.event_tickets enable row level security;
drop policy if exists "tickets readable by attendee or event admin" on public.event_tickets;
create policy "tickets readable by attendee or event admin" on public.event_tickets
  for select to authenticated using (
    exists(select 1 from public.registration_members rm where rm.id=event_tickets.registration_member_id and rm.user_id=(select auth.uid()))
    or exists(select 1 from public.events e where e.id=event_tickets.event_id and public.is_society_panelist(e.society_id))
  );
grant select on public.event_tickets to authenticated;

create or replace function public.sync_event_tickets_for_registration()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  registration_status text;
begin
  select r.status into registration_status from public.registrations r where r.id=new.registration_id;
  if registration_status='confirmed' and new.active then
    insert into public.event_tickets(registration_member_id,event_id)
      values(new.id,new.event_id) on conflict(registration_member_id) do nothing;
  elsif not new.active then
    update public.event_tickets set status='void',voided_at=coalesce(voided_at,now()) where registration_member_id=new.id and status='active';
  end if;
  return new;
end $$;
revoke all on function public.sync_event_tickets_for_registration() from public;

create or replace function public.issue_or_void_registration_tickets()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='confirmed' then
    insert into public.event_tickets(registration_member_id,event_id)
      select rm.id,rm.event_id from public.registration_members rm
      where rm.registration_id=new.id and rm.active
      on conflict(registration_member_id) do update set status='active',voided_at=null;
  elsif new.status in ('cancelled','refunded') then
    update public.event_tickets t set status='void',voided_at=coalesce(t.voided_at,now())
      from public.registration_members rm
      where rm.id=t.registration_member_id and rm.registration_id=new.id and t.status='active';
  end if;
  return new;
end $$;
revoke all on function public.issue_or_void_registration_tickets() from public;

drop trigger if exists registration_member_ticket_sync on public.registration_members;
create trigger registration_member_ticket_sync
  after insert or update of active on public.registration_members
  for each row execute function public.sync_event_tickets_for_registration();

drop trigger if exists registration_ticket_issue on public.registrations;
create trigger registration_ticket_issue
  after update of status on public.registrations
  for each row when (old.status is distinct from new.status)
  execute function public.issue_or_void_registration_tickets();

-- Backfill only ticket rows for already confirmed registrations; user/profile
-- records and passwords are not changed by this migration.
insert into public.event_tickets(registration_member_id,event_id)
  select rm.id,rm.event_id from public.registration_members rm
  join public.registrations r on r.id=rm.registration_id
  where rm.active and r.status='confirmed'
  on conflict(registration_member_id) do nothing;
