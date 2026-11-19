create table if not exists public.event_attendance (
  ticket_id uuid primary key references public.event_tickets(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  checked_in_by uuid not null references public.profiles(id) on delete restrict,
  checked_in_at timestamptz not null default now()
);
create index if not exists event_attendance_event_time_idx on public.event_attendance(event_id, checked_in_at desc);
alter table public.event_attendance enable row level security;
drop policy if exists "attendance readable by attendee or event admin" on public.event_attendance;
create policy "attendance readable by attendee or event admin" on public.event_attendance
  for select to authenticated using (
    exists(select 1 from public.event_tickets t join public.registration_members rm on rm.id=t.registration_member_id where t.id=event_attendance.ticket_id and rm.user_id=(select auth.uid()))
    or exists(select 1 from public.events e where e.id=event_attendance.event_id and public.is_society_panelist(e.society_id))
  );
grant select on public.event_attendance to authenticated;

create or replace function public.check_in_event_ticket(p_event_id uuid, p_ticket_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  event_row public.events%rowtype;
  ticket_row public.event_tickets%rowtype;
  attendee public.registration_members%rowtype;
  registration_status text;
  prior_check_in timestamptz;
  office_role boolean;
  newly_checked_in boolean := false;
begin
  if auth.uid() is null then raise exception 'Sign in with an event admin account to check in tickets.' using errcode='42501'; end if;
  select * into event_row from public.events where id=p_event_id for share;
  if not found then raise exception 'Event not found.' using errcode='P0002'; end if;
  select exists(select 1 from public.society_members sm where sm.society_id=event_row.society_id and sm.user_id=auth.uid() and sm.status='active')
    or exists(select 1 from public.profiles p where p.id=auth.uid() and p.global_role in ('office','super_admin')) into office_role;
  if not office_role then raise exception 'Only this society’s active admins can check in event tickets.' using errcode='42501'; end if;
  select * into ticket_row from public.event_tickets where id=p_ticket_id and event_id=p_event_id for update;
  if not found then raise exception 'This ticket does not belong to this event or is not recognized.' using errcode='P0002'; end if;
  select * into attendee from public.registration_members where id=ticket_row.registration_member_id;
  if not found then raise exception 'Ticket attendee information is unavailable.' using errcode='P0002'; end if;
  select status into registration_status from public.registrations where id=attendee.registration_id;
  if event_row.status='cancelled' or ticket_row.status<>'active' or not attendee.active or registration_status<>'confirmed' then
    raise exception 'This ticket has been cancelled or is no longer active.' using errcode='P0001';
  end if;
  select checked_in_at into prior_check_in from public.event_attendance where ticket_id=p_ticket_id;
  if prior_check_in is not null then
    return jsonb_build_object('alreadyCheckedIn',true,'checkedInAt',prior_check_in,'attendee',attendee.display_name,'email',attendee.email);
  end if;
  insert into public.event_attendance(ticket_id,event_id,checked_in_by) values(p_ticket_id,p_event_id,auth.uid())
    on conflict(ticket_id) do nothing returning true into newly_checked_in;
  select checked_in_at into prior_check_in from public.event_attendance where ticket_id=p_ticket_id;
  return jsonb_build_object('alreadyCheckedIn',not coalesce(newly_checked_in,false),'checkedInAt',prior_check_in,'attendee',attendee.display_name,'email',attendee.email);
end $$;
revoke all on function public.check_in_event_ticket(uuid,uuid) from public;
grant execute on function public.check_in_event_ticket(uuid,uuid) to authenticated;
