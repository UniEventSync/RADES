-- RADES paid registrations must be Stripe-chargeable. Event price is always
-- the amount per person; team registrations multiply it by the confirmed size.
alter table public.events drop constraint if exists events_price_pkr_paid_minimum;
alter table public.events add constraint events_price_pkr_paid_minimum
  check (price_pkr = 0 or price_pkr >= 150);
