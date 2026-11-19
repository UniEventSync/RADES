alter table public.event_refund_transactions
  add column if not exists registration_id uuid references public.registrations(id) on delete restrict,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_refund_id text unique;
alter table public.event_refund_transactions drop constraint if exists event_refund_transactions_status_check;
alter table public.event_refund_transactions add constraint event_refund_transactions_status_check
  check (status in ('dummy_recorded','pending','processing','refunded','failed'));
create unique index if not exists event_refund_transactions_registration_unique
  on public.event_refund_transactions(registration_id) where registration_id is not null;

create or replace function public.cancel_event_and_queue_refunds(p_event_id uuid,p_reason text,p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  event_row public.events%rowtype;
  is_office boolean;
  is_admin boolean;
begin
  if auth.uid() is null or auth.uid()<>p_actor_id then raise exception 'Sign in to cancel this event.' using errcode='42501'; end if;
  if p_reason is null or length(trim(p_reason))<5 or length(trim(p_reason))>1000 then raise exception 'Add a cancellation reason between 5 and 1,000 characters.' using errcode='22023'; end if;
  select * into event_row from public.events where id=p_event_id for update;
  if not found then raise exception 'Event not found.' using errcode='P0002'; end if;
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.global_role in ('office','super_admin')) into is_office;
  select exists(select 1 from public.society_members sm where sm.society_id=event_row.society_id and sm.user_id=auth.uid() and sm.status='active') into is_admin;
  if not is_office and not is_admin then raise exception 'You cannot manage this event.' using errcode='42501'; end if;
  if event_row.status<>'cancelled' and not is_office and event_row.starts_at<=now() then raise exception 'Only OSSIE can force-cancel an event after it has started.' using errcode='42501'; end if;

  if event_row.status<>'cancelled' then
    update public.events set status='cancelled',cancellation_reason=trim(p_reason),cancelled_at=now(),cancelled_by=auth.uid() where id=p_event_id;
    update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now()
      where event_id=p_event_id and status in ('confirmed','pending_payment');
    update public.registration_members rm set active=false
      from public.registrations r where r.id=rm.registration_id and r.event_id=p_event_id and rm.active=true;
    -- Keep pending Checkout sessions pending until Stripe confirms expiry. A session may
    -- already have completed while its webhook is delayed; that payment must be refunded.
    update public.event_payments p set status=case when p.status='paid' then 'refund_pending' else p.status end,updated_at=now()
      from public.registrations r where r.id=p.registration_id and r.event_id=p_event_id and p.status in ('paid','pending');
  end if;

  insert into public.event_refund_transactions(event_id,registration_id,amount_pkr,status,note,created_by,stripe_payment_intent_id)
    select p_event_id,p.registration_id,p.amount_pkr,'pending','Stripe test-mode refund queued for event cancellation.',auth.uid(),p.payment_intent_id
    from public.event_payments p join public.registrations r on r.id=p.registration_id
    where r.event_id=p_event_id and p.status='refund_pending' and p.payment_intent_id is not null
    on conflict(registration_id) where registration_id is not null do nothing;
  return jsonb_build_object('ok',true,'eventId',p_event_id);
end $$;
revoke all on function public.cancel_event_and_queue_refunds(uuid,text,uuid) from public;
grant execute on function public.cancel_event_and_queue_refunds(uuid,text,uuid) to authenticated;

-- Lock in event -> registration -> payment order, matching cancellation. A payment
-- webhook that arrives after cancellation still recognizes a captured payment and queues it.
create or replace function public.process_stripe_checkout_event(
  p_event_id text,p_event_type text,p_session_id text,p_registration_id uuid,p_user_id uuid,
  p_payment_intent_id text,p_amount_total bigint,p_currency text,p_payment_status text
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

  select * into payment from public.event_payments where checkout_session_id=p_session_id;
  if not found or payment.registration_id<>p_registration_id then v_outcome:='ignored';
  else
    select * into reg from public.registrations where id=payment.registration_id;
    if not found or reg.leader_id<>p_user_id then v_outcome:='ignored';
    else
      select e.status into event_status from public.events e where e.id=reg.event_id for update;
      select * into reg from public.registrations where id=payment.registration_id for update;
      select * into payment from public.event_payments where checkout_session_id=p_session_id for update;
      if p_event_type in ('checkout.session.expired','checkout.session.async_payment_failed') then
        if payment.status='pending' and reg.status in ('pending_payment','cancelled') then
          update public.event_payments set status='failed',updated_at=now() where id=payment.id;
          if reg.status='pending_payment' then
            update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now() where id=reg.id;
            update public.registration_members set active=false where registration_id=reg.id and active;
          end if;
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
        elsif reg.status='cancelled' or reg.status='refunded' or event_status='cancelled' then
          if reg.status='pending_payment' then
            update public.registrations set status='cancelled',payment_expires_at=null,updated_at=now() where id=reg.id;
            update public.registration_members set active=false where registration_id=reg.id and active;
          end if;
          update public.event_payments set status='refund_pending',payment_intent_id=p_payment_intent_id,paid_at=now(),updated_at=now() where id=payment.id;
          insert into public.event_refund_transactions(event_id,registration_id,amount_pkr,status,note,created_by,stripe_payment_intent_id)
            values(reg.event_id,reg.id,payment.amount_pkr,'pending','Late Stripe payment after event cancellation; refund queued.',null,p_payment_intent_id)
            on conflict(registration_id) where registration_id is not null do nothing;
          v_outcome:='refund_required';
        elsif reg.status='pending_payment' then
          update public.event_payments set status='paid',payment_intent_id=p_payment_intent_id,paid_at=now(),updated_at=now() where id=payment.id;
          update public.registrations set status='confirmed',payment_expires_at=null,updated_at=now() where id=reg.id;
          v_outcome:='paid';
        else v_outcome:='registration_not_pending'; end if;
      else v_outcome:='ignored'; end if;
    end if;
  end if;
  update public.stripe_webhook_events set outcome=v_outcome,processed_at=now() where event_id=p_event_id;
  return jsonb_build_object('outcome',v_outcome);
end $$;
revoke all on function public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,bigint,text,text) to service_role;

create or replace function public.record_event_refund_result(p_refund_row_id uuid,p_stripe_refund_id text,p_status text,p_failure_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare refund_row public.event_refund_transactions%rowtype;
begin
  if p_status not in ('processing','refunded','failed') then raise exception 'Invalid refund state.' using errcode='22023'; end if;
  select * into refund_row from public.event_refund_transactions where id=p_refund_row_id for update;
  if not found or refund_row.registration_id is null then raise exception 'Refund record not found.' using errcode='P0002'; end if;
  update public.event_refund_transactions set status=p_status,stripe_refund_id=coalesce(p_stripe_refund_id,stripe_refund_id),
    note=case when p_failure_note is null then note else left(note||' '||p_failure_note,1000) end
    where id=refund_row.id;
  if p_status='refunded' then
    update public.event_payments set status='refunded',refund_id=p_stripe_refund_id,updated_at=now() where registration_id=refund_row.registration_id and status in ('refund_pending','refunded');
    update public.registrations set status='refunded',updated_at=now() where id=refund_row.registration_id and status='cancelled';
  elsif p_status='failed' then
    update public.event_payments set status='refund_pending',updated_at=now() where registration_id=refund_row.registration_id and status='refund_pending';
  end if;
  return jsonb_build_object('ok',true,'status',p_status);
end $$;
revoke all on function public.record_event_refund_result(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.record_event_refund_result(uuid,text,text,text) to service_role;
