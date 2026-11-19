do $$ begin
  if exists(select 1 from public.event_feedback group by event_id,user_id having count(*)>1) then
    raise exception 'Duplicate event feedback exists. Review those submissions before enabling one-response enforcement; no feedback rows were deleted.';
  end if;
end $$;
create unique index if not exists event_feedback_one_per_user_event on public.event_feedback(event_id,user_id);

drop policy if exists "signed in users may submit event feedback" on public.event_feedback;
create policy "checked in participants may submit event feedback" on public.event_feedback
  for insert to authenticated with check (
    user_id=(select auth.uid())
    and exists(select 1 from public.events e where e.id=event_feedback.event_id and e.status<>'cancelled' and e.ends_at<=now())
    and exists(
      select 1 from public.registration_members rm
      join public.registrations r on r.id=rm.registration_id
      join public.profiles p on p.id=rm.user_id and p.account_type='student'
      join public.event_tickets t on t.registration_member_id=rm.id and t.event_id=rm.event_id and t.status='active'
      join public.event_attendance a on a.ticket_id=t.id and a.event_id=rm.event_id
      where rm.event_id=event_feedback.event_id and rm.user_id=(select auth.uid()) and rm.active and r.status='confirmed'
    )
  );

create or replace function public.get_event_feedback_eligibility(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare event_row public.events%rowtype; rating_value smallint;
begin
  if auth.uid() is null then raise exception 'Sign in to check feedback eligibility.' using errcode='42501'; end if;
  select * into event_row from public.events where id=p_event_id;
  if not found then raise exception 'Event not found.' using errcode='P0002'; end if;
  select rating into rating_value from public.event_feedback where event_id=p_event_id and user_id=auth.uid();
  if found then return jsonb_build_object('eligible',false,'submitted',true,'rating',rating_value); end if;
  if event_row.status='cancelled' then return jsonb_build_object('eligible',false,'submitted',false,'reason','Feedback is unavailable because this event was cancelled.'); end if;
  if event_row.ends_at>now() then return jsonb_build_object('eligible',false,'submitted',false,'reason','Feedback opens after the event ends.'); end if;
  if not exists(
    select 1 from public.registration_members rm
    join public.registrations r on r.id=rm.registration_id
    join public.profiles p on p.id=rm.user_id and p.account_type='student'
    join public.event_tickets t on t.registration_member_id=rm.id and t.event_id=rm.event_id and t.status='active'
    join public.event_attendance a on a.ticket_id=t.id and a.event_id=rm.event_id
    where rm.event_id=p_event_id and rm.user_id=auth.uid() and rm.active and r.status='confirmed'
  ) then return jsonb_build_object('eligible',false,'submitted',false,'reason','Feedback is for registered student attendees who checked in to this event.'); end if;
  return jsonb_build_object('eligible',true,'submitted',false);
end $$;
revoke all on function public.get_event_feedback_eligibility(uuid) from public,anon;
grant execute on function public.get_event_feedback_eligibility(uuid) to authenticated;

create or replace function public.submit_event_feedback(p_event_id uuid,p_rating integer,p_comments text)
returns uuid language plpgsql security definer set search_path='' as $$
declare event_row public.events%rowtype; feedback_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to submit event feedback.' using errcode='42501'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'Choose a rating from 1 to 5 stars.' using errcode='22023'; end if;
  if p_comments is null or length(trim(p_comments)) not between 10 and 2000 then raise exception 'Written feedback must be between 10 and 2,000 characters.' using errcode='22023'; end if;
  select * into event_row from public.events where id=p_event_id for share;
  if not found then raise exception 'Event not found.' using errcode='P0002'; end if;
  if event_row.status='cancelled' then raise exception 'Feedback is unavailable because this event was cancelled.' using errcode='P0001'; end if;
  if event_row.ends_at>now() then raise exception 'Feedback opens after the event ends.' using errcode='P0001'; end if;
  if not exists(
    select 1 from public.registration_members rm
    join public.registrations r on r.id=rm.registration_id
    join public.profiles p on p.id=rm.user_id and p.account_type='student'
    join public.event_tickets t on t.registration_member_id=rm.id and t.event_id=rm.event_id and t.status='active'
    join public.event_attendance a on a.ticket_id=t.id and a.event_id=rm.event_id
    where rm.event_id=p_event_id and rm.user_id=auth.uid() and rm.active and r.status='confirmed'
  ) then raise exception 'Feedback is for registered student attendees who checked in to this event.' using errcode='42501'; end if;
  if exists(select 1 from public.event_feedback where event_id=p_event_id and user_id=auth.uid()) then
    raise exception 'You already submitted feedback for this event.' using errcode='23505';
  end if;
  insert into public.event_feedback(event_id,user_id,rating,comments) values(p_event_id,auth.uid(),p_rating,trim(p_comments)) returning id into feedback_id;
  return feedback_id;
end $$;
revoke all on function public.submit_event_feedback(uuid,integer,text) from public,anon;
grant execute on function public.submit_event_feedback(uuid,integer,text) to authenticated;
