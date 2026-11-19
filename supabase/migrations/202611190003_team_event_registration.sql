alter table public.events
  add column if not exists team_min integer not null default 2,
  add column if not exists team_max integer not null default 5;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='events_team_size_valid' and conrelid='public.events'::regclass) then
    alter table public.events add constraint events_team_size_valid
      check (team_min between 2 and 50 and team_max between team_min and 50);
  end if;
end $$;
grant select (team_min, team_max) on public.events to anon, authenticated;

create or replace function public.register_team_for_event(p_event_id uuid, p_team_name text, p_member_emails text[], p_phone text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  event_row public.events%rowtype;
  leader_profile public.profiles%rowtype;
  normalized_emails text[];
  participant_ids uuid[];
  total_members integer;
  current_count integer;
  matched_count integer;
  conflict_email text;
  conflict_event text;
  registration_id uuid;
  new_status text;
  total_amount bigint;
begin
  if auth.uid() is null then raise exception 'Sign in to register a team.' using errcode='42501'; end if;
  if p_team_name is null or length(trim(p_team_name)) < 2 or length(trim(p_team_name)) > 60 or p_team_name ~ '[<>]' then
    raise exception 'Enter a team name between 2 and 60 characters.' using errcode='22023';
  end if;

  -- Use the same event-row lock as solo registrations to make team capacity
  -- allocation atomic across individual and group requests.
  select * into event_row from public.events where id=p_event_id and is_public and status <> 'cancelled' for update;
  if not found then raise exception 'Event not found or registration is unavailable.' using errcode='P0002'; end if;
  select * into leader_profile from public.profiles where id=auth.uid();
  if not found or leader_profile.account_type <> 'student' then raise exception 'Only student accounts can register for events.' using errcode='42501'; end if;
  if event_row.status <> 'published' or event_row.starts_at <= now()
    or (event_row.registration_closes_at is not null and event_row.registration_closes_at <= now()) then
    raise exception 'Registration for this event is closed.' using errcode='P0001';
  end if;
  if event_row.registration_type <> 'team' then raise exception 'This event uses individual registration.' using errcode='P0001'; end if;

  normalized_emails := array(
    select lower(trim(email_values.email)) from unnest(coalesce(p_member_emails, array[]::text[])) as email_values(email) order by lower(trim(email_values.email))
  );
  if exists(select 1 from unnest(normalized_emails) as email_values(email) where email_values.email='')
    or cardinality(normalized_emails) <> (select count(distinct email_values.email)::integer from unnest(normalized_emails) as email_values(email))
    or lower(leader_profile.email) = any(normalized_emails) then
    raise exception 'Remove blank or duplicate emails. The team leader is added automatically.' using errcode='22023';
  end if;
  total_members := cardinality(normalized_emails) + 1;
  if total_members < event_row.team_min or total_members > event_row.team_max then
    raise exception 'This event requires a team of % to % members, including you.', event_row.team_min, event_row.team_max using errcode='22023';
  end if;

  select count(*)::integer, array_agg(p.id order by p.id)
    into matched_count, participant_ids
  from public.profiles p join auth.users u on u.id=p.id and u.email_confirmed_at is not null
  where lower(p.email)=any(normalized_emails) and p.account_type='student';
  if matched_count <> cardinality(normalized_emails) then
    raise exception 'Every teammate must have a verified IBA student account in RADES.' using errcode='23503';
  end if;
  participant_ids := array_append(participant_ids, auth.uid());

  -- Release expired checkout holds before duplicate and capacity checks.
  update public.registrations set status='cancelled', updated_at=now()
    where event_id=p_event_id and status='pending_payment' and payment_expires_at <= now();
  update public.registration_members rm set active=false
    from public.registrations r
    where r.id=rm.registration_id and r.event_id=p_event_id and r.status='cancelled'
      and rm.active and r.payment_expires_at is not null and r.payment_expires_at <= now();

  if exists(select 1 from public.registration_members rm join public.registrations r on r.id=rm.registration_id
    where rm.event_id=p_event_id and rm.user_id=any(participant_ids) and rm.active
      and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()))) then
    raise exception 'One or more team members are already registered for this event.' using errcode='23505';
  end if;

  select p.email, e.title into conflict_email, conflict_event
  from public.registration_members rm join public.registrations r on r.id=rm.registration_id
  join public.events e on e.id=rm.event_id join public.profiles p on p.id=rm.user_id
  where rm.user_id=any(participant_ids) and rm.active and rm.event_id<>p_event_id
    and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()))
    and e.status <> 'cancelled' and e.starts_at < event_row.ends_at and e.ends_at > event_row.starts_at
  order by e.starts_at limit 1;
  if conflict_email is not null then
    raise exception 'Schedule conflict: % is registered for % at this time.', conflict_email, conflict_event using errcode='23P01';
  end if;

  if event_row.capacity is not null then
    select count(*)::integer into current_count
    from public.registration_members rm join public.registrations r on r.id=rm.registration_id
    where rm.event_id=p_event_id and rm.active
      and (r.status='confirmed' or (r.status='pending_payment' and r.payment_expires_at>now()));
    if current_count + total_members > event_row.capacity then
      raise exception 'Only % seats remain; this team needs % seats.', greatest(event_row.capacity-current_count,0), total_members using errcode='23514';
    end if;
  end if;

  total_amount := coalesce(event_row.price_pkr,0)::bigint * total_members;
  if total_amount > 2147483647 then raise exception 'The team ticket total exceeds the supported amount.' using errcode='22003'; end if;
  new_status := case when coalesce(event_row.price_pkr,0)=0 then 'confirmed' else 'pending_payment' end;
  insert into public.registrations(event_id,leader_id,registration_type,team_name,status,member_count,amount_pkr,payment_expires_at)
    values(p_event_id,auth.uid(),'team',trim(p_team_name),new_status,total_members,total_amount::integer,
      case when new_status='pending_payment' then now()+interval '15 minutes' else null end)
    returning id into registration_id;

  insert into public.registration_members(registration_id,event_id,user_id,email,display_name,phone,is_leader)
    select registration_id,p_event_id,p.id,lower(p.email),concat_ws(' ',p.first_name,p.last_name),
      case when p.id=auth.uid() then nullif(trim(coalesce(p_phone,'')),'') else null end,p.id=auth.uid()
    from public.profiles p where p.id=any(participant_ids);

  return jsonb_build_object('registrationId',registration_id,'status',new_status,'paymentRequired',new_status='pending_payment','teamSize',total_members);
end $$;
revoke all on function public.register_team_for_event(uuid,text,text[],text) from public;
grant execute on function public.register_team_for_event(uuid,text,text[],text) to authenticated;
