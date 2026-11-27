-- Hide registered-account state from teammate lookup; that route now validates
-- only IBA student email syntax. This migration prevents active society admins
-- from registering for events hosted by their own society.

create or replace function public.get_registration_preflight(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  event_row public.events%rowtype;
  is_student boolean;
  is_society_member boolean;
  is_registered boolean;
  taken integer;
  conflicts jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to register for an event.' using errcode='42501'; end if;
  select * into event_row from public.events where id=p_event_id and is_public and status <> 'cancelled';
  if not found then raise exception 'Event not found or registration is unavailable.' using errcode='P0002'; end if;
  select coalesce(account_type='student', false) into is_student from public.profiles where id=auth.uid();
  select exists(
    select 1 from public.society_members sm
    where sm.society_id=event_row.society_id and sm.user_id=auth.uid() and sm.status='active'
      and is_student
  ) into is_society_member;
  select exists(
    select 1 from public.registration_members rm join public.registrations r on r.id=rm.registration_id
    where rm.event_id=p_event_id and rm.user_id=auth.uid() and rm.active
      and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()))
  ) into is_registered;
  select count(*)::integer into taken
  from public.registration_members rm join public.registrations r on r.id=rm.registration_id
  where rm.event_id=p_event_id and rm.active
    and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()));
  select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'title',e.title,'starts_at',e.starts_at,'ends_at',e.ends_at) order by e.starts_at), '[]'::jsonb)
    into conflicts
  from public.registration_members rm
  join public.registrations r on r.id=rm.registration_id
  join public.events e on e.id=rm.event_id
  where rm.user_id=auth.uid() and rm.active and rm.event_id<>p_event_id
    and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()))
    and e.status <> 'cancelled' and e.starts_at < event_row.ends_at and e.ends_at > event_row.starts_at;
  return jsonb_build_object(
    'isStudent', coalesce(is_student,false),
    'isSocietyMember', coalesce(is_society_member,false),
    'isOpen', event_row.status='published' and event_row.starts_at>now()
      and (event_row.registration_closes_at is null or event_row.registration_closes_at>now()),
    'alreadyRegistered', coalesce(is_registered,false),
    'availableSeats', case when event_row.capacity is null then null else greatest(event_row.capacity-taken,0) end,
    'scheduleConflicts', conflicts,
    'registrationType', event_row.registration_type
  );
end $$;
revoke all on function public.get_registration_preflight(uuid) from public;
grant execute on function public.get_registration_preflight(uuid) to authenticated;

create or replace function public.reject_society_member_event_registration()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists (
    select 1
    from public.events e
    join public.society_members sm on sm.society_id=e.society_id and sm.user_id=new.user_id and sm.status='active'
    join public.profiles p on p.id=sm.user_id and p.account_type='student'
    where e.id=new.event_id
  ) then
    raise exception 'Students who actively manage this society cannot register for its events.' using errcode='42501';
  end if;
  return new;
end $$;

drop trigger if exists registration_members_reject_society_members on public.registration_members;
create trigger registration_members_reject_society_members
  before insert or update of event_id,user_id on public.registration_members
  for each row execute function public.reject_society_member_event_registration();
