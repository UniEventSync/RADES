create or replace function public.guard_event_registration_changes()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  active_seats bigint;
begin
  if new.capacity is not distinct from old.capacity
    and new.price_pkr is not distinct from old.price_pkr
    and new.registration_type is not distinct from old.registration_type then
    return new;
  end if;

  select coalesce(sum(r.member_count), 0)
    into active_seats
    from public.registrations r
    where r.event_id = old.id
      and (
        r.status = 'confirmed'
        or (r.status = 'pending_payment' and r.payment_expires_at > now())
      );

  if new.capacity is not null and active_seats > new.capacity then
    raise exception 'Capacity cannot be lower than the % registered or held seats.', active_seats
      using errcode = '23514';
  end if;

  if active_seats > 0 and (
    new.price_pkr is distinct from old.price_pkr
    or new.registration_type is distinct from old.registration_type
  ) then
    raise exception 'Registration type and price cannot change while registrations or payment holds exist.'
      using errcode = '23514';
  end if;

  return new;
end
$$;

revoke all on function public.guard_event_registration_changes() from public;

drop trigger if exists guard_event_registration_changes on public.events;
create trigger guard_event_registration_changes
  before update of capacity, price_pkr, registration_type on public.events
  for each row execute function public.guard_event_registration_changes();
