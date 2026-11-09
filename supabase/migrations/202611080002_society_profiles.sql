-- Society panelists can maintain the public-facing society profile fields.
revoke update on public.societies from authenticated;
grant update (name, slug, description, contact_email, is_active) on public.societies to authenticated;
create or replace function public.protect_society_admin_fields() returns trigger
  language plpgsql security definer set search_path=''
as $$
begin
  if not public.is_office() and new.is_active is distinct from old.is_active then
    raise exception 'Only OSSIE can change society availability.' using errcode='42501';
  end if;
  return new;
end $$;
drop trigger if exists societies_protect_admin_fields on public.societies;
create trigger societies_protect_admin_fields before update on public.societies
  for each row execute function public.protect_society_admin_fields();
create policy "panelists update society profiles" on public.societies
  for update to authenticated
  using (public.is_society_panelist(id))
  with check (public.is_society_panelist(id));
