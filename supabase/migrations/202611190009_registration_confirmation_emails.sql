create table if not exists public.registration_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  registration_member_id uuid not null references public.registration_members(id) on delete restrict,
  email_type text not null check (email_type in ('registration_confirmation','ticket_information','event_update','event_cancelled')),
  status text not null default 'sending' check (status in ('sending','sent','failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  provider_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (registration_member_id,email_type)
);
alter table public.registration_email_deliveries enable row level security;
revoke all on public.registration_email_deliveries from anon,authenticated;

create or replace function public.claim_registration_email(p_registration_member_id uuid,p_email_type text)
returns uuid language plpgsql security definer set search_path='' as $$
declare delivery_id uuid;
begin
  if auth.role()<>'service_role' then raise exception 'Only the server may send registration email.' using errcode='42501'; end if;
  if p_email_type not in ('registration_confirmation','ticket_information','event_update','event_cancelled') then raise exception 'Invalid registration email type.' using errcode='22023'; end if;
  if not exists(select 1 from public.registration_members rm join public.registrations r on r.id=rm.registration_id where rm.id=p_registration_member_id and rm.active and r.status='confirmed') then
    return null;
  end if;
  insert into public.registration_email_deliveries(registration_member_id,email_type,status)
    values(p_registration_member_id,p_email_type,'sending')
    on conflict(registration_member_id,email_type) do update set status='sending',attempt_count=registration_email_deliveries.attempt_count+1,error_message=null,updated_at=now()
      where registration_email_deliveries.status='failed' or (registration_email_deliveries.status='sending' and registration_email_deliveries.updated_at<now()-interval '15 minutes')
    returning id into delivery_id;
  return delivery_id;
end $$;
revoke all on function public.claim_registration_email(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_registration_email(uuid,text) to service_role;

create or replace function public.finish_registration_email(p_delivery_id uuid,p_status text,p_provider_id text,p_error text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.role()<>'service_role' then raise exception 'Only the server may update registration email status.' using errcode='42501'; end if;
  if p_status not in ('sent','failed') then raise exception 'Invalid registration email status.' using errcode='22023'; end if;
  update public.registration_email_deliveries set status=p_status,provider_id=p_provider_id,error_message=case when p_status='failed' then left(coalesce(p_error,'Email delivery failed.'),1000) else null end,
    updated_at=now(),sent_at=case when p_status='sent' then now() else null end where id=p_delivery_id;
end $$;
revoke all on function public.finish_registration_email(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.finish_registration_email(uuid,text,text,text) to service_role;
