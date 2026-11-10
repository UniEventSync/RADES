-- Prevent society event overlaps and enforce one-society assignment rules.

-- Public profile fields are read by signed-out Explore Societies pages.
alter table public.societies
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

drop policy if exists "active societies public profiles" on public.societies;
create policy "active societies public profiles" on public.societies
  for select to anon using (is_active);
revoke select on public.societies from anon;
grant select (id,name,slug,description,logo_url,contact_email,facebook_url,linkedin_url,instagram_url,is_active)
  on public.societies to anon;

-- Use half-open intervals: one event may begin exactly when another ends.
-- Cancelled events no longer reserve their previous schedule slot.
create or replace function public.prevent_society_event_overlap() returns trigger
  language plpgsql security definer set search_path=''
as $$
begin
  if new.status <> 'cancelled' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.society_id::text, 0));
    if exists (
      select 1 from public.events e
      where e.society_id = new.society_id
        and e.id is distinct from new.id
        and e.status <> 'cancelled'
        and e.starts_at < new.ends_at
        and e.ends_at > new.starts_at
    ) then
      raise exception 'This society already has an event scheduled during that time.' using errcode='23P01';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists events_prevent_society_overlap on public.events;
create trigger events_prevent_society_overlap
  before insert or update of society_id,starts_at,ends_at,status on public.events
  for each row execute function public.prevent_society_event_overlap();

-- Stop a student admin from actively managing multiple societies.
do $$
begin
  if exists (
    select 1 from public.society_members where status='active'
    group by user_id having count(distinct society_id)>1
  ) then
    raise exception 'Resolve students assigned as active admins to multiple societies before applying this migration.';
  end if;
  if exists (select 1 from public.society_members where status='active' group by society_id having count(*)>3) then
    raise exception 'Resolve societies with more than three active admins before applying this migration.';
  end if;
  if exists (select 1 from public.society_patrons group by society_id having count(*)>1) then
    raise exception 'Resolve societies with multiple patrons before applying this migration.';
  end if;
  if exists (select 1 from public.society_patrons group by user_id having count(distinct society_id)>1) then
    raise exception 'Resolve patrons assigned to multiple societies before applying this migration.';
  end if;
end $$;

create unique index if not exists society_members_one_active_society_per_user
  on public.society_members(user_id) where status='active';
create unique index if not exists society_patrons_one_per_society
  on public.society_patrons(society_id);
create unique index if not exists society_patrons_one_society_per_user
  on public.society_patrons(user_id);

-- Serialize admin additions per society so concurrent requests cannot exceed 3.
create or replace function public.enforce_panelist_limit() returns trigger
  language plpgsql security definer set search_path=''
as $$
declare count_active integer;
begin
  if new.status='active' and new.role='panelist' and
     (tg_op='INSERT' or old.status is distinct from 'active' or old.role is distinct from 'panelist' or old.society_id is distinct from new.society_id) then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.society_id::text, 1));
    select count(*) into count_active from public.society_members m
      where m.society_id=new.society_id and m.status='active' and m.role='panelist'
        and (tg_op<>'UPDATE' or m.id<>new.id);
    if count_active>=3 then
      raise exception 'A society can have up to three active admins.' using errcode='23514';
    end if;
  end if;
  return new;
end $$;

