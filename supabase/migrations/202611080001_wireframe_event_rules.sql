-- Wireframe alignment: event price/mode, member-only reads, and patron/workflow integrity.
-- This migration is additive and preserves all existing rows and existing migrations.

alter table public.events add column if not exists price_pkr integer not null default 0;
alter table public.events add column if not exists registration_type text not null default 'solo';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='events_price_pkr_nonnegative' and conrelid='public.events'::regclass) then
    alter table public.events add constraint events_price_pkr_nonnegative check (price_pkr >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname='events_registration_type_valid' and conrelid='public.events'::regclass) then
    alter table public.events add constraint events_registration_type_valid check (registration_type in ('solo','team'));
  end if;
end $$;

-- The previous societies policy allowed anon and authenticated to read active rows:
-- create policy "societies active are visible" on public.societies for select to anon,authenticated using (is_active or public.is_office());
drop policy if exists "societies active are visible" on public.societies;
-- The previous events policy granted anon access to published events:
-- create policy "published events public others scoped" on public.events for select to anon,authenticated using (status='published' or public.is_office() or public.is_society_panelist(society_id) or public.is_society_patron(society_id));
drop policy if exists "published events public others scoped" on public.events;
drop policy if exists "signed in societies are visible" on public.societies;
create policy "signed in societies are visible" on public.societies for select to authenticated using (is_active or public.is_office() or public.is_society_panelist(id) or exists(select 1 from public.society_patrons p where p.society_id=id and p.user_id=(select auth.uid())));
create policy "published events signed in others scoped" on public.events for select to authenticated using ((status='published' and ends_at>now() and exists(select 1 from public.societies s where s.id=society_id and s.is_active)) or public.is_office() or public.is_society_panelist(society_id) or public.is_society_patron(society_id));
revoke select on public.societies, public.events from anon;
grant select on public.societies, public.events to authenticated;

/* Previous definition of public.enforce_event_workflow, retained for review/rollback reference:
create function public.enforce_event_workflow() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status not in ('draft','pending_patron') or not public.is_society_panelist(new.society_id) then raise exception 'Only assigned society panelists can create event drafts.' using errcode='42501'; end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if old.status in ('draft','pending_patron') and new.status in ('draft','pending_patron') and public.is_society_panelist(old.society_id) then return new; end if;
    if new.status='pending_patron' and old.status in ('rejected','pending_ossie','published') and public.is_society_panelist(old.society_id) then return new; end if;
    if old.status='pending_patron' and new.status in ('pending_ossie','rejected') and public.is_society_patron(old.society_id) then return new; end if;
    if old.status='pending_ossie' and new.status in ('published','rejected') and public.is_office() then return new; end if;
    raise exception 'Event approval must follow the patron then OSSIE review sequence.' using errcode='42501';
  end if;
  if not public.is_society_panelist(old.society_id) and not public.is_office() then raise exception 'Only assigned panelists can edit event details.' using errcode='42501'; end if;
  return new;
end $$;
*/
create or replace function public.enforce_event_workflow() returns trigger language plpgsql security definer set search_path='' as $$
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
    if old.status in ('draft','pending_patron','rejected') and new.status in ('draft','pending_patron') and public.is_society_panelist(old.society_id) then
      if new.status='pending_patron' and not exists(select 1 from public.society_patrons p where p.society_id=new.society_id) then
        raise exception 'A faculty patron must be assigned before an event is submitted.' using errcode='23514';
      end if;
      return new;
    end if;
    if old.status='pending_patron' and new.status in ('pending_ossie','rejected') and public.is_society_patron(old.society_id) then return new; end if;
    if old.status='pending_ossie' and new.status in ('published','rejected') and public.is_office() then return new; end if;
    raise exception 'Event approval must follow the patron then OSSIE review sequence.' using errcode='42501';
  end if;
  if old.status in ('draft','pending_patron','rejected') and public.is_society_panelist(old.society_id) then return new; end if;
  raise exception 'Event details are locked after patron approval.' using errcode='42501';
end $$;

create or replace function public.protect_last_society_patron() returns trigger language plpgsql security definer set search_path='' as $$
declare patron_count integer;
begin
  if tg_op='DELETE' then
    select count(*) into patron_count from public.society_patrons p where p.society_id=old.society_id;
    if patron_count <= 1 and exists(select 1 from public.societies s where s.id=old.society_id) then
      raise exception 'A society must retain at least one faculty patron.' using errcode='23514';
    end if;
    return old;
  end if;
  if new.society_id is distinct from old.society_id or new.user_id is distinct from old.user_id then
    raise exception 'Patron assignments cannot be moved; assign the replacement patron before removing the current one.' using errcode='23514';
  end if;
  return new;
end $$;
drop trigger if exists society_patron_last_guard on public.society_patrons;
create trigger society_patron_last_guard before delete or update on public.society_patrons for each row execute function public.protect_last_society_patron();

-- Existing societies are not modified or deleted. Assign a faculty patron to any
-- legacy patronless society before applying this migration; fail clearly if one remains.
do $$ begin
  if exists(select 1 from public.societies s where not exists(select 1 from public.society_patrons p where p.society_id=s.id)) then
    raise exception 'Assign at least one faculty patron to every existing society before applying this migration.' using errcode='23514';
  end if;
end $$;

create or replace function public.require_society_patron() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.society_patrons p where p.society_id=new.id) then
    raise exception 'A faculty patron is required to create a society.' using errcode='23514';
  end if;
  return null;
end $$;
drop trigger if exists societies_require_patron on public.societies;
create constraint trigger societies_require_patron after insert on public.societies deferrable initially deferred for each row execute function public.require_society_patron();

create or replace function public.create_society_with_patron(
  society_name text, society_slug text, society_description text, society_contact_email text, patron_profile_id uuid
) returns public.societies language plpgsql security definer set search_path='' as $$
declare created public.societies;
begin
  if not public.is_office() then raise exception 'OSSIE access required.' using errcode='42501'; end if;
  if not exists(select 1 from public.profiles p where p.id=patron_profile_id and p.account_type='faculty') then
    raise exception 'Societies require an assigned faculty patron.' using errcode='23514';
  end if;
  insert into public.societies(name,slug,description,contact_email,created_by)
  values(society_name,society_slug,society_description,society_contact_email,auth.uid()) returning * into created;
  insert into public.society_patrons(society_id,user_id,assigned_by) values(created.id,patron_profile_id,auth.uid());
  return created;
end $$;
revoke all on function public.create_society_with_patron(text,text,text,text,uuid) from public,anon;
grant execute on function public.create_society_with_patron(text,text,text,text,uuid) to authenticated;
