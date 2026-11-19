alter table public.event_payments add column if not exists refund_id text unique;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  checkout_session_id text not null,
  outcome text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

create or replace function public.process_stripe_checkout_event(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_registration_id uuid,
  p_user_id uuid,
  p_payment_intent_id text,
  p_amount_total bigint,
  p_currency text,
  p_payment_status text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  payment public.event_payments%rowtype;
  reg public.registrations%rowtype;
  event_status text;
  v_outcome text;
begin
  insert into public.stripe_webhook_events(event_id,event_type,checkout_session_id,outcome)
    values(p_event_id,p_event_type,p_session_id,'processing') on conflict(event_id) do nothing;
  if not found then return jsonb_build_object('outcome','duplicate'); end if;

  select * into payment from public.event_payments where checkout_session_id=p_session_id for update;
  if not found or payment.registration_id<>p_registration_id then v_outcome:='ignored';
  else
    select * into reg from public.registrations where id=payment.registration_id for update;
    if not found or reg.leader_id<>p_user_id then v_outcome:='ignored';
    elsif p_event_type in ('checkout.session.expired','checkout.session.async_payment_failed') then
      if payment.status='pending' and reg.status='pending_payment' then
        update public.event_payments set status='failed',updated_at=now() where id=payment.id;
        update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now() where id=reg.id;
        update public.registration_members set active=false where registration_id=reg.id and active;
        v_outcome:='failed';
      else v_outcome:='already_final'; end if;
    elsif p_event_type in ('checkout.session.completed','checkout.session.async_payment_succeeded') then
      if p_payment_status<>'paid' then v_outcome:='awaiting_payment';
      elsif payment.status='paid' then v_outcome:='already_paid';
      elsif lower(coalesce(p_currency,''))<>'pkr' or p_amount_total<>payment.amount_pkr::bigint*100 or p_payment_intent_id is null then
        update public.event_payments set status='failed',updated_at=now() where id=payment.id and status='pending';
        if reg.status='pending_payment' then
          update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now() where id=reg.id;
          update public.registration_members set active=false where registration_id=reg.id and active;
        end if;
        v_outcome:='amount_mismatch';
      elsif payment.status<>'pending' then v_outcome:='already_final';
      else
        select e.status into event_status from public.events e where e.id=reg.event_id for update;
        if reg.status='cancelled' or reg.status='refunded' or event_status='cancelled' then
          if event_status='cancelled' and reg.status='pending_payment' then
            update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now() where id=reg.id;
            update public.registration_members set active=false where registration_id=reg.id and active;
          end if;
          update public.event_payments set status='refund_pending',payment_intent_id=p_payment_intent_id,paid_at=now(),updated_at=now() where id=payment.id;
          v_outcome:='refund_required';
        elsif reg.status='pending_payment' then
          update public.event_payments set status='paid',payment_intent_id=p_payment_intent_id,paid_at=now(),updated_at=now() where id=payment.id;
          update public.registrations set status='confirmed',payment_expires_at=null,updated_at=now() where id=reg.id;
          v_outcome:='paid';
        else v_outcome:='registration_not_pending'; end if;
      end if;
    else v_outcome:='ignored'; end if;
  end if;
  update public.stripe_webhook_events set outcome=v_outcome,processed_at=now() where event_id=p_event_id;
  return jsonb_build_object('outcome',v_outcome);
end $$;
revoke all on function public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,bigint,text,text) to service_role;

create or replace function public.mark_event_payment_refunded(p_session_id text,p_refund_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  update public.event_payments set status='refunded',refund_id=p_refund_id,updated_at=now()
    where checkout_session_id=p_session_id and status='refund_pending';
  return jsonb_build_object('refunded',found);
end $$;
revoke all on function public.mark_event_payment_refunded(text,text) from public, anon, authenticated;
grant execute on function public.mark_event_payment_refunded(text,text) to service_role;
