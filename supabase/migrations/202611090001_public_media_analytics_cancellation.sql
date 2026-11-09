-- Public society profiles/media, event-level operational analytics foundations, and cancellation.
alter table public.societies
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;
alter table public.events
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id);

-- The existing event schema has no registration/check-in/payment tables. This records
-- the requested demo refund action without claiming a participant or real payment exists.
create table if not exists public.event_refund_transactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  amount_pkr integer not null default 0 check (amount_pkr >= 0),
  status text not null default 'dummy_recorded' check (status = 'dummy_recorded'),
  note text not null default 'Placeholder only; no payment provider transaction was issued.',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.event_refund_transactions enable row level security;
create policy "event refund placeholders visible to managers" on public.event_refund_transactions
  for select to authenticated using (
    public.is_office() or exists (
      select 1 from public.events e where e.id=event_id and public.is_society_panelist(e.society_id)
    )
  );
grant select on public.event_refund_transactions to authenticated;

-- Society profiles are public only for active societies; social fields can be edited
-- by assigned panelists alongside the existing public profile fields.
revoke update on public.societies from authenticated;
grant update (name, slug, description, contact_email, logo_url, facebook_url, linkedin_url, instagram_url, is_active)
  on public.societies to authenticated;
grant select (id,name,slug,description,logo_url,contact_email,facebook_url,linkedin_url,instagram_url,is_active)
  on public.societies to anon;

-- Make the existing event artwork visible on public event detail/browse pages.
grant select (id,society_id,title,description,category,venue,starts_at,ends_at,status,capacity,price_pkr,registration_type,image_url)
  on public.events to anon;

-- Uploads are public-read, with writes limited by the first path segment:
-- society logos: society ID; event images: society ID.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('rades-media','rades-media',true,8388608,array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "RADES media public read" on storage.objects;
create policy "RADES media public read" on storage.objects for select to anon,authenticated using (bucket_id='rades-media');
drop policy if exists "RADES society admins upload own media" on storage.objects;
create policy "RADES society admins upload own media" on storage.objects for insert to authenticated
with check (
  bucket_id='rades-media' and (storage.foldername(name))[1] in ('society-logos','event-images')
  and public.is_society_panelist(((storage.foldername(name))[2])::uuid)
);
drop policy if exists "RADES OSSIE upload society logos" on storage.objects;
create policy "RADES OSSIE upload society logos" on storage.objects for insert to authenticated
with check (bucket_id='rades-media' and (storage.foldername(name))[1]='society-logos' and public.is_office());

-- Managers can cancel their own society's event; only OSSIE may force-cancel
-- an event after approval/publication. Draft/review events can be cancelled normally.
create or replace function public.enforce_event_workflow() returns trigger
  language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status not in ('draft','pending_patron') or not public.is_society_panelist(new.society_id) then
      raise exception 'Only assigned society admins can create event drafts.' using errcode='42501';
    end if;
    if new.status='pending_patron' and not exists(select 1 from public.society_patrons p where p.society_id=new.society_id) then
      raise exception 'A faculty patron must be assigned before an event is submitted.' using errcode='23514';
    end if;
    return new;
  end if;
  if new.society_id is distinct from old.society_id then raise exception 'An event cannot be moved to another society.' using errcode='42501'; end if;
  if new.status is distinct from old.status then
    if new.status='cancelled' then
      if public.is_office() then return new; end if;
      if (old.status in ('draft','pending_patron','pending_ossie','rejected') or (old.status='published' and old.starts_at>now())) and public.is_society_panelist(old.society_id) then return new; end if;
      raise exception 'Only OSSIE can force-cancel an approved or published event.' using errcode='42501';
    end if;
    if old.status in ('draft','pending_patron','rejected') and new.status in ('draft','pending_patron') and public.is_society_panelist(old.society_id) then
      if new.status='pending_patron' and not exists(select 1 from public.society_patrons p where p.society_id=new.society_id) then raise exception 'A faculty patron must be assigned before an event is submitted.' using errcode='23514'; end if;
      return new;
    end if;
    if old.status='pending_patron' and new.status in ('pending_ossie','rejected') and public.is_society_patron(old.society_id) then return new; end if;
    if old.status='pending_ossie' and new.status in ('published','rejected') and public.is_office() then return new; end if;
    raise exception 'Event approval must follow the patron then OSSIE review sequence.' using errcode='42501';
  end if;
  if old.status in ('draft','pending_patron','rejected') and public.is_society_panelist(old.society_id) then return new; end if;
  if public.is_office() then return new; end if;
  raise exception 'Event details are locked after patron approval.' using errcode='42501';
end $$;

-- OSSIE can create a society and attach its uploaded logo and social URLs atomically.
create or replace function public.create_society_with_patron(
  society_name text, society_slug text, society_description text, society_contact_email text,
  patron_profile_id uuid, society_logo_url text, society_facebook_url text,
  society_linkedin_url text, society_instagram_url text
) returns public.societies language plpgsql security definer set search_path='' as $$
declare created public.societies;
begin
  if not public.is_office() then raise exception 'OSSIE access required.' using errcode='42501'; end if;
  if not exists(select 1 from public.profiles p where p.id=patron_profile_id and p.account_type='faculty') then
    raise exception 'Societies require an assigned faculty patron.' using errcode='23514';
  end if;
  insert into public.societies(name,slug,description,contact_email,logo_url,facebook_url,linkedin_url,instagram_url,created_by)
  values(society_name,society_slug,society_description,society_contact_email,society_logo_url,society_facebook_url,society_linkedin_url,society_instagram_url,auth.uid()) returning * into created;
  insert into public.society_patrons(society_id,user_id,assigned_by) values(created.id,patron_profile_id,auth.uid());
  return created;
end $$;
revoke all on function public.create_society_with_patron(text,text,text,text,uuid,text,text,text,text) from public,anon;
grant execute on function public.create_society_with_patron(text,text,text,text,uuid,text,text,text,text) to authenticated;
