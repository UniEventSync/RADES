-- Societies may exist before OSSIE assigns a faculty patron.
-- Event submission still requires a patron for the review workflow.

alter table public.societies
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

drop trigger if exists societies_require_patron on public.societies;
drop function if exists public.require_society_patron();
drop trigger if exists society_patron_last_guard on public.society_patrons;
drop function if exists public.protect_last_society_patron();

create or replace function public.create_society_with_patron(
  society_name text, society_slug text, society_description text, society_contact_email text,
  patron_profile_id uuid
) returns public.societies language plpgsql security definer set search_path=''
as $$
declare created public.societies;
begin
  if not public.is_office() then raise exception 'OSSIE access required.' using errcode='42501'; end if;
  if patron_profile_id is not null and not exists (
    select 1 from public.profiles p where p.id=patron_profile_id and p.account_type='faculty'
  ) then
    raise exception 'A society patron must have a faculty account.' using errcode='23514';
  end if;
  insert into public.societies(name,slug,description,contact_email,created_by)
    values(society_name,society_slug,society_description,society_contact_email,auth.uid()) returning * into created;
  if patron_profile_id is not null then
    insert into public.society_patrons(society_id,user_id,assigned_by)
      values(created.id,patron_profile_id,auth.uid());
  end if;
  return created;
end $$;
revoke all on function public.create_society_with_patron(text,text,text,text,uuid) from public,anon;
grant execute on function public.create_society_with_patron(text,text,text,text,uuid) to authenticated;

create or replace function public.create_society_with_patron(
  society_name text, society_slug text, society_description text, society_contact_email text,
  patron_profile_id uuid, society_logo_url text, society_facebook_url text,
  society_linkedin_url text, society_instagram_url text
) returns public.societies language plpgsql security definer set search_path=''
as $$
declare created public.societies;
begin
  if not public.is_office() then raise exception 'OSSIE access required.' using errcode='42501'; end if;
  if patron_profile_id is not null and not exists (
    select 1 from public.profiles p where p.id=patron_profile_id and p.account_type='faculty'
  ) then
    raise exception 'A society patron must have a faculty account.' using errcode='23514';
  end if;
  insert into public.societies(name,slug,description,contact_email,logo_url,facebook_url,linkedin_url,instagram_url,created_by)
    values(society_name,society_slug,society_description,society_contact_email,society_logo_url,society_facebook_url,society_linkedin_url,society_instagram_url,auth.uid()) returning * into created;
  if patron_profile_id is not null then
    insert into public.society_patrons(society_id,user_id,assigned_by)
      values(created.id,patron_profile_id,auth.uid());
  end if;
  return created;
end $$;
revoke all on function public.create_society_with_patron(text,text,text,text,uuid,text,text,text,text) from public,anon;
grant execute on function public.create_society_with_patron(text,text,text,text,uuid,text,text,text,text) to authenticated;
