alter table public.registration_email_deliveries add column if not exists notification_key text not null default 'default';
alter table public.registration_email_deliveries drop constraint if exists registration_email_deliveries_registration_member_id_email_type_key;
create unique index if not exists registration_email_deliveries_unique_key on public.registration_email_deliveries(registration_member_id,email_type,notification_key);
drop function if exists public.claim_registration_email(uuid,text,boolean);

create or replace function public.claim_registration_email(p_registration_member_id uuid,p_email_type text,p_force boolean default false,p_notification_key text default 'default')
returns uuid language plpgsql security definer set search_path='' as $$
declare delivery_id uuid;
begin
  if auth.role()<>'service_role' then raise exception 'Only the server may send registration email.' using errcode='42501'; end if;
  if p_email_type not in ('registration_confirmation','ticket_information','event_update','event_cancelled') then raise exception 'Invalid registration email type.' using errcode='22023'; end if;
  if not exists(
    select 1 from public.registration_members rm join public.registrations r on r.id=rm.registration_id
    join public.events e on e.id=rm.event_id
    where rm.id=p_registration_member_id and (
      (p_email_type='event_cancelled' and e.status='cancelled' and r.status in ('cancelled','refunded'))
      or (rm.active and r.status='confirmed')
    )
  ) then return null; end if;
  insert into public.registration_email_deliveries(registration_member_id,email_type,notification_key,status)
    values(p_registration_member_id,p_email_type,coalesce(p_notification_key,'default'),'sending')
    on conflict(registration_member_id,email_type,notification_key) do update set status='sending',attempt_count=registration_email_deliveries.attempt_count+1,error_message=null,updated_at=now()
      where (p_force and registration_email_deliveries.status in ('sent','failed')) or registration_email_deliveries.status='failed' or (registration_email_deliveries.status='sending' and registration_email_deliveries.updated_at<now()-interval '15 minutes')
    returning id into delivery_id;
  return delivery_id;
end $$;
revoke all on function public.claim_registration_email(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.claim_registration_email(uuid,text,boolean,text) to service_role;
