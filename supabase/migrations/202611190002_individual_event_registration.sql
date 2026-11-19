alter table public.events
  add column if not exists registration_closes_at timestamptz;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  registration_type text not null check (registration_type in ('solo', 'team')),
  team_name text,
  status text not null check (status in ('confirmed', 'pending_payment', 'cancelled', 'refunded')),
  member_count integer not null check (member_count > 0),
  amount_pkr integer not null default 0 check (amount_pkr >= 0),
  payment_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registration_members (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  email text not null,
  display_name text not null,
  phone text,
  is_leader boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists registration_members_one_active_event_user
  on public.registration_members(event_id, user_id) where active;
create index if not exists registrations_event_status_idx
  on public.registrations(event_id, status, payment_expires_at);
create index if not exists registration_members_user_active_idx
  on public.registration_members(user_id, active, event_id);

alter table public.registrations enable row level security;
alter table public.registration_members enable row level security;

drop policy if exists "registrations read participants and event admins" on public.registrations;
create policy "registrations read participants and event admins" on public.registrations
  for select to authenticated
  using (
    leader_id = (select auth.uid())
    or exists(select 1 from public.registration_members rm where rm.registration_id = registrations.id and rm.user_id = (select auth.uid()))
    or exists(select 1 from public.events e where e.id = registrations.event_id and public.is_society_panelist(e.society_id))
  );

drop policy if exists "registration members read self and event admins" on public.registration_members;
create policy "registration members read self and event admins" on public.registration_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists(select 1 from public.events e where e.id = registration_members.event_id and public.is_society_panelist(e.society_id))
  );

grant select on public.registrations, public.registration_members to authenticated;

create or replace function public.get_registration_preflight(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  event_row public.events%rowtype;
  is_student boolean;
  is_registered boolean;
  taken integer;
  conflicts jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to register for an event.' using errcode='42501'; end if;
  select * into event_row from public.events where id=p_event_id and is_public and status <> 'cancelled';
  if not found then raise exception 'Event not found or registration is unavailable.' using errcode='P0002'; end if;
  select coalesce(account_type='student', false) into is_student from public.profiles where id=auth.uid();
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

create or replace function public.register_solo_for_event(p_event_id uuid, p_phone text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  event_row public.events%rowtype;
  profile_row public.profiles%rowtype;
  current_count integer;
  conflicting_event text;
  registration_id uuid;
  new_status text;
begin
  if auth.uid() is null then raise exception 'Sign in to register for an event.' using errcode='42501'; end if;

  -- Serialize seat allocation for this event. Every registration path locks
  -- the event row before checking capacity, so the final seat cannot be sold twice.
  select * into event_row from public.events where id=p_event_id and is_public and status <> 'cancelled' for update;
  if not found then raise exception 'Event not found or registration is unavailable.' using errcode='P0002'; end if;
  select * into profile_row from public.profiles where id=auth.uid();
  if not found or profile_row.account_type <> 'student' then raise exception 'Only student accounts can register for events.' using errcode='42501'; end if;
  if event_row.status <> 'published' or event_row.starts_at <= now()
    or (event_row.registration_closes_at is not null and event_row.registration_closes_at <= now()) then
    raise exception 'Registration for this event is closed.' using errcode='P0001';
  end if;
  if event_row.registration_type <> 'solo' then raise exception 'This is a team event. Use team registration.' using errcode='P0001'; end if;

  -- Release expired checkout holds before duplicate and capacity checks.
  update public.registrations set status='cancelled', updated_at=now()
    where event_id=p_event_id and status='pending_payment' and payment_expires_at <= now();
  update public.registration_members rm set active=false
    from public.registrations r
    where r.id=rm.registration_id and r.event_id=p_event_id and r.status='cancelled'
      and rm.active and r.payment_expires_at is not null and r.payment_expires_at <= now();

  if exists(select 1 from public.registration_members rm join public.registrations r on r.id=rm.registration_id
    where rm.event_id=p_event_id and rm.user_id=auth.uid() and rm.active
      and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()))) then
    raise exception 'You are already registered for this event.' using errcode='23505';
  end if;

  select e.title into conflicting_event
  from public.registration_members rm join public.registrations r on r.id=rm.registration_id
  join public.events e on e.id=rm.event_id
  where rm.user_id=auth.uid() and rm.active and rm.event_id<>p_event_id
    and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()))
    and e.status <> 'cancelled' and e.starts_at < event_row.ends_at and e.ends_at > event_row.starts_at
  order by e.starts_at limit 1;
  if conflicting_event is not null then
    raise exception 'Schedule conflict: you are registered for % at this time.', conflicting_event using errcode='23P01';
  end if;

  if event_row.capacity is not null then
    select count(*)::integer into current_count
    from public.registration_members rm join public.registrations r on r.id=rm.registration_id
    where rm.event_id=p_event_id and rm.active
      and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()));
    if current_count >= event_row.capacity then raise exception 'This event is sold out.' using errcode='23514'; end if;
  end if;

  new_status := case when coalesce(event_row.price_pkr,0)=0 then 'confirmed' else 'pending_payment' end;
  insert into public.registrations(event_id,leader_id,registration_type,status,member_count,amount_pkr,payment_expires_at)
    values(p_event_id,auth.uid(),'solo',new_status,1,coalesce(event_row.price_pkr,0),
      case when new_status='pending_payment' then now()+interval '15 minutes' else null end)
    returning id into registration_id;
  insert into public.registration_members(registration_id,event_id,user_id,email,display_name,phone,is_leader)
    values(registration_id,p_event_id,auth.uid(),profile_row.email,concat_ws(' ',profile_row.first_name,profile_row.last_name),nullif(trim(coalesce(p_phone,'')),''),true);
  return jsonb_build_object('registrationId',registration_id,'status',new_status,'paymentRequired',new_status='pending_payment');
end $$;
revoke all on function public.register_solo_for_event(uuid,text) from public;
grant execute on function public.register_solo_for_event(uuid,text) to authenticated;
