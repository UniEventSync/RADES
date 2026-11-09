-- Ensure event artwork remains readable when the earlier public-media migration
-- was only partially applied.
grant select (id,society_id,title,description,category,venue,starts_at,ends_at,status,capacity,price_pkr,registration_type,image_url)
  on public.events to anon;
grant select on public.events to authenticated;
