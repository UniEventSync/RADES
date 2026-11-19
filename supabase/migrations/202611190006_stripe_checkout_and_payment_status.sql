create table if not exists public.event_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete restrict,
  checkout_session_id text unique,
  checkout_url text,
  checkout_idempotency_key text not null unique,
  checkout_expires_at timestamptz not null,
  payment_intent_id text unique,
  amount_pkr integer not null check (amount_pkr > 0),
  currency text not null default 'pkr' check (currency='pkr'),
  status text not null default 'pending' check (status in ('pending','paid','failed','refund_pending','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists event_payments_status_idx on public.event_payments(status,updated_at desc);
alter table public.event_payments enable row level security;
drop policy if exists "payments readable by registration participants or event admins" on public.event_payments;
create policy "payments readable by registration participants or event admins" on public.event_payments
  for select to authenticated using (
    exists(select 1 from public.registrations r where r.id=event_payments.registration_id and (
      r.leader_id=(select auth.uid())
      or exists(select 1 from public.registration_members rm where rm.registration_id=r.id and rm.user_id=(select auth.uid()))
      or exists(select 1 from public.events e where e.id=r.event_id and public.is_society_panelist(e.society_id))
    ))
  );
grant select on public.event_payments to authenticated;

create or replace function public.prepare_event_checkout(p_registration_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  reg public.registrations%rowtype;
  payment public.event_payments%rowtype;
  expiry timestamptz;
  attempt_key text;
begin
  if auth.uid() is null then raise exception 'Sign in to start payment.' using errcode='42501'; end if;
  select * into reg from public.registrations where id=p_registration_id for update;
  if not found or reg.leader_id<>auth.uid() then raise exception 'Registration not found.' using errcode='P0002'; end if;
  if reg.status<>'pending_payment' or reg.amount_pkr<=0 then raise exception 'This registration is not waiting for payment.' using errcode='P0001'; end if;
  select * into payment from public.event_payments where registration_id=reg.id for update;
  if found and payment.status='pending' then
    if payment.checkout_expires_at<=now() then raise exception 'The checkout window expired. Register again to reserve a place.' using errcode='P0001'; end if;
    return jsonb_build_object('expiresAt',extract(epoch from payment.checkout_expires_at)::bigint,'idempotencyKey',payment.checkout_idempotency_key);
  end if;
  expiry:=date_trunc('minute',now())+interval '31 minutes';
  attempt_key:='rades-event-registration-'||reg.id::text||'-'||extract(epoch from expiry)::bigint::text;
  insert into public.event_payments(registration_id,checkout_idempotency_key,checkout_expires_at,amount_pkr,currency,status,updated_at)
    values(reg.id,attempt_key,expiry,reg.amount_pkr,'pkr','pending',now());
  update public.registrations set payment_expires_at=expiry,updated_at=now() where id=reg.id;
  return jsonb_build_object('expiresAt',extract(epoch from expiry)::bigint,'idempotencyKey',attempt_key);
end $$;
revoke all on function public.prepare_event_checkout(uuid) from public;
grant execute on function public.prepare_event_checkout(uuid) to authenticated;

create or replace function public.attach_event_checkout_session(
  p_registration_id uuid, p_session_id text, p_checkout_url text, p_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare reg public.registrations%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to start payment.' using errcode='42501'; end if;
  select * into reg from public.registrations where id=p_registration_id for update;
  if not found or reg.leader_id<>auth.uid() then raise exception 'Registration not found.' using errcode='P0002'; end if;
  if reg.status<>'pending_payment' or reg.amount_pkr<=0 then raise exception 'This registration is not waiting for payment.' using errcode='P0001'; end if;
  if p_session_id !~ '^cs_test_' or p_checkout_url !~ '^https://checkout\.stripe\.com/' then raise exception 'Only a Stripe test checkout session can be linked.' using errcode='22023'; end if;
  if p_expires_at<=now() or p_expires_at>now()+interval '32 minutes' then raise exception 'Checkout expiry is outside the allowed time window.' using errcode='22023'; end if;
  insert into public.event_payments(registration_id,checkout_session_id,checkout_url,checkout_idempotency_key,checkout_expires_at,amount_pkr,currency,status,updated_at)
    select reg.id,p_session_id,p_checkout_url,p.checkout_idempotency_key,p.checkout_expires_at,reg.amount_pkr,'pkr','pending',now()
      from public.event_payments p where p.registration_id=reg.id and p.status='pending' and p.checkout_expires_at=p_expires_at
    on conflict(registration_id) do update set checkout_session_id=excluded.checkout_session_id,checkout_url=excluded.checkout_url,
      amount_pkr=excluded.amount_pkr,currency='pkr',status='pending',payment_intent_id=null,updated_at=now(),paid_at=null
      where public.event_payments.status='pending' and public.event_payments.checkout_expires_at=p_expires_at;
  if not found then raise exception 'This registration already has a completed payment.' using errcode='P0001'; end if;
  update public.registrations set payment_expires_at=p_expires_at,updated_at=now() where id=reg.id;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.attach_event_checkout_session(uuid,text,text,timestamptz) from public;
grant execute on function public.attach_event_checkout_session(uuid,text,text,timestamptz) to authenticated;

create or replace function public.release_event_payment_hold(p_registration_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare reg public.registrations%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to manage this registration.' using errcode='42501'; end if;
  select * into reg from public.registrations where id=p_registration_id for update;
  if not found or reg.leader_id<>auth.uid() then raise exception 'Registration not found.' using errcode='P0002'; end if;
  if reg.status='pending_payment' then
    update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now() where id=reg.id;
    update public.registration_members set active=false where registration_id=reg.id and active;
    update public.event_payments set status='failed',updated_at=now() where registration_id=reg.id and status='pending';
  end if;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.release_event_payment_hold(uuid) from public;
grant execute on function public.release_event_payment_hold(uuid) to authenticated;
