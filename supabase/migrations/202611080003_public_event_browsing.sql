-- Let visitors browse active societies and upcoming published events without an account.
-- Authenticated users retain the scoped access rules from 202611080001.

drop policy if exists "active societies public profiles" on public.societies;
create policy "active societies public profiles" on public.societies
  for select to anon using (is_active);

drop policy if exists "upcoming published events public" on public.events;
create policy "upcoming published events public" on public.events
  for select to anon using (
    status = 'published'
    and ends_at > now()
    and exists (
      select 1 from public.societies s
      where s.id = society_id and s.is_active
    )
  );

revoke select on public.societies, public.events from anon;
grant select (id, name, slug, description, logo_url, contact_email, is_active) on public.societies to anon;
grant select (id, society_id, title, description, category, venue, starts_at, ends_at, status, capacity, price_pkr, registration_type) on public.events to anon;
